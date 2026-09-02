// Shared by /api/team (user-facing) and /api/admin/team (admin edits).

/** Merges eventId into a teammate's own registrations row, same union
 * semantics as /api/save-registration, without touching payment fields
 * they don't otherwise have. */
export async function addEventToUserRegistration(supabase, userId, eventId) {
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authUser?.user?.email) return;
  const email = authUser.user.email.toLowerCase();

  const { data: existing } = await supabase
    .from('registrations')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  const existingIds = Array.isArray(existing?.workshop_ids) ? existing.workshop_ids : [];
  if (existingIds.includes(eventId)) return;

  await supabase.from('registrations').upsert(
    [
      {
        email,
        user_id: userId,
        workshop_ids: [...new Set([...existingIds, eventId])],
        details: existing?.details || {},
        payment_id: existing?.payment_id || null,
        order_id: existing?.order_id || null,
        amount: existing?.amount || 0,
        status: existing?.status || 'confirmed',
        payment_status: existing?.payment_status || 'team',
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'email' }
  );
}

/** Removes eventId from a teammate's own registrations row — used when an
 * admin drops someone from a team roster. Leaves the row itself in place
 * (they may have other registrations), just drops this one id. */
export async function removeEventFromUserRegistration(supabase, userId, eventId) {
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError || !authUser?.user?.email) return;
  const email = authUser.user.email.toLowerCase();

  const { data: existing } = await supabase
    .from('registrations')
    .select('workshop_ids')
    .eq('email', email)
    .maybeSingle();

  const existingIds = Array.isArray(existing?.workshop_ids) ? existing.workshop_ids : [];
  if (!existingIds.includes(eventId)) return;

  await supabase
    .from('registrations')
    .update({ workshop_ids: existingIds.filter((id) => id !== eventId), updated_at: new Date().toISOString() })
    .eq('email', email);
}

/** Looks up a batch of CNS-ids and resolves them to { user_id, unique_code}
 * rows, for validating a team roster before writing it. */
export async function resolveMemberProfiles(supabase, codes) {
  if (codes.length === 0) return { profiles: [], missing: [] };
  const { data } = await supabase.from('profiles').select('user_id, unique_code').in('unique_code', codes);
  const found = new Set((data || []).map((p) => p.unique_code));
  return { profiles: data || [], missing: codes.filter((c) => !found.has(c)) };
}
