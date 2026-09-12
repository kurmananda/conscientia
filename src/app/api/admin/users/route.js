import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * `profiles` has no email column (see supabase_profile_setup.sql — it only
 * ever stores user_id/unique_code/name/phone/college/city); the account's
 * email lives solely in `auth.users`. That's the only lead an admin has for
 * reaching an "Unnamed" registrant who never finished ProfileCompletionModal
 * — so pull it in here via the admin auth API (paginated, since listUsers
 * caps at 1000/page) rather than leaving admins with nothing but a CNS-id.
 */
async function listAllAuthUsers(supabase) {
  // perPage:1000 reliably 500s on this project's Auth Admin API
  // ("Database error finding users"); testing showed even perPage:200
  // fails from page 2 onward — a platform-side data issue past the first
  // ~200 accounts, not fixable here. Keep whatever pages did load instead
  // of discarding all of it (and therefore every user's email) the moment
  // one page fails.
  const perPage = 200;
  const all = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error(`[admin/users] listUsers failed on page ${page}, keeping ${all.length} already fetched`, error);
      break;
    }
    const users = data?.users || [];
    all.push(...users);
    if (users.length < perPage) break;
  }
  return all;
}

/**
 * Admin list/search view: joins profiles with their latest registration and
 * current cart_items, client-side (Supabase JS doesn't do relational joins
 * across these tables since they're only linked by user_id/email, not FKs).
 */
export async function GET(req) {
  try {
    const supabase = createServerSupabase();
    if (!(await requireAdmin(req, supabase))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }


    const [
      { data: profiles, error: profilesError },
      { data: registrations, error: regError },
      { data: cartItems, error: cartError },
      authUsers,
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('updated_at', { ascending: false }),
      supabase.from('registrations').select('*').order('updated_at', { ascending: false }),
      supabase.from('cart_items').select('*'),
      listAllAuthUsers(supabase),
    ]);

    if (profilesError || regError || cartError) {
      console.error('[admin/users]', profilesError || regError || cartError);
      return NextResponse.json(
        { success: false, message: (profilesError || regError || cartError).message },
        { status: 500 }
      );
    }

    const normalizePhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);

    const registrationsByUser = new Map();
    const registrationsByPhone = new Map();
    for (const reg of registrations || []) {
      const key = reg.user_id || reg.email;
      // registrations is already ordered newest-first, keep the first hit per user.
      if (key && !registrationsByUser.has(key)) registrationsByUser.set(key, reg);
      const phone = normalizePhone(reg.details?.phone);
      if (phone.length === 10 && !registrationsByPhone.has(phone)) registrationsByPhone.set(phone, reg);
    }

    const cartByUser = new Map();
    for (const item of cartItems || []) {
      const list = cartByUser.get(item.user_id) || [];
      list.push(item);
      cartByUser.set(item.user_id, list);
    }

    const authById = new Map(authUsers.map((u) => [u.id, u]));

    const users = (profiles || [])
      // A profile row is created the moment someone signs in, before
      // ProfileCompletionModal runs — so a profile with no name never
      // finished it, never got past the modal, and has no registration or
      // payment. Not a real registrant; keep them out of the admin list.
      .filter((profile) => !!(profile.name || '').trim())
      .map((profile) => {
        const authUser = authById.get(profile.user_id) || null;
        // profiles.email (migration 0037) is now the primary source — it's
        // backfilled straight from auth.users via SQL, so it isn't subject
        // to the Auth Admin listUsers API's page-2+ failures. Fall back to
        // the (possibly incomplete, this request) listUsers result, then
        // the registration's own stored email, only if it's missing.
        const profileEmail = (profile.email || '').trim().toLowerCase();
        const authEmail = (authUser?.email || profileEmail || '').trim().toLowerCase();
        const profilePhone = normalizePhone(profile.phone);
        const registration =
          registrationsByUser.get(profile.user_id) ||
          (authEmail ? registrationsByUser.get(authEmail) : null) ||
          // Last resort: match by phone number. This catches a real
          // registrant whose profile exists but whose booking (an excel
          // import, or a checkout done under a different email) was only
          // ever tied to their phone number, not this account's user_id or
          // login email — a real profile is a much better source of truth
          // than showing them as an anonymous "guest".
          (profilePhone.length === 10 ? registrationsByPhone.get(profilePhone) : null) ||
          null;
        return {
          ...profile,
          // Prefer the profile's own stored email (reliable), then a live
          // auth lookup, then whatever email the registration itself was
          // recorded under, rather than ever showing a blank email.
          email: profileEmail || authUser?.email || registration?.email || null,
          auth_created_at: authUser?.created_at || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          registration,
          cart_items: cartByUser.get(profile.user_id) || [],
        };
      });

    // Track matched registrations by every key they could be found under
    // (registrations are unique per email, so email alone is sufficient,
    // but user_id is included too in case a registration only ever set
    // that) so a registration matched to a profile via phone/authEmail
    // above never also shows up a second time as a "guest" row below.
    const usedRegistrationKeys = new Set();
    for (const u of users) {
      if (!u.registration) continue;
      if (u.registration.user_id) usedRegistrationKeys.add(u.registration.user_id);
      if (u.registration.email) usedRegistrationKeys.add(u.registration.email);
    }

    // A paid registration with no matching profile means the person paid
    // via a direct TiQR link/export and never signed into the site — real
    // money, real booking, just no account. Surface them as guest rows so
    // admins can actually see every paid booking, not only ones tied to a
    // finished profile.
    const guestUsers = (registrations || [])
      .filter((reg) => {
        const key = reg.user_id || reg.email;
        return key && !usedRegistrationKeys.has(key) && reg.payment_status === 'paid';
      })
      .map((reg) => ({
        user_id: reg.user_id || `guest:${reg.email}`,
        name: reg.details?.name || '',
        phone: reg.details?.phone || '',
        college: '',
        city: '',
        gender: '',
        unique_code: null,
        accommodation_room: null,
        accommodation_checkin: null,
        accommodation_checkout: null,
        merch_selection: null,
        email: reg.email || null,
        auth_created_at: null,
        last_sign_in_at: null,
        registration: reg,
        cart_items: cartByUser.get(reg.user_id) || [],
        is_guest: true,
      }));

    return NextResponse.json({ success: true, data: [...users, ...guestUsers] });
  } catch (err) {
    console.error('[admin/users]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
