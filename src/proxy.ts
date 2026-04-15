import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Routes publiques — accessibles sans session.
 * Tout le reste nécessite une authentification Supabase valide.
 */
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets, Next.js internals — skip immediately
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Public routes — no auth required
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // For all other routes, verify session via Supabase cookies
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getSession() reads from the cookie — no network call
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Not authenticated — redirect to login, preserving the intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
