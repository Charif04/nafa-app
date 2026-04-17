import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface CategoryItem {
  id: string;
  name: string;   // slug
  label: string;  // display name
}

const ALL: CategoryItem = { id: 'all', name: 'all', label: 'Tous' };

// Fallback used while loading or on error
const FALLBACK: CategoryItem[] = [
  { id: 'all', name: 'all', label: 'Tous' },
  { id: 'mode', name: 'mode', label: 'Mode' },
  { id: 'électronique', name: 'électronique', label: 'Électronique' },
  { id: 'maison', name: 'maison', label: 'Maison' },
  { id: 'beauté', name: 'beauté', label: 'Beauté' },
  { id: 'sport', name: 'sport', label: 'Sport' },
  { id: 'alimentation', name: 'alimentation', label: 'Alimentation' },
  { id: 'artisanat', name: 'artisanat', label: 'Artisanat' },
  { id: 'bijoux', name: 'bijoux', label: 'Bijoux' },
  { id: 'autre', name: 'autre', label: 'Autre' },
];

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(FALLBACK);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('categories')
      .select('id, name, label')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }: { data: CategoryItem[] | null }) => {
        if (data && data.length > 0) {
          setCategories([ALL, ...data]);
        }
      });
  }, []);

  return categories;
}
