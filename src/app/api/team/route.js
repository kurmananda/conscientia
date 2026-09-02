import { NextResponse } from 'next/server';
import { createServerSupabase } from '../_supabase-server';
import { addEventToUserRegistration, resolveMemberProfiles } from '@/lib/eventTeams';

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
      const { data: myRegistration } = await supabase
        .from('registrations')
        .select('workshop_ids')
        .eq('user_id', caller.id)
        .maybeSingle();
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

/** POST { eventId, memberCodes } — the registrant (leader) confirms their
 * team roster once. memberCodes is the OTHER participants' CNS-ids (the
 * leader's own code is added automatically). Locked after this — the user
 * can't call this again once a team row is confirmed; only an admin can
 * change it from here (see /api/admin/team). */
export async function POST(req) {
  try {
    const supabase = createServerSupabase();
    const caller = await getCaller(req, supabase);
    if (!caller) {
      return NextResponse.json({ success: false, message: 'Not signed in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const eventId = (body.eventId || '').trim();
    const memberCodes = Array.isArray(body.memberCodes)
      ? body.memberCodes.map((c) => String(c).trim().toUpperCase()).filter(Boolean)
      : [];

    if (!eventId) {
      return NextResponse.json({ success: false, message: 'eventId is required.' }, { status: 400 });
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
    const { data: myRegistration } = await supabase
      .from('registrations')
      .select('workshop_ids')
      .eq('user_id', caller.id)
      .maybeSingle();
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

    if (existingTeam?.confirmed) {
      return NextResponse.json(
        { success: false, message: 'Your team is already confirmed and cannot be changed. Contact an event admin.' },
        { status: 409 }
      );
    }

    const fullRoster = [caller.uniqueCode, ...memberCodes.filter((c) => c !== caller.uniqueCode)];
    const uniqueRoster = [...new Set(fullRoster)];

    if (uniqueRoster.length !== groupSize) {
      return NextResponse.json(
        {
          success: false,
          message: `${catalogItem.title || 'This event'} needs exactly ${groupSize} participant${groupSize > 1 ? 's' : ''} (including you) — you supplied ${uniqueRoster.length}.`,
        },
        { status: 400 }
      );
    }

    // Every non-leader CNS-id must belong to a real account.
    const otherCodes = uniqueRoster.filter((c) => c !== caller.uniqueCode);
    const { profiles: memberProfiles, missing } = await resolveMemberProfiles(supabase, otherCodes);

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, message: `No account found for CNS-id${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.` },
        { status: 400 }
      );
    }

    const { data: team, error: upsertError } = await supabase
      .from('event_teams')
      .upsert(
        {
          event_id: eventId,
          leader_user_id: caller.id,
          leader_unique_code: caller.uniqueCode,
          member_codes: uniqueRoster,
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

    // Register the event on every teammate's own profile too (the leader
    // already has it via payment).
    await Promise.all(
      (memberProfiles || []).map((p) => addEventToUserRegistration(supabase, p.user_id, eventId))
    );

    return NextResponse.json({ success: true, data: team });
  } catch (err) {
    console.error('[team POST]', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
