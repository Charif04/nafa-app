import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

interface WishlistState {
  items: Product[];
  toggle: (product: Product) => void;
  isLiked: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggle(product) {
        const exists = get().items.some((p) => p.id === product.id);
        set((s) => ({
          items: exists
            ? s.items.filter((p) => p.id !== product.id)
            : [product, ...s.items],
        }));
      },

      isLiked(id) {
        return get().items.some((p) => p.id === id);
      },

      remove(id) {
        set((s) => ({ items: s.items.filter((p) => p.id !== id) }));
      },

      clear() {
        set({ items: [] });
      },
    }),
    { name: 'nafa-wishlist' }
  )
);
