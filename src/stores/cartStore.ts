import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';
import { calculateDeliveryFee, clientPrice } from '@/lib/utils';

export interface VendorGroup {
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  getTotalItems: () => number;
  getVendorGroups: () => VendorGroup[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === newItem.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId
                  ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...newItem, quantity: 1 }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getVendorGroups: () => {
        const map = new Map<string, VendorGroup>();
        get().items.forEach((item) => {
          if (!map.has(item.vendorId)) {
            map.set(item.vendorId, {
              vendorId: item.vendorId,
              vendorName: item.vendorName ?? 'Boutique',
              items: [],
              subtotal: 0,
              deliveryFee: 0,
              total: 0,
            });
          }
          map.get(item.vendorId)!.items.push(item);
        });
        map.forEach((g) => {
          g.subtotal = g.items.reduce((s, i) => s + clientPrice(i.price) * i.quantity, 0);
          g.deliveryFee = calculateDeliveryFee(g.subtotal);
          g.total = g.subtotal + g.deliveryFee;
        });
        return [...map.values()];
      },

      getSubtotal: () =>
        get().items.reduce((sum, item) => sum + clientPrice(item.price) * item.quantity, 0),

      // Sum delivery fees per vendor group (each vendor has its own delivery threshold)
      getDeliveryFee: () =>
        get().getVendorGroups().reduce((s, g) => s + g.deliveryFee, 0),

      getTotal: () => get().getSubtotal() + get().getDeliveryFee(),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'nafa-cart' }
  )
);
