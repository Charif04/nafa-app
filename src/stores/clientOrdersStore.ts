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

    // Subscribe without filter — RLS on fetchClientOrders ensures only
    // the user's own orders are returned on re-fetch. No REPLICA IDENTITY
    // requirement. On any change to any order, we re-fetch (safe + simple).
    const channel = supabase
      .channel(`client_orders:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },
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
