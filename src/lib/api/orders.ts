import { supabase } from '@/lib/supabase';
import { formatOrderId } from '@/lib/utils';
import type { Order, OrderStatus, Currency, PaymentMethod, PaymentStatus } from '@/types';

// Select string réutilisable pour toutes les requêtes orders
const ORDER_SELECT = `
  id, client_id, vendor_id, subtotal, delivery_fee, total, currency,
  delivery_street, delivery_city, delivery_region, delivery_country,
  payment_method, payment_status, order_status, created_at,
  items:order_items(product_id, title, price, quantity, image),
  history:order_status_history(status, created_at, updated_by),
  client:profiles!orders_client_id_fkey(first_name, last_name, phone),
  vendor:profiles!orders_vendor_id_fkey(phone, vendor_profiles(shop_name))
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrder(row: any): Order {
  const shopName = Array.isArray(row.vendor?.vendor_profiles)
    ? row.vendor.vendor_profiles[0]?.shop_name
    : row.vendor?.vendor_profiles?.shop_name;

  const clientName = row.client
    ? `${row.client.first_name} ${row.client.last_name}`.trim()
    : undefined;
  const clientPhone = row.client?.phone ?? undefined;
  const vendorPhone = row.vendor?.phone ?? undefined;

  return {
    id: row.id,
    clientId: row.client_id,
    clientName,
    clientPhone,
    vendorId: row.vendor_id,
    vendorName: shopName,
    vendorPhone,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (row.items ?? []).map((item: any) => ({
      productId: item.product_id ?? '',
      title: item.title,
      price: Number(item.price),
      quantity: item.quantity,
      image: item.image ?? '',
    })),
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    currency: row.currency as Currency,
    deliveryAddress: {
      street: row.delivery_street,
      city: row.delivery_city,
      region: row.delivery_region ?? '',
      country: row.delivery_country,
    },
    paymentMethod: row.payment_method as PaymentMethod,
    paymentStatus: row.payment_status as PaymentStatus,
    orderStatus: row.order_status as OrderStatus,
    statusHistory: [...(row.history ?? [])]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((h: any) => ({
        status: h.status as OrderStatus,
        timestamp: h.created_at,
        updatedBy: h.updated_by ?? 'system',
      })),
    createdAt: row.created_at,
  };
}

export async function fetchVendorOrders(vendorId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function fetchClientOrders(clientId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Commande passée',
  confirmed: 'Commande confirmée',
  preparing: 'En préparation',
  in_transit_warehouse: 'En route vers l\'entrepôt',
  at_warehouse: 'À l\'entrepôt NAFA',
  delivering: 'En cours de livraison',
  delivered: 'Commande livrée 🎉',
  cancelled: 'Commande annulée',
};

// Helper: insert notification in DB + fire push via server-side API route
// The API route uses service_role key — bypasses RLS for cross-user inserts
async function sendNotification(userId: string, type: string, title: string, body: string, orderId?: string, pushUrl?: string) {
  try {
    const base = typeof window !== 'undefined' ? '' : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    await fetch(`${base}/api/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, url: pushUrl ?? '/', type, linkedOrderId: orderId }),
    });
  } catch { /* non-critical */ }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // 1. Update order status
  const { error } = await db.from('orders').update({ order_status: status }).eq('id', orderId);
  if (error) throw error;

  // 2. Fetch order details for notifications
  const { data: order } = await db
    .from('orders')
    .select('client_id, vendor_id')
    .eq('id', orderId)
    .single();
  if (!order) return;

  const label = STATUS_LABELS[status] ?? 'Mise à jour de commande';
  const orderLabel = formatOrderId(orderId);

  // 3. Client — notified on every status change
  void sendNotification(
    order.client_id,
    'order_status',
    label,
    `Commande ${orderLabel} — ${label}`,
    orderId,
    `/profile/orders/${orderId}`
  );

  // 4. Vendor notifications
  // ↳ at_warehouse : commande arrivée à l'entrepôt NAFA
  if (status === 'at_warehouse') {
    void sendNotification(
      order.vendor_id,
      'order_status',
      "Colis à l'entrepôt NAFA",
      `Commande ${orderLabel} est bien arrivée à l'entrepôt NAFA et va être traitée.`,
      orderId,
      `/vendor/orders/${orderId}`
    );
  }
  // ↳ delivered : commande livrée au client
  if (status === 'delivered') {
    void sendNotification(
      order.vendor_id,
      'order_delivered',
      'Commande livrée ✓',
      `Commande ${orderLabel} a été livrée au client avec succès.`,
      orderId,
      `/vendor/orders/${orderId}`
    );
  }
  // ↳ cancelled
  if (status === 'cancelled') {
    void sendNotification(
      order.vendor_id,
      'order_cancelled',
      'Commande annulée',
      `Commande ${orderLabel} a été annulée.`,
      orderId,
      `/vendor/orders/${orderId}`
    );
  }

  // 5. Admin notifications — logistique clé
  const adminStatuses: OrderStatus[] = ['in_transit_warehouse', 'at_warehouse', 'delivered', 'cancelled'];
  if (adminStatuses.includes(status)) {
    const { data: admins } = await db.from('profiles').select('id').eq('role', 'admin');
    const adminTitle =
      status === 'in_transit_warehouse' ? 'Colis en route vers l\'entrepôt' :
      status === 'at_warehouse'         ? 'Colis arrivé à l\'entrepôt' :
      status === 'delivered'            ? 'Commande livrée' :
                                          'Commande annulée';
    for (const admin of admins ?? []) {
      void sendNotification(
        admin.id,
        'order_status',
        adminTitle,
        `Commande ${orderLabel} — ${label}`,
        orderId,
        `/admin/orders/${orderId}`
      );
    }
  }

  // 6. Trigger background alert check after every status change
  try {
    const base = typeof window !== 'undefined' ? '' : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    void fetch(`${base}/api/check-alerts`, { method: 'POST' });
  } catch { /* non-critical */ }
}

