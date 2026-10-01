// Shared by /api/get-registrations and /api/team.

/**
 * Finds an account's registrations row. Rows are keyed on email, and many
 * were written without a user_id (imported bookings, webhook saves where the
 * TiQR meta_data had no user_id), so a user_id-only lookup reports those
 * people as unregistered — they can't manage their team, and paid items stay
 * in their cart. Fall back to the account's login email and link the row to
 * the account so later user_id lookups (including client-side ones) find it.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase service-role client
 * @param {string} userId
 * @param {string} [email] login email, if the caller already has it
 * @param {string} [columns]
 */
export async function findRegistrationForUser(supabase, userId, email, columns = '*') {
  const { data: byUser } = await supabase
    .from('registrations')
    .select(columns)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (byUser) return byUser;

  let loginEmail = email;
  if (!loginEmail) {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    loginEmail = authUser?.user?.email;
  }
  if (!loginEmail) return null;
  const normalized = loginEmail.trim().toLowerCase();

  const { data: byEmail } = await supabase
    .from('registrations')
    .select('email, user_id')
    .eq('email', normalized)
    .maybeSingle();
  // Only claim a row nobody owns — never re-point one linked to another account.
  if (!byEmail || (byEmail.user_id && byEmail.user_id !== userId)) return null;

  if (!byEmail.user_id) {
    await supabase
      .from('registrations')
      .update({ user_id: userId })
      .eq('email', normalized)
      .is('user_id', null);
  }

  const { data: linked } = await supabase
    .from('registrations')
    .select(columns)
    .eq('email', normalized)
    .maybeSingle();
  return linked;
}
