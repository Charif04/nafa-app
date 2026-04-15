'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToPush, unsubscribeFromPush, registerServiceWorker } from '@/lib/pushNotifications';

/**
 * Registers the service worker, requests push permission, and subscribes
 * the logged-in user to Web Push. Placed inside the client layout so it
 * only runs for authenticated users.
 */
export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const subscribed = useRef(false);

  useEffect(() => {
    // Register SW immediately so it's ready to handle push events
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (isLoading || !user?.uid || subscribed.current) return;

    // Subscribe after a short delay to avoid prompting on first page load
    const timer = setTimeout(() => {
      subscribeToPush(user.uid).then((ok) => {
        if (ok) subscribed.current = true;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [user?.uid, isLoading]);

  // Clean up subscription on logout
  useEffect(() => {
    if (!isLoading && !user && subscribed.current) {
      subscribed.current = false;
    }
  }, [user, isLoading]);

  return <>{children}</>;
}
