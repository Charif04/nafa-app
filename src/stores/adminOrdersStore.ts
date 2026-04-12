import { create } from 'zustand';
import type { Order, OrderStatus } from '@/types';
import { fetchAdminOrders, updateOrderStatus } from '@/lib/api/orders';

export const ADMIN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  in_transit_warehouse: 'at_warehouse',
  at_warehouse: 'delivering',
  delivering: 'delivered',
};

export const ADMIN_TRANSITION_LABELS: Partial<Record<OrderStatus, string>> = {
  in_transit_warehouse: "Confirmer arrivée à l'entrepôt",
  at_warehouse: 'Lancer la livraison',
  delivering: 'Marquer comme livré',
};

interface AdminOrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  // Returns true on success, throws on failure so pages can show error
  advanceStatus: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  getOrder: (id: string) => Order | undefined;
}

export const useAdminOrdersStore = create<AdminOrdersState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await fetchAdminOrders();
      set({ orders, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  advanceStatus: async (orderId) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;
    const next = ADMIN_TRANSITIONS[order.orderStatus];
    if (!next) return;

    // Optimistic update
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id !== orderId ? o : {
          ...o,
          orderStatus: next,
          statusHistory: [
            ...o.statusHistory,
            { status: next, timestamp: new Date().toISOString(), updatedBy: 'admin' },
          ],
        }
      ),
    }));

    try {
      await updateOrderStatus(orderId, next);
    } catch (err) {
      // Rollback optimistic update
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id !== orderId ? o : { ...o, orderStatus: order.orderStatus, statusHistory: order.statusHistory }
        ),
      }));
      // Re-throw so the page can display the error
      throw err;
    }
  },

  cancelOrder: async (orderId) => {
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;
    if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') return;

    // Optimistic update
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id !== orderId ? o : {
          ...o,
          orderStatus: 'cancelled' as OrderStatus,
          statusHistory: [
            ...o.statusHistory,
            { status: 'cancelled' as OrderStatus, timestamp: new Date().toISOString(), updatedBy: 'admin' },
          ],
        }
      ),
    }));

    try {
      await updateOrderStatus(orderId, 'cancelled');
    } catch (err) {
      // Rollback
      set((state) => ({
        orders: state.orders.map((o) =>
          o.id !== orderId ? o : { ...o, orderStatus: order.orderStatus, statusHistory: order.statusHistory }
        ),
      }));
      throw err;
    }
  },

  getOrder: (id) => get().orders.find((o) => o.id === id),
}));