export async function createOrder(payload: {
  clientId: string;
  vendorId: string;
  items: Array<{ productId: string; title: string; price: number; quantity: number; image: string }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryRegion: string;
  deliveryCountry: string;
  paymentMethod: PaymentMethod;
}): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Insert order
  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      client_id: payload.clientId,
      vendor_id: payload.vendorId,
      subtotal: payload.subtotal,
      delivery_fee: payload.deliveryFee,
      total: payload.total,
      currency: payload.currency,
      delivery_street: payload.deliveryStreet,
      delivery_city: payload.deliveryCity,
      delivery_region: payload.deliveryRegion || null,
      delivery_country: payload.deliveryCountry,
      payment_method: payload.paymentMethod,
      payment_status: 'paid',
      order_status: 'placed',
    })
    .select('id')
    .single();

  if (orderError || !order) throw orderError ?? new Error('Order creation failed');

  // Insert items
  const { error: itemsError } = await db
    .from('order_items')
    .insert(
      payload.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId || null,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.image || null,
      }))
    );

  if (itemsError) throw itemsError;

  // Notify vendor — new order received
  void sendNotification(
    payload.vendorId,
    'new_order',
    'Nouvelle commande !',
    `Une nouvelle commande ${formatOrderId(order.id)} vient d'être passée.`,
    order.id,
    `/vendor/orders/${order.id}`
  );

  // Check low stock for ordered products — notify vendor if any product is faible
  try {
    const productIds = payload.items.map((it) => it.productId).filter(Boolean);
    if (productIds.length > 0) {
      const { data: products } = await db
        .from('products')
        .select('id, title, stock')
        .in('id', productIds);
      for (const p of products ?? []) {
        if (p.stock !== null && p.stock <= 5 && p.stock > 0) {
          void sendNotification(
            payload.vendorId,
            'low_stock',
            'Stock faible',
            `Le produit "${p.title}" n'a plus que ${p.stock} unité${p.stock > 1 ? 's' : ''} en stock.`,
            undefined,
            `/vendor/products`
          );
        } else if (p.stock === 0) {
          void sendNotification(
            payload.vendorId,
            'low_stock',
            'Produit épuisé',
            `Le produit "${p.title}" est épuisé. Pensez à réapprovisionner.`,
            undefined,
            `/vendor/products`
          );
        }
      }
    }
  } catch { /* non-critical */ }

  return order.id;
}
