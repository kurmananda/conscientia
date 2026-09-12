// Every real account gets a CNS id (profiles.unique_code) the moment they
// complete their profile. A guest checkout (no account) never got one —
// admin just showed a blank. This assigns one the same way.
//
// Correlation is strictly by CNS id + email, one owner each — NEVER by
// phone number. Phone is typed at checkout, easy to mistype or reuse
// someone else's, and is not a safe identity boundary: matching or sharing
// a CNS id across a phone-number match could show one person's booking (or
// let them see it) under a different person's identity. Every email gets
// its own CNS id, full stop.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `CNS-${code}`;
}

/**
 * Returns a fresh CNS id for a guest (no user_id) booking, or null if this
 * isn't a guest at all (has a user_id — real accounts use their own
 * profile's CNS id instead).
 *
 * @param {object} supabase - server Supabase client
 * @param {{ userId?: string|null }} params
 */
export async function assignGuestCnsId(supabase, { userId }) {
  if (userId) return null; // real accounts use their own profile's CNS id

  const { data: profiles } = await supabase.from('profiles').select('unique_code');
  const takenCodes = new Set((profiles || []).map((p) => p.unique_code).filter(Boolean));
  let code = generateCode();
  while (takenCodes.has(code)) code = generateCode();
  return code;
}
