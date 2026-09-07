import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../../_supabase-server';
import { requireFoodfestAdmin } from '@/lib/foodfestAdminAuth';

export async function POST(req) {
  const supabase = createServerSupabase();
  const ok = await requireFoodfestAdmin(req, supabase);
  if (!ok) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
