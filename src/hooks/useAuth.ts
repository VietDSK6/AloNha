import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  phone: string;
  name: string;
  role: 'elderly' | 'caregiver';
  elder_id: string | null;
  link_code: string | null;
  created_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile separately (NOT inside onAuthStateChange to avoid deadlock)
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile;
  }, []);

  // Step 1: Listen to auth state — store user SYNCHRONOUSLY, no async work here
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // ✅ Synchronous only — no await inside onAuthStateChange
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Step 2: Whenever user changes, fetch their profile separately
  useEffect(() => {
    if (user === undefined) return; // not yet initialized

    if (user === null) {
      // Logged out
      setProfile(null);
      setLoading(false);
      return;
    }

    // Logged in — fetch profile
    let cancelled = false;
    setLoading(true);

    fetchProfile(user.id).then((p) => {
      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [user, fetchProfile]);

  // Step 3: Resolve initial "loading" state on first mount
  // If onAuthStateChange fires quickly, user will be set and step 2 takes over.
  // Safety net in case onAuthStateChange never fires (e.g., cold start):
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('Auth timeout — forcing loading false');
          return false;
        }
        return prev;
      });
    }, 4000);
    return () => clearTimeout(timeout);
  }, []);

  const signUp = useCallback(async (
    phone: string,
    password: string,
    name: string,
    role: 'elderly' | 'caregiver',
    linkCode?: string
  ) => {
    const email = `u${phone}@alonha.app`;
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Signup failed');

    const profileData: Partial<Profile> = {
      id: authData.user.id,
      phone,
      name,
      role,
    };

    if (role === 'caregiver' && linkCode) {
      const { data: elderProfile, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', linkCode.trim())
        .eq('role', 'elderly')
        .single();

      if (findError || !elderProfile) {
        throw new Error('Không tìm thấy người cao tuổi với số điện thoại này. Kiểm tra lại nhé.');
      }
      profileData.elder_id = elderProfile.id;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) throw profileError;

    // Manually fetch and set profile (onAuthStateChange will fire but we handle it)
    const p = await fetchProfile(authData.user.id);
    setProfile(p);
    return p;
  }, [fetchProfile]);

  const signIn = useCallback(async (phone: string, password: string) => {
    const email = `u${phone}@alonha.app`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Profile will be fetched automatically by the user-watching useEffect above
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const elderId = profile?.role === 'elderly' ? profile.id : profile?.elder_id;

  return { user, profile, loading, elderId, signUp, signIn, signOut };
}
