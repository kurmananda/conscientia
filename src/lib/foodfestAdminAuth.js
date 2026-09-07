/**
 * Food Fest admin gate — deliberately separate from the main callsign/
 * `admins`-table system in src/lib/adminAuth.js, since this is a smaller,
 * temporary surface. Requires the signed-in account to be flagged
 * is_admin (same column the main admin system uses) AND a fixed shared
 * password, sent by the client on every request.
 */
export const FOODFEST_ADMIN_PASSWORD = 'meinhibolunga';
export const FOODFEST_PASSWORD_HEADER = 'x-foodfest-password';

function getRequestToken(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return token || null;
}

/** Returns true if the request is from a signed-in is_admin account carrying the food fest password. */
export async function requireFoodfestAdmin(req, supabase) {
  const password = req.headers.get(FOODFEST_PASSWORD_HEADER);
  if (password !== FOODFEST_ADMIN_PASSWORD) return false;

  const token = getRequestToken(req);
  if (!token) return false;

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return false;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (profileError || !profile?.is_admin) return false;

  return true;
}
