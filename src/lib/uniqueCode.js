// Placeholder generator — random for now. Real assignment logic (per the
// fest's badge/ticket numbering scheme) comes later.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

export function generateUniqueCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `CNS-${code}`;
}
