import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency, Language } from '@/types';

interface UiStore {
  language: Language;
  currency: Currency;
  theme: 'light' | 'dark';
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      language: 'fr',
      currency: 'FCFA',
      theme: 'light',
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'nafa-ui' }
  )
);
