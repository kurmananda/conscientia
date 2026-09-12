// Every real account gets a CNS id (profiles.unique_code) the moment they
// complete their profile. A guest checkout (no account) never got one —
// admin just showed a blank. This assigns one the same way, and reuses the
// same code for the same phone number, so one person's bookings under
// different guest emails still share a single CNS id.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `CNS-${code}`;
}

export function normalizePhone(p) {
  return String(p || '').replace(/\D/g, '').slice(-10);
}

/**
 * Returns a CNS id for a guest (no user_id) booking, or null if this isn't
 * a guest at all (has a user_id — real accounts use their own profile code)
 * or the phone number isn't usable (not exactly 10 digits once normalized).
 *
 * @param {object} supabase - server Supabase client
 * @param {{ phone: string, email: string, userId?: string|null }} params
 */
export async function assignGuestCnsId(supabase, { phone, email, userId }) {
  if (userId) return null; // real accounts use their own profile's CNS id
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10) return null;

  // A profile with this phone means this is actually a real account whose
  // booking just hasn't been linked yet (handled elsewhere) — don't hand
  // out a separate guest code for them.
  const { data: matchingProfiles } = await supabase.from('profiles').select('phone, unique_code');
  const hasRealProfile = (matchingProfiles || []).some((p) => normalizePhone(p.phone) === normalized);
  if (hasRealProfile) return null;

  // Reuse an existing guest code for this phone if one was already assigned
  // to a different booking under the same number.
  const { data: existingRegs } = await supabase
    .from('registrations')
    .select('email, details')
    .neq('email', email);
  const existing = (existingRegs || []).find(
    (r) => normalizePhone(r.details?.phone) === normalized && r.details?.unique_code
  );
  if (existing) return existing.details.unique_code;

  const takenCodes = new Set((matchingProfiles || []).map((p) => p.unique_code).filter(Boolean));
  let code = generateCode();
  while (takenCodes.has(code)) code = generateCode();
  return code;
}
