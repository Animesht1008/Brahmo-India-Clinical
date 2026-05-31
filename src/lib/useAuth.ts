'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const router = useRouter();
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (!data.session) router.replace('/login');
      setLoading(false);
    });

    const { data: { subscription } } = supabase().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.replace('/login');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    await supabase().auth.signOut();
    router.replace('/login');
  };

  const displayName = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Doctor';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return { user, loading, signOut, displayName, initials };
}
