export function getSupabaseRestConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Environment Supabase belum tersedia.");
  }

  return { url: url.replace(/\/$/, ""), key };
}

export async function supabaseRestFetch(path, { method = "GET", headers = {}, ...options } = {}) {
  const { url, key } = getSupabaseRestConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase HTTP ${response.status}: ${body.slice(0, 1000)}`);
  }

  return response;
}
