import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';

// GET route handlers are statically cached by default in the App Router
// unless explicitly opted out — reading the admin header off the raw
// Request object here doesn't count as "using a dynamic API" for Next's
// caching heuristics (only cookies()/headers() from next/headers do), so
// without this, a production build could keep serving one cached snapshot
// of the catalog indefinitely regardless of what's actually changed in the
// DB since. Forcing dynamic + no-store guarantees every request hits the
// database fresh.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Admin catalog listing: every row in `tickets` (type workshop/event) is a
 * catalog item, whether or not it has content yet — `tickets` is the only
 * place an item's existence, price, and ticket id are defined, and it's
 * managed directly in the database, never through this portal. Rows with
 * no matching `catalog_items` row are returned with blank content fields
 * so the admin can see and fill them in.
 */
export async function GET(req) {
  const supabase = createServerSupabase();
  const admin = await requireAdmin(req, supabase);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: tickets, error: ticketsError }, { data: content, error: contentError }] =
    await Promise.all([
      supabase.from('tickets').select('*').in('type', ['workshop', 'event']),
      supabase.from('catalog_items').select('*'),
    ]);

  if (ticketsError) {
    return NextResponse.json({ success: false, message: ticketsError.message }, { status: 500 });
  }
  if (contentError) {
    return NextResponse.json({ success: false, message: contentError.message }, { status: 500 });
  }

  const contentById = Object.fromEntries((content || []).map((row) => [row.id, row]));

  const items = (tickets || []).map((ticket) => ({
    id: ticket.id,
    kind: ticket.type,
    price: ticket.cost,
    ticket_id: ticket.ticket_id,
    ...(contentById[ticket.id] || {}),
    // contentById spread above may have its own `id`/`kind` — keep the
    // ticket's, they're the same value but tickets is authoritative.
    id: ticket.id,
    kind: ticket.type,
  }));

  // Same order the public site uses (see catalogStore.getCatalog): by
  // sort_order within each kind, items with no content row (so no
  // sort_order yet) pushed to the end instead of interleaved randomly.
  items.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
    const av = a.sort_order ?? Infinity;
    const bv = b.sort_order ?? Infinity;
    return av - bv;
  });

  return NextResponse.json(
    { success: true, data: items },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}

// price and ticket_id are never accepted here — they live in `tickets`,
// managed directly in the database. The admin UI's per-field "skip" toggle
// works by simply omitting that key from `fields`.
const EDITABLE_FIELDS = [
  'title',
  'subtitle',
  'type',
  'section',
  'section_color',
  'duration',
  'seats',
  'eligibility',
  'venue',
  'timing',
  'image',
  'badge_icon',
  'accent_color',
  'glow_color',
  'foil_gradient',
  'description',
  'about_extra',
  'highlights',
  'requirements',
  'format',
  'certificate',
  'tags',
  'brochure_url',
  'prize_pool',
  'event_date',
  'group_size',
  'strike_price',
  'layout',
  'contacts',
  'access',
  'sort_order',
  'hidden_fields',
];

/**
 * Upserts a catalog_items content row for one ticket id. Upsert (not
 * update) because a ticket added directly to the database may not have a
 * content row yet — the first save from the admin portal creates it. Only
 * EDITABLE_FIELDS keys present in the request body are written — any field
 * the admin left out (via the "skip" option in the UI) is untouched.
 */
export async function PATCH(req) {
  try {
    const supabase = createServerSupabase();
    const admin = await requireAdmin(req, supabase);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, kind, fields } = body || {};

    if (!id || !['workshop', 'event'].includes(kind) || !fields || typeof fields !== 'object') {
      return NextResponse.json(
        { success: false, message: 'id, kind ("workshop"|"event"), and fields are required.' },
        { status: 400 }
      );
    }

    const changes = {};
    for (const key of Object.keys(fields)) {
      if (!EDITABLE_FIELDS.includes(key)) continue;
      changes[key] = fields[key];
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No editable fields supplied.' },
        { status: 400 }
      );
    }

    const { data: before } = await supabase
      .from('catalog_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    const { data: updated, error } = await supabase
      .from('catalog_items')
      .upsert(
        {
          id,
          kind,
          title: before?.title || '(untitled)',
          ...changes,
          updated_at: new Date().toISOString(),
          updated_by: admin.callsign,
        },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('[admin/catalog PATCH]', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    await supabase.from('admin_logs').insert({
      admin_callsign: admin.callsign,
      admin_name: admin?.name || null,
      action: 'update_catalog_item',
      target_user_id: null,
      target_email: id,
      changes: { before: before ? pick(before, Object.keys(changes)) : null, after: changes },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/catalog PATCH]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj[k];
  return out;
}
