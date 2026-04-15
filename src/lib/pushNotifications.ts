'use client';

import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

// Convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) buffer[i] = rawData.charCodeAt(i);
  return buffer.buffer;
}

// Register the service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.error('[push] SW registration failed:', err);
    return null;
  }
}

// Request notification permission from the user
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

// Subscribe to Web Push and persist to Supabase
export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return false;

    const reg = await registerServiceWorker();
    if (!reg) return false;

    // Wait for the service worker to be active
    await navigator.serviceWorker.ready;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const { endpoint, keys } = subscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    // Save subscription to Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: navigator.userAgent,
        },
        { onConflict: 'user_id,endpoint' }
      );

    return true;
  } catch (err) {
    console.error('[push] Subscribe failed:', err);
    return false;
  }
}

// Unsubscribe from push (e.g., on logout)
export async function unsubscribeFromPush(userId: string): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);
    }
  } catch (err) {
    console.error('[push] Unsubscribe failed:', err);
  }
}

// Show a local notification via the service worker (foreground/background tab)
export async function showLocalNotification(title: string, body: string, url = '/home'): Promise<void> {
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [100, 50, 100],
      data: { url },
      tag: 'nafa-notification',
      renotify: true,
    } as NotificationOptions);
  } catch (err) {
    console.error('[push] showLocalNotification failed:', err);
  }
}
