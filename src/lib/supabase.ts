import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser Supabase client.
 * Uses @supabase/ssr's createBrowserClient which stores the session in
 * both localStorage AND cookies — cookies are required for the middleware
 * to verify authentication server-side before the page is served.
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
