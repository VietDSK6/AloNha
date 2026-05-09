import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AlertRow {
  id: string;
  elder_id: string;
  type: 'sos' | 'medication' | 'health';
  message: string;
  read: boolean;
  created_at: string;
}

export function useRealtimeAlerts(elderId: string | null) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!elderId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    // Initial fetch (last 20 alerts)
    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('elder_id', elderId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching alerts:', error);
      } else {
        setAlerts(data as AlertRow[]);
      }
      setLoading(false);
    };

    fetchAlerts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`alerts-${elderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `elder_id=eq.${elderId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAlerts((prev) => [payload.new as AlertRow, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAlerts((prev) =>
              prev.map((a) => (a.id === payload.new.id ? (payload.new as AlertRow) : a))
            );
          } else if (payload.eventType === 'DELETE') {
            setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [elderId]);

  // Actions
  const createAlert = async (type: AlertRow['type'], message: string) => {
    if (!elderId) return;
    const { error } = await supabase
      .from('alerts')
      .insert([{ elder_id: elderId, type, message }]);
    if (error) console.error('Error creating alert:', error);
  };

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('id', alertId);
    
    if (error) {
      console.error('Error marking alert as read:', error);
    } else {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
      );
    }
  };

  return { alerts, loading, createAlert, markAsRead };
}
