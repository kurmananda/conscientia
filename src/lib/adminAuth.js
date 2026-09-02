// Admin authorization, checked fresh on every admin API request (not just
// at login): the client sends its callsign (verified once client-side at
// login) via the `x-admin-callsign` header, AND its Supabase auth session
// via the `Authorization: Bearer` header. Both must check out — the
// callsign must be a real row in `admins`, and the signed-in account must
// be flagged is_admin in `profiles` — or the request is rejected. Requiring
// the live session on every call (not just at login) means a leaked/sniffed
// callsign alone is useless without also being signed into a flagged
// account; it can't be replayed indefinitely from another device.
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

/** Reads the bearer token the client sent, from the Authorization header. */
function getRequestToken(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return token || null;
}

/**
 * Verifies the callsign sent by the client is a real row in `admins` AND
 * that the signed-in account making the request is flagged is_admin.
 * Returns the admin record ({ callsign, name, role }) or null.
 */
export async function requireAdmin(req, supabase) {
  const callsign = getRequestCallsign(req);
  const token = getRequestToken(req);
  if (!callsign || !token) return null;

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (profileError || !profile?.is_admin) return null;

  const { data, error } = await supabase
    .from('admins')
    .select('callsign, name, role')
    .eq('callsign', callsign)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
