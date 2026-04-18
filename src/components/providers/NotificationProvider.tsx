'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

/**
 * Fetches notifications and subscribes to Realtime for the current user.
 * Must be inside an authenticated layout.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { fetchNotifications, subscribeRealtime, unsubscribe } = useNotificationStore();

  useEffect(() => {
    if (!user?.uid) return;
    void fetchNotifications();
    subscribeRealtime(user.uid);
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return <>{children}</>;
}
