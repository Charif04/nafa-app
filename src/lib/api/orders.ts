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

  // 3. Notify client on every status change
  void sendNotification(
    order.client_id,
    'order_status',
    label,
    `Commande ${orderLabel} — ${label}`,
    orderId,
    `/profile/orders/${orderId}`
  );

  // 4. Notify vendor when order is delivered or cancelled
  if (status === 'delivered' || status === 'cancelled') {
    void sendNotification(
      order.vendor_id,
      status === 'delivered' ? 'order_delivered' : 'order_cancelled',
      status === 'delivered' ? `Commande livrée` : `Commande annulée`,
      `Commande ${orderLabel} a été ${status === 'delivered' ? 'livrée au client' : 'annulée'}.`,
      orderId,
      `/vendor/orders/${orderId}`
    );
  }

  // 5. Notify admin when parcel arrives at warehouse or is cancelled
  if (status === 'at_warehouse' || status === 'cancelled') {
    const { data: admins } = await db
      .from('profiles')
      .select('id')
      .eq('role', 'admin');
    for (const admin of admins ?? []) {
      void sendNotification(
        admin.id,
        'order_status',
        status === 'at_warehouse' ? `Colis à l'entrepôt` : `Commande annulée`,
        `Commande ${orderLabel} — ${label}`,
        orderId,
        `/admin/orders/${orderId}`
      );
    }
  }
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

  return order.id;
}
