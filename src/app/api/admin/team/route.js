import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  addEventToUserRegistration,
  removeEventFromUserRegistration,
  resolveMemberProfiles,
} from '@/lib/eventTeams';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** GET ?eventId= — every team roster registered for this event, view-only
 * data for the admin Catalog tab's group-event row. */
export async function GET(req) {
  const supabase = createServerSupabase();
  const admin = await requireAdmin(req, supabase);
  if (!admin) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const eventId = (url.searchParams.get('eventId') || '').trim();
  if (!eventId) {
    return NextResponse.json({ success: false, message: 'eventId is required.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('event_teams')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, data: data || [] },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}

/** PATCH { id, memberCodes } — admin-only edit of an already-confirmed
 * team's roster (the user-facing /api/team route refuses this once
 * confirmed). memberCodes must be exactly the event's configured
 * group_size and must include the team's own leader code. Diffs against
 * the previous roster to add/remove the event from each affected
 * teammate's own registrations. */
export async function PATCH(req) {
  try {
    const supabase = createServerSupabase();
    const admin = await requireAdmin(req, supabase);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = body || {};
    const memberCodes = Array.isArray(body.memberCodes)
      ? [...new Set(body.memberCodes.map((c) => String(c).trim().toUpperCase()).filter(Boolean))]
      : [];

    if (!id) {
      return NextResponse.json({ success: false, message: 'id is required.' }, { status: 400 });
    }

    const { data: team } = await supabase.from('event_teams').select('*').eq('id', id).maybeSingle();
    if (!team) {
      return NextResponse.json({ success: false, message: 'Team not found.' }, { status: 404 });
    }

    if (!memberCodes.includes(team.leader_unique_code)) {
      return NextResponse.json(
        { success: false, message: `Roster must include the leader's CNS-id (${team.leader_unique_code}).` },
        { status: 400 }
      );
    }

    const { data: catalogItem } = await supabase
      .from('catalog_items')
      .select('group_size')
      .eq('id', team.event_id)
      .maybeSingle();
    const groupSize = catalogItem?.group_size || 1;

    if (memberCodes.length !== groupSize) {
      return NextResponse.json(
        { success: false, message: `This event needs exactly ${groupSize} participants — you supplied ${memberCodes.length}.` },
        { status: 400 }
      );
    }

    const otherCodes = memberCodes.filter((c) => c !== team.leader_unique_code);
    const { profiles: memberProfiles, missing } = await resolveMemberProfiles(supabase, otherCodes);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `No account found for CNS-id${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.` },
        { status: 400 }
      );
    }

    const previousCodes = new Set(team.member_codes || []);
    const nextCodes = new Set(memberCodes);
    const added = otherCodes.filter((c) => !previousCodes.has(c));
    const removed = (team.member_codes || []).filter(
      (c) => c !== team.leader_unique_code && !nextCodes.has(c)
    );

    const { data: updated, error: updateError } = await supabase
      .from('event_teams')
      .update({ member_codes: memberCodes, confirmed: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
    }

    const addedProfiles = memberProfiles.filter((p) => added.includes(p.unique_code));
    await Promise.all([
      ...addedProfiles.map((p) => addEventToUserRegistration(supabase, p.user_id, team.event_id)),
      ...(removed.length > 0
        ? (await resolveMemberProfiles(supabase, removed)).profiles.map((p) =>
            removeEventFromUserRegistration(supabase, p.user_id, team.event_id)
          )
        : []),
    ]);

    await supabase.from('admin_logs').insert({
      admin_callsign: admin.callsign,
      admin_name: admin?.name || null,
      action: 'update_event_team',
      target_user_id: team.leader_user_id,
      target_email: team.event_id,
      changes: { before: team.member_codes, after: memberCodes },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[admin/team PATCH]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
