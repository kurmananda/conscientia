'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { generateUniqueCode } from '@/lib/uniqueCode';
import { useAuth } from './AuthContext';

const ProfileContext = createContext({
  profile: null,
  loading: true,
  refresh: async () => {},
  save: async () => ({ error: 'not_ready' }),
});

// One shared profile fetch per signed-in user, not one per component.
// useProfile() used to run its own `.from('profiles').select()` query
// independently in every caller (Navbar, ProfileCompletionModal, and
// whichever page is mounted all call it at once), so a single navigation
// could fire 3+ simultaneous profile queries — each one contending for
// gotrue-js's single cross-call auth-token lock and piling up into the
// "orphaned lock ... forcefully acquiring" warnings/stalls that looked like
// random sign-outs.
export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setProfile(data || null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (fields) => {
      if (!user) return { error: 'Not signed in.' };

      if (!profile) {
        const { data, error } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, unique_code: generateUniqueCode(), email: user.email || null, ...fields })
          .select()
          .maybeSingle();
        if (error) return { error: error.message };
        setProfile(data);
        return { data };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .maybeSingle();
      if (error) return { error: error.message };
      setProfile(data);
      return { data };
    },
    [user, profile]
  );

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, save }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
