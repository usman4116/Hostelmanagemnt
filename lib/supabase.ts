import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const COOKIE_CHUNK_SIZE = 3000;
const MAX_COOKIE_CHUNKS = 12;

function readCookie(name: string) {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );

  return match?.[1] ?? null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

function createCookieStorage() {
  return {
    getItem(key: string) {
      if (typeof document === "undefined") {
        return null;
      }

      const legacyValue = readCookie(key);
      if (legacyValue !== null) {
        return decodeURIComponent(legacyValue);
      }

      let combined = "";
      for (let index = 0; index < MAX_COOKIE_CHUNKS; index += 1) {
        const chunk = readCookie(`${key}.${index}`);
        if (chunk === null) break;
        combined += chunk;
      }

      return combined ? decodeURIComponent(combined) : null;
    },
    setItem(key: string, value: string) {
      if (typeof document === "undefined") {
        return;
      }

      clearCookie(key);
      for (let index = 0; index < MAX_COOKIE_CHUNKS; index += 1) {
        clearCookie(`${key}.${index}`);
      }

      const encoded = encodeURIComponent(value);
      const chunks = encoded.match(new RegExp(`.{1,${COOKIE_CHUNK_SIZE}}`, "g")) ?? [];
      chunks.forEach((chunk, index) => {
        document.cookie = `${key}.${index}=${chunk}; path=/; SameSite=Lax; Max-Age=31536000`;
      });
    },
    removeItem(key: string) {
      if (typeof document === "undefined") {
        return;
      }

      clearCookie(key);
      for (let index = 0; index < MAX_COOKIE_CHUNKS; index += 1) {
        clearCookie(`${key}.${index}`);
      }
    },
  };
}

export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: createCookieStorage(),
      storageKey: "sb-auth-token",
    },
  });
}

export const supabase = createBrowserClient();
