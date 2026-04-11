import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus, Currency, PaymentMethod, PaymentStatus } from '@/types';

// Select string réutilisable pour toutes les requêtes orders
const ORDER_SELECT = `
  id, client_id, vendor_id, subtotal, delivery_fee, total, currency,
  delivery_street, delivery_city, delivery_region, delivery_country,
  payment_method, payment_status, order_status, created_at,
  items:order_items(product_id, title, price, quantity, image),
  history:order_status_history(status, created_at, updated_by),
  client:profiles!orders_client_id_fkey(first_name, last_name),
  vendor:profiles!orders_vendor_id_fkey(vendor_profiles(shop_name))
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrder(row: any): Order {
  const shopName = Array.isArray(row.vendor?.vendor_profiles)
    ? row.vendor.vendor_profiles[0]?.shop_name
    : row.vendor?.vendor_profiles?.shop_name;

  const clientName = row.client
    ? `${row.client.first_name} ${row.client.last_name}`.trim()
    : undefined;

  return {
    id: row.id,
    clientId: row.client_id,
    clientName,
    vendorId: row.vendor_id,
    vendorName: shopName,
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
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
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

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('orders')
    .update({ order_status: status })
    .eq('id', orderId);

  if (error) throw error;
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

  return order.id;
}
