import { create } from 'zustand';
import type { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import { fetchClientOrders } from '@/lib/api/orders';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ClientOrdersStore {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  channel: RealtimeChannel | null;
  fetchOrders: () => Promise<void>;
  getOrder: (id: string) => Order | undefined;
  subscribeRealtime: (userId: string) => void;
  unsubscribe: () => void;
}

export const useClientOrdersStore = create<ClientOrdersStore>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,
  channel: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const orders = await fetchClientOrders(user.id);
      set({ orders, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  getOrder: (id) => get().orders.find((o) => o.id === id),

  subscribeRealtime: (userId: string) => {
    const existing = get().channel;
    if (existing) existing.unsubscribe();

    const channel = supabase
      .channel(`client_orders:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `client_id=eq.${userId}` },
        () => { void get().fetchOrders(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `client_id=eq.${userId}` },
        () => { void get().fetchOrders(); }
      )
      .subscribe();

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
