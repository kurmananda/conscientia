import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';
import { addEventToUserRegistration, resolveMemberProfiles } from '@/lib/eventTeams';
import { findRegistrationForUser } from '@/lib/registrationLookup';

/**
 * User-facing team management for group-size events. The caller is always
 * identified from their Supabase session token, never a client-supplied id
 * — same pattern as /api/data/access.
 */
async function getCaller(req, supabase) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('unique_code, name')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (!profile?.unique_code) return null;
  return { id: userData.user.id, email: userData.user.email, uniqueCode: profile.unique_code, name: profile.name };
}

/** GET ?eventId= — team status for the calling user: are they the leader
 * (registrant) or a member, is it confirmed yet, and the current roster. */
export async function GET(req) {
  try {
    const supabase = createServerSupabase();
    const caller = await getCaller(req, supabase);
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Not signed in.' }, { status: 401 });
    }

    const url = new URL(req.url);

    // ?checkCode= — used while a leader is adding teammates one at a time,
    // to confirm a CNS-id actually has an account before it's accepted into
    // the local draft roster (final POST re-validates all codes anyway, but
    // catching a typo immediately is much less frustrating than only at
    // confirm time).
    const checkCode = (url.searchParams.get('checkCode') || '').trim().toUpperCase();
    if (checkCode) {
      const { missing } = await resolveMemberProfiles(supabase, [checkCode]);
      return NextResponse.json({ success: true, data: { exists: missing.length === 0 } });
    }

    const eventId = (url.searchParams.get('eventId') || '').trim();
    if (!eventId) {
      return NextResponse.json({ success: false, message: 'eventId is required.' }, { status: 400 });
    }

    const { data: catalogItem } = await supabase
      .from('catalog_items')
      .select('group_size')
      .eq('id', eventId)
      .maybeSingle();
    const groupSize = catalogItem?.group_size || 1;

    const { data: team } = await supabase
      .from('event_teams')
      .select('*')
      .eq('event_id', eventId)
      .or(`leader_user_id.eq.${caller.id},member_codes.cs.{${caller.uniqueCode}}`)
      .maybeSingle();

    let role = 'none';
    if (team) {
      role = team.leader_user_id === caller.id ? 'leader' : 'member';
    } else {
      const myRegistration = await findRegistrationForUser(supabase, caller.id, caller.email, 'workshop_ids');
      const myIds = Array.isArray(myRegistration?.workshop_ids) ? myRegistration.workshop_ids : [];
      if (myIds.includes(eventId)) role = 'leader';
    }

    return NextResponse.json({
      success: true,
      data: { groupSize, role, team: team || null, yourCode: caller.uniqueCode },
    });
  } catch (err) {
    console.error('[team GET]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/** POST { eventId, memberCode } — the registrant (leader) adds ONE teammate.
 * Each add is saved immediately: the teammate gets the event on their own
 * profile right away, and the team doesn't have to be full. The leader's own
 * code is on the roster from the first add. Added teammates are locked —
 * only an admin can remove one (see /api/admin/team). */
export async function POST(req) {
  try {
    const supabase = createServerSupabase();
    const caller = await getCaller(req, supabase);
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Not signed in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const eventId = (body.eventId || '').trim();
    const memberCode = String(body.memberCode || '').trim().toUpperCase();

    if (!eventId) {
      return NextResponse.json({ success: false, message: 'eventId is required.' }, { status: 400 });
    }
    if (!memberCode) {
      return NextResponse.json({ success: false, message: 'Enter a CNS-id.' }, { status: 400 });
    }

    const { data: catalogItem } = await supabase
      .from('catalog_items')
      .select('group_size, title')
      .eq('id', eventId)
      .maybeSingle();
    const groupSize = catalogItem?.group_size || 1;

    if (groupSize <= 1) {
      return NextResponse.json(
        { success: false, message: 'This event does not require a team.' },
        { status: 400 }
      );
    }

    // Must actually be registered (paid) for this event to be its leader.
    const myRegistration = await findRegistrationForUser(supabase, caller.id, caller.email, 'workshop_ids');
    const myIds = Array.isArray(myRegistration?.workshop_ids) ? myRegistration.workshop_ids : [];
    if (!myIds.includes(eventId)) {
      return NextResponse.json(
        { success: false, message: 'You are not registered for this event.' },
        { status: 403 }
      );
    }

    const { data: existingTeam } = await supabase
      .from('event_teams')
      .select('*')
      .eq('event_id', eventId)
      .eq('leader_user_id', caller.id)
      .maybeSingle();

    const roster = existingTeam?.member_codes?.length ? existingTeam.member_codes : [caller.uniqueCode];

    if (roster.includes(memberCode)) {
      return NextResponse.json(
        { success: false, message: 'That CNS-id is already on the team.' },
        { status: 400 }
      );
    }
    if (roster.length >= groupSize) {
      return NextResponse.json(
        { success: false, message: `The team is already full (${groupSize} participants).` },
        { status: 409 }
      );
    }

    const { profiles: memberProfiles, missing } = await resolveMemberProfiles(supabase, [memberCode]);
    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `No account found for CNS-id ${memberCode}.` },
        { status: 400 }
      );
    }

    // Teammates can only be on one team per event.
    const { data: clash } = await supabase
      .from('event_teams')
      .select('id')
      .eq('event_id', eventId)
      .contains('member_codes', [memberCode])
      .maybeSingle();
    if (clash) {
      return NextResponse.json(
        { success: false, message: `${memberCode} is already on a team for this event.` },
        { status: 409 }
      );
    }

    const { data: team, error: upsertError } = await supabase
      .from('event_teams')
      .upsert(
        {
          event_id: eventId,
          leader_user_id: caller.id,
          leader_unique_code: caller.uniqueCode,
          member_codes: [...roster, memberCode],
          confirmed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'event_id,leader_user_id' }
      )
      .select()
      .maybeSingle();

    if (upsertError) {
      return NextResponse.json({ success: false, message: upsertError.message }, { status: 500 });
    }

    await addEventToUserRegistration(supabase, memberProfiles[0].user_id, eventId);

    return NextResponse.json({ success: true, data: team });
  } catch (err) {
    console.error('[team POST]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
