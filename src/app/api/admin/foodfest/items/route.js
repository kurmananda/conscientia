import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../../_supabase-server';
import { requireFoodfestAdmin } from '@/lib/foodfestAdminAuth';
import { ticketIdForPrice } from '@/lib/foodfestTickets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EDITABLE_FIELDS = ['name', 'description', 'image_url', 'is_available', 'sort_order'];

export async function GET(req) {
  const supabase = createServerSupabase();
  if (!(await requireFoodfestAdmin(req, supabase))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const { data, error } = await supabase.from('foodfest_items').select('*').order('sort_order');
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(req) {
  const supabase = createServerSupabase();
  if (!(await requireFoodfestAdmin(req, supabase))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { stall_id, name, price } = body;
  const ticketId = ticketIdForPrice(price);
  if (!stall_id || !name || !ticketId) {
    return NextResponse.json(
      { success: false, message: 'stall_id, name, and a valid price tier are required.' },
      { status: 400 }
    );
  }
  const changes = {};
  for (const key of EDITABLE_FIELDS) if (key in body) changes[key] = body[key];

  const { data, error } = await supabase
    .from('foodfest_items')
    .insert({ stall_id, name, price, ticket_id: ticketId, ...changes })
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req) {
  const supabase = createServerSupabase();
  if (!(await requireFoodfestAdmin(req, supabase))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });

  const changes = {};
  for (const key of EDITABLE_FIELDS) if (key in body) changes[key] = body[key];

  if ('price' in body) {
    const ticketId = ticketIdForPrice(body.price);
    if (!ticketId) {
      return NextResponse.json({ success: false, message: 'price must be one of the fixed tiers.' }, { status: 400 });
    }
    changes.price = body.price;
    changes.ticket_id = ticketId;
  }

  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ success: false, message: 'No editable fields supplied.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('foodfest_items')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function DELETE(req) {
  const supabase = createServerSupabase();
  if (!(await requireFoodfestAdmin(req, supabase))) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });

  const { error } = await supabase.from('foodfest_items').delete().eq('id', id);
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
