import { NextResponse } from 'next/server';
import { createServerSupabase } from '../../_supabase-server';
import { requireAdmin } from '@/lib/adminAuth';
import { addEventToUserRegistration, removeEventFromUserRegistration } from '@/lib/eventTeams';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * POST { eventId, fromCode, toCode } — moves one participant slot on an
 * event/workshop registration from one CNS-id to another. Works for both
 * solo (group_size = 1) and team events, and for the leader (the person who
 * actually paid) as well as ordinary members — the admin Registrants tab is
 * the only caller, gated behind a confirmation warning client-side since
 * this can reassign who the paying registrant is.
 */
export async function POST(req) {
  try {
    const supabase = createServerSupabase();
    const admin = await requireAdmin(req, supabase);
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const eventId = (body.eventId || '').trim();
    const fromCode = String(body.fromCode || '').trim().toUpperCase();
    const toCode = String(body.toCode || '').trim().toUpperCase();

    if (!eventId || !fromCode || !toCode) {
      return NextResponse.json(
        { success: false, message: 'eventId, fromCode, and toCode are required.' },
        { status: 400 }
      );
    }
    if (fromCode === toCode) {
      return NextResponse.json({ success: false, message: 'toCode must differ from fromCode.' }, { status: 400 });
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, unique_code')
      .in('unique_code', [fromCode, toCode]);
    const fromProfile = (profiles || []).find((p) => p.unique_code === fromCode);
    const toProfile = (profiles || []).find((p) => p.unique_code === toCode);

    if (!fromProfile) {
      return NextResponse.json({ success: false, message: `No account found for CNS-id ${fromCode}.` }, { status: 400 });
    }
    if (!toProfile) {
      return NextResponse.json({ success: false, message: `No account found for CNS-id ${toCode}.` }, { status: 400 });
    }

    const { data: fromRegistration } = await supabase
      .from('registrations')
      .select('workshop_ids')
      .eq('user_id', fromProfile.user_id)
      .maybeSingle();
    const fromIds = Array.isArray(fromRegistration?.workshop_ids) ? fromRegistration.workshop_ids : [];
    if (!fromIds.includes(eventId)) {
      return NextResponse.json(
        { success: false, message: `${fromCode} is not registered for this event.` },
        { status: 400 }
      );
    }

    const { data: team } = await supabase
      .from('event_teams')
      .select('*')
      .eq('event_id', eventId)
      .or(`leader_unique_code.eq.${fromCode},member_codes.cs.{${fromCode}}`)
      .maybeSingle();

    await removeEventFromUserRegistration(supabase, fromProfile.user_id, eventId);
    await addEventToUserRegistration(supabase, toProfile.user_id, eventId);

    let updatedTeam = null;
    if (team) {
      const isLeader = team.leader_unique_code === fromCode;
      const nextMemberCodes = (team.member_codes || []).map((c) => (c === fromCode ? toCode : c));
      const fields = { member_codes: nextMemberCodes, updated_at: new Date().toISOString() };
      if (isLeader) {
        fields.leader_user_id = toProfile.user_id;
        fields.leader_unique_code = toCode;
      }
      const { data: teamUpdate, error: teamError } = await supabase
        .from('event_teams')
        .update(fields)
        .eq('id', team.id)
        .select()
        .maybeSingle();
      if (teamError) {
        return NextResponse.json({ success: false, message: teamError.message }, { status: 500 });
      }
      updatedTeam = teamUpdate;
    }

    await supabase.from('admin_logs').insert({
      admin_callsign: admin.callsign,
      admin_name: admin?.name || null,
      action: 'reassign_registration',
      target_user_id: toProfile.user_id,
      target_email: eventId,
      changes: { from: fromCode, to: toCode },
    });

    return NextResponse.json({ success: true, data: { team: updatedTeam } });
  } catch (err) {
    console.error('[admin/reassign-registration POST]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
