import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MedicationRow {
  id: string;
  elder_id: string;
  name: string;
  time: string;
  dosage: string;
  status: 'pending' | 'completed' | 'missed';
  created_at: string;
}

export function useRealtimeMeds(elderId: string | null) {
  const [meds, setMeds] = useState<MedicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!elderId) {
      setMeds([]);
      setLoading(false);
      return;
    }

    // Initial fetch
    const fetchMeds = async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('elder_id', elderId)
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching medications:', error);
      } else {
        setMeds(data as MedicationRow[]);
      }
      setLoading(false);
    };

    fetchMeds();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`meds-${elderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medications',
          filter: `elder_id=eq.${elderId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMeds((prev) => [...prev, payload.new as MedicationRow].sort((a, b) => a.time.localeCompare(b.time)));
          } else if (payload.eventType === 'UPDATE') {
            setMeds((prev) =>
              prev.map((m) => (m.id === (payload.new as MedicationRow).id ? (payload.new as MedicationRow) : m))
            );
          } else if (payload.eventType === 'DELETE') {
            setMeds((prev) => prev.filter((m) => m.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [elderId]);

  // Actions
  const updateMedStatus = async (medId: string, status: MedicationRow['status']) => {
    const { error } = await supabase
      .from('medications')
      .update({ status })
      .eq('id', medId);
    if (error) console.error('Error updating medication:', error);
  };

  const addMedication = async (name: string, time: string, dosage: string) => {
    if (!elderId) return;
    const { error } = await supabase
      .from('medications')
      .insert([{ elder_id: elderId, name, time, dosage, status: 'pending' }]);
    if (error) console.error('Error adding medication:', error);
  };

  const deleteMedication = async (medId: string) => {
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', medId);
    if (error) console.error('Error deleting medication:', error);
  };

  return { meds, loading, updateMedStatus, addMedication, deleteMedication };
}
