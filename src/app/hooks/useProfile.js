'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { generateUniqueCode } from '@/lib/uniqueCode';
import { useAuth } from '../context/AuthContext';

export default function useProfile() {
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

      // Accounts created before the profiles table existed won't have a row
      // yet — create one on first save instead of failing the update.
      if (!profile) {
        const { data, error } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, unique_code: generateUniqueCode(), ...fields })
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

  return { profile, loading, refresh, save };
}
