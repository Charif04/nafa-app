import { create } from 'zustand';
import type { Order } from '@/types';
import { supabase } from '@/lib/supabase';
import { fetchClientOrders } from '@/lib/api/orders';

interface ClientOrdersStore {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  getOrder: (id: string) => Order | undefined;
}

export const useClientOrdersStore = create<ClientOrdersStore>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

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
}));
