// /api/get-registration/route.js

import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const email = searchParams.get('email');

  if (!userId && !email) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const query = supabase.from('registrations').select('*');

  const { data, error } = userId
    ? await query.eq('user_id', userId).maybeSingle()
    : await query.eq('email', email.toLowerCase()).maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, message: error.message });
  }

  return NextResponse.json({ success: true, data });
}
