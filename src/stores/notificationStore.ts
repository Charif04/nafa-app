import { create } from 'zustand';
import type { Notification } from '@/types';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationStore {
  notifications: Notification[];
  isLoading: boolean;
  channel: RealtimeChannel | null;
  fetchNotifications: () => Promise<void>;
  subscribeRealtime: (userId: string) => void;
  unsubscribe: () => void;
  getUnreadCount: () => number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body ?? '',
    isRead: row.is_read,
    linkedOrderId: row.linked_order_id ?? undefined,
    createdAt: row.created_at,
  };
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isLoading: false,
  channel: null,

  fetchNotifications: async () => {
    set({ isLoading: true });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ isLoading: false }); return; }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      set({ notifications: data.map(mapNotification) });
    }
    set({ isLoading: false });
  },

  subscribeRealtime: (userId: string) => {
    // Clean up existing channel
    const existing = get().channel;
    if (existing) existing.unsubscribe();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = mapNotification(payload.new);
          set((state) => ({
            notifications: [newNotif, ...state.notifications],
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === payload.new.id ? mapNotification(payload.new) : n
            ),
          }));
        }
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

  getUnreadCount: () => get().notifications.filter((n) => !n.isRead).length,

  markRead: async (id) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  },

  markAllRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  },
}));
