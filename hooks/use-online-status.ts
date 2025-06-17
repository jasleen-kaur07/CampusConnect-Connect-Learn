import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';

export function useOnlineStatus() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Set user as online when they connect
    const setOnline = async () => {
      await supabase
        .from('profiles')
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);
    };

    // Set user as offline when they disconnect
    const setOffline = async () => {
      await supabase
        .from('profiles')
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);
    };

    // Set online status when component mounts
    setOnline();

    // Update last_seen periodically while online
    const interval = setInterval(() => {
      supabase
        .from('profiles')
        .update({
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id);
    }, 30000); // Update every 30 seconds

    // Set offline status when component unmounts
    window.addEventListener('beforeunload', setOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [user]);
} 