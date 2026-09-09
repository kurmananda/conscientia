'use client';

// Re-exported from ProfileContext (a shared provider) rather than defined
// here directly — see that file for why: each caller used to run its own
// independent Supabase query, which piled up into gotrue-js auth-lock
// contention when several profile-consuming components were mounted at once.
export { useProfile as default } from '../context/ProfileContext';
