// Shared "resolve a CNS-id into a full attendee record" lookup, used by both
// /api/scan (peer scanning on the profile page) and /api/admin/checkin (the
// admin Check In tab) so the two scanners return the same shape of data.
import { getCatalog } from './catalogStore';

export async function lookupByUniqueCode(supabase, code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('unique_code', normalized)
    .maybeSingle();

  // Surfacing the real error (instead of swallowing it into a plain
  // "not found") matters here — a matching code silently reporting "no
  // attendee found" is exactly what a DB-side error (missing column, RLS
  // denial, etc) looks like from the caller's side otherwise.
  if (error) throw new Error(error.message);
  if (!profile) return null;

  const { data: registration } = await supabase
    .from('registrations')
    .select('workshop_ids')
    .eq('user_id', profile.user_id)
    .maybeSingle();

  const bookedIds = Array.isArray(registration?.workshop_ids) ? registration.workshop_ids : [];

  const [workshopCatalog, eventCatalog] = await Promise.all([
    getCatalog('workshop'),
    getCatalog('event'),
  ]);
  const bookedIdSet = new Set(bookedIds.map(String));
  const workshops = workshopCatalog
    .filter((item) => bookedIdSet.has(String(item.id)))
    .map((item) => item.title || item.id);
  const events = eventCatalog
    .filter((item) => bookedIdSet.has(String(item.id)))
    .map((item) => item.title || item.id);

  return {
    name: profile.name || null,
    unique_code: profile.unique_code,
    phone: profile.phone || null,
    college: profile.college || null,
    college_id: profile.college_id || null,
    aadhaar_number: profile.aadhaar_number || null,
    city: profile.city || null,
    gender: profile.gender || null,
    address: profile.address || null,
    accommodation_room: profile.accommodation_room || null,
    accommodation_checkin: profile.accommodation_checkin || null,
    accommodation_checkout: profile.accommodation_checkout || null,
    merch_selection: profile.merch_selection || null,
    checked_in_at: profile.checked_in_at || null,
    workshops,
    events,
    user_id: profile.user_id,
  };
}
