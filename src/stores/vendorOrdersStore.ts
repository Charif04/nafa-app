import { create } from 'zustand';
import type { Order, OrderStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { fetchVendorOrders, updateOrderStatus } from '@/lib/api/orders';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const VENDOR_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'confirmed',
  confirmed: 'preparing',
  preparing: 'in_transit_warehouse',
};

export const VENDOR_TRANSITION_LABELS: Partial<Record<OrderStatus, string>> = {
  placed: 'Confirmer la commande',
  confirmed: 'Démarrer la préparation',
  preparing: "Envoyer vers l'entrepôt NAFA",
};

interface VendorOrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  channel: RealtimeChannel | null;
  fetchOrders: () => Promise<void>;
  advanceStatus: (orderId: string) => Promise<void>;
  getOrder: (id: string) => Order | undefined;
  subscribeRealtime: (userId: string) => void;
  unsubscribe: () => void;
}

export const useVendorOrdersStore = create<VendorOrdersState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  channel: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const orders = await fetchVendorOrders(user.id);
      set({ orders, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  advanceStatus: async (orderId) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;
    const next = VENDOR_TRANSITIONS[order.orderStatus];
    if (!next) return;

    // Optimistic update
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id !== orderId ? o : {
          ...o,
          orderStatus: next,
          statusHistory: [
            ...o.statusHistory,
            { status: next, timestamp: new Date().toISOString(), updatedBy: 'vendor' },
          ],
        }
      ),
    }));

    try {
      await updateOrderStatus(orderId, next);
    } catch {
      // Rollback on error
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id !== orderId ? o : { ...o, orderStatus: order.orderStatus, statusHistory: order.statusHistory }
        ),
      }));
    }
  },

  getOrder: (id) => get().orders.find((o) => o.id === id),

  subscribeRealtime: (userId: string) => {
    const existing = get().channel;
    if (existing) existing.unsubscribe();

    const channel = supabase
      .channel(`vendor_orders:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `vendor_id=eq.${userId}` },
        () => { void get().fetchOrders(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `vendor_id=eq.${userId}` },
        () => { void get().fetchOrders(); }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          const fallback = supabase
            .channel(`vendor_orders_fallback:${userId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
              () => { void get().fetchOrders(); }
            )
            .subscribe();
          set({ channel: fallback });
        }
      });

    set({ channel });
  },

  unsubscribe: () => {
    const channel = get().channel;
    if (channel) {
      channel.unsubscribe();
      set({ channel: null });
    }
  },
}));
