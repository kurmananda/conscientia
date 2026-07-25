import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

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


    const [{ data: profiles, error: profilesError }, { data: registrations, error: regError }, { data: cartItems, error: cartError }] =
      await Promise.all([
        supabase.from('profiles').select('*').order('updated_at', { ascending: false }),
        supabase.from('registrations').select('*').order('updated_at', { ascending: false }),
        supabase.from('cart_items').select('*'),
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

    const users = (profiles || []).map((profile) => {
      const registration =
        registrationsByUser.get(profile.user_id) || registrationsByUser.get(profile.email) || null;
      return {
        ...profile,
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
