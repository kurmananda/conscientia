// /api/get-registration/route.js

import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';
import { findRegistrationForUser } from '@/lib/registrationLookup';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const email = searchParams.get('email');

  if (!userId && !email) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const supabase = createServerSupabase();

  if (userId) {
    try {
      const data = await findRegistrationForUser(supabase, userId);
      return NextResponse.json({ success: true, data });
    } catch (err) {
      return NextResponse.json({ success: false, message: err.message });
    }
  }

  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, message: error.message });
  }

  return NextResponse.json({ success: true, data });
}
