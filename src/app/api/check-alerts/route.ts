import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatOrderId } from '@/lib/utils';

// Service role — bypasses RLS for cross-user reads/writes
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ONE_HOUR_MS = 60 * 60 * 1000;
// Low stock threshold for vendor notifications
const LOW_STOCK_THRESHOLD = 5;
// Number of cancellations that triggers a high_cancellation alert
const CANCELLATION_THRESHOLD = 3;

// ── helpers ──────────────────────────────────────────────────────────────────

async function notifyUser(userId: string, type: string, title: string, body: string, orderId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    linked_order_id: orderId ?? null,
    is_read: false,
  });
}

/** Creates an alert only if no active (unresolved) alert of the same type+order already exists */
async function createAlertIfNew(
  type: string,
  severity: 'warning' | 'critical',
  description: string,
  relatedOrderId?: string,
  relatedVendorId?: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;
  let query = dbAny
    .from('alerts')
    .select('id')
    .eq('type', type)
    .eq('is_resolved', false);

  if (relatedOrderId) query = query.eq('related_order_id', relatedOrderId);
  else if (relatedVendorId) query = query.eq('related_vendor_id', relatedVendorId);

  const { data: existing } = await query.limit(1);
  if (existing && existing.length > 0) return false; // already exists

  await dbAny.from('alerts').insert({
    type,
    severity,
    description,
    related_order_id: relatedOrderId ?? null,
    related_vendor_id: relatedVendorId ?? null,
    is_resolved: false,
  });
  return true;
}

// ── main handler ─────────────────────────────────────────────────────────────

export async function POST() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;
    const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS).toISOString();

    // ── 1. Vendor inactive: order in 'placed' > 1 hour without confirmation ──
    const { data: stalePlaced } = await dbAny
      .from('orders')
      .select('id, vendor_id')
      .eq('order_status', 'placed')
      .lt('created_at', oneHourAgo);

    for (const order of stalePlaced ?? []) {
      await createAlertIfNew(
        'vendor_inactive',
        'warning',
        `La commande ${formatOrderId(order.id)} n'a pas été confirmée par le vendeur depuis plus d'1 heure.`,
        order.id,
        order.vendor_id
      );
    }

    // ── 2. Delivery late: order in 'in_transit_warehouse' > 1 hour ──────────
    // Check order_status_history to find when the status was set
    const { data: transitHistory } = await dbAny
      .from('order_status_history')
      .select('order_id, created_at')
      .eq('status', 'in_transit_warehouse')
      .lt('created_at', oneHourAgo);

    for (const h of transitHistory ?? []) {
      // Only act if the order is STILL in_transit_warehouse
      const { data: currentOrder } = await dbAny
        .from('orders')
        .select('id, vendor_id')
        .eq('id', h.order_id)
        .eq('order_status', 'in_transit_warehouse')
        .maybeSingle();

      if (currentOrder) {
        await createAlertIfNew(
          'delivery_late',
          'critical',
          `La commande ${formatOrderId(currentOrder.id)} est en route vers l'entrepôt depuis plus d'1 heure sans être arrivée.`,
          currentOrder.id,
          currentOrder.vendor_id
        );
      }
    }

    // ── 3. High cancellation rate: vendor with ≥ CANCELLATION_THRESHOLD ─────
    const { data: cancelledOrders } = await dbAny
      .from('orders')
      .select('id, vendor_id')
      .eq('order_status', 'cancelled');

    if (cancelledOrders) {
      const countByVendor: Record<string, { count: number; ids: string[] }> = {};
      for (const o of cancelledOrders) {
        if (!countByVendor[o.vendor_id]) countByVendor[o.vendor_id] = { count: 0, ids: [] };
        countByVendor[o.vendor_id].count++;
        countByVendor[o.vendor_id].ids.push(o.id);
      }
      for (const [vendorId, { count }] of Object.entries(countByVendor)) {
        if (count >= CANCELLATION_THRESHOLD) {
          await createAlertIfNew(
            'high_cancellation',
            'warning',
            `Ce vendeur a ${count} commandes annulées. Un suivi est recommandé.`,
            undefined,
            vendorId
          );
        }
      }
    }

    // ── 4. Low stock: notify vendors whose products are running low ───────────
    const { data: lowStockProducts } = await dbAny
      .from('products')
      .select('id, title, stock, vendor_id')
      .lte('stock', LOW_STOCK_THRESHOLD)
      .eq('is_deleted', false);

    for (const p of lowStockProducts ?? []) {
      if (p.stock === 0) {
        // Only notify once per product (check if a recent notification exists)
        const { data: existing } = await dbAny
          .from('notifications')
          .select('id')
          .eq('user_id', p.vendor_id)
          .eq('type', 'low_stock')
          .ilike('body', `%${p.title}%épuisé%`)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);
        if (!existing || existing.length === 0) {
          await notifyUser(p.vendor_id, 'low_stock', 'Produit épuisé', `"${p.title}" est épuisé. Pensez à réapprovisionner.`);
        }
      } else if (p.stock <= LOW_STOCK_THRESHOLD) {
        const { data: existing } = await dbAny
          .from('notifications')
          .select('id')
          .eq('user_id', p.vendor_id)
          .eq('type', 'low_stock')
          .ilike('body', `%${p.title}%`)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);
        if (!existing || existing.length === 0) {
          await notifyUser(p.vendor_id, 'low_stock', 'Stock faible', `"${p.title}" n'a plus que ${p.stock} unité${p.stock > 1 ? 's' : ''} en stock.`);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[check-alerts]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
