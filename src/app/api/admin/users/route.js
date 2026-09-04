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
  const perPage = 1000;
  let page = 1;
  const all = [];
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('[admin/users] listUsers', error);
      break;
    }
    const users = data?.users || [];
    all.push(...users);
    if (users.length < perPage) break;
    page += 1;
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

    const registrationsByUser = new Map();
    for (const reg of registrations || []) {
      const key = reg.user_id || reg.email;
      if (!key) continue;
      // registrations is already ordered newest-first, keep the first hit per user.
      if (!registrationsByUser.has(key)) registrationsByUser.set(key, reg);
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
        const registration =
          registrationsByUser.get(profile.user_id) || registrationsByUser.get(profile.email) || null;
        const authUser = authById.get(profile.user_id) || null;
        return {
          ...profile,
          email: authUser?.email || null,
          auth_created_at: authUser?.created_at || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          registration,
          cart_items: cartByUser.get(profile.user_id) || [],
        };
      });

    return NextResponse.json({ success: true, data: users });
  } catch (err) {
    console.error('[admin/users]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
