// Simple admin authorization: the client sends its callsign (verified once
// client-side against the `admins` table at login) back on every admin API
// request via the `x-admin-callsign` header. The server re-checks that
// callsign against the `admins` table before allowing the request through —
// no signed cookies, no crypto, no env-var secret. A random guesser without a
// real callsign in the `admins` table is still rejected.
export const ADMIN_HEADER = 'x-admin-callsign';

/** Reads the callsign the client sent, from header or query param. */
export function getRequestCallsign(req) {
  const header = req.headers.get(ADMIN_HEADER);
  if (header) return header.trim();
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('admin_callsign');
    return q ? q.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Verifies the callsign sent by the client is a real row in `admins`.
 * Returns the admin record ({ callsign, name, role }) or null.
 */
export async function requireAdmin(req, supabase) {
  const callsign = getRequestCallsign(req);
  if (!callsign) return null;

  const { data, error } = await supabase
    .from('admins')
    .select('callsign, name, role')
    .eq('callsign', callsign)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
