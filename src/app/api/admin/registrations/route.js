import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(req) {
  try {
    const supabase = createServerSupabase();
    if (!(await requireAdmin(req, supabase))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }


    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[admin/registrations]', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (err) {
    console.error('[admin/registrations]', err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
