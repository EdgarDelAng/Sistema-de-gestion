// Cliente REST de Supabase. La clave publishable es pública por diseño.
// La protección de datos debe implementarse mediante RLS y autenticación.
export const SUPABASE_URL = 'https://nsxmferjpuvwnjkloakj.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mAzJjDEZt8VXBWjDNc_fig_icS81maQ';

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });

  const raw = await response.text();
  if (!response.ok) {
    let detail = raw;
    try {
      const parsed = JSON.parse(raw);
      detail = parsed.message || parsed.details || parsed.hint || raw;
    } catch {}
    throw new Error(`Supabase HTTP ${response.status}: ${detail}`);
  }
  return raw ? JSON.parse(raw) : null;
}

export const SupabaseDB = {
  async cargar() {
    return supabaseRequest('school_state?select=collection,payload');
  },
  async guardar(state) {
    return supabaseRequest('rpc/replace_school_state', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ p_state: state })
    });
  }
};
