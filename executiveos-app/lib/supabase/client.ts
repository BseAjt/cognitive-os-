import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

/**
 * Magic links are frequently opened from an email application or a different
 * browser context. An implicit link carries the short-lived session in the URL
 * fragment, so it does not depend on a PKCE verifier stored by the browser that
 * requested the email. The confirmation page immediately persists the session
 * in the same cookie storage used by the SSR client and removes the fragment.
 */
export function createMagicLinkClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;
  return createBrowserClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
