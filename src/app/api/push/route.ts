import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

webpush.setVapidDetails(
  'mailto:noreply@nafamarket.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url = '/home' } = await request.json() as {
      userId: string;
      title: string;
      body: string;
      url?: string;
    };

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service-role key to bypass RLS for reading subscriptions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        setAll() {},
      },
    });

    // Fetch all push subscriptions for the user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subs } = await (supabase as any)
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const payload = JSON.stringify({ title, body, url });

    const results = await Promise.allSettled(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subs.map((sub: any) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ sent });
  } catch (err) {
    console.error('[push API]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
