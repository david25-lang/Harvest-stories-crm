import { createBrowserClient } from "@supabase/ssr";

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: SupabaseBrowserClient | undefined;

const missingConfigurationMessage =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

export function createClient() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      browserClient = new Proxy({} as SupabaseBrowserClient, {
        get() {
          throw new Error(missingConfigurationMessage);
        },
      });

      return browserClient;
    }

    browserClient = createBrowserClient(
      url,
      key,
    );
  }

  return browserClient;
}