import { createClient } from '@supabase/supabase-js';

// Lazy getter — only creates the client when first called, not at module load time.
// This prevents "supabaseUrl is required" crashes when env vars aren't loaded yet.
export const supabase = (() => {
  let client: ReturnType<typeof createClient> | null = null;
  return () => {
    if (!client) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        throw new Error(
          'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
        );
      }
      client = createClient(url, key);
    }
    return client;
  };
})();

// Server-side client (for API routes)
export const createServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
    );
  }
  return createClient(url, key);
};

