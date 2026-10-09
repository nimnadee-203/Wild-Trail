import { useEffect, useState } from 'react';
import {
  getRangerIncidentQueue, getRangerSimulatedOffline, isRangerIncidentOnline,
  loadRangerIncidentSettings, QueuedRangerIncident, subscribeRangerIncidentQueue,
} from '../services/rangerIncidentQueue';

export function useRangerIncidentQueue() {
  const [queue, setQueue] = useState<QueuedRangerIncident[]>([]);
  const [online, setOnline] = useState(isRangerIncidentOnline);
  const [simulatedOffline, setSimulatedOffline] = useState(getRangerSimulatedOffline);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let version = 0;
    const refresh = () => {
      const request = ++version;
      setOnline(isRangerIncidentOnline());
      setSimulatedOffline(getRangerSimulatedOffline());
      void getRangerIncidentQueue().then(entries => {
        if (active && request === version) { setQueue(entries); setError(''); }
      }).catch(() => { if (active) setError('Unable to read locally saved reports. Please try again.'); });
    };
    const unsubscribe = subscribeRangerIncidentQueue(refresh);
    refresh();
    void loadRangerIncidentSettings().catch(() => { if (active) setError('Unable to load the offline simulator.'); });
    return () => { active = false; unsubscribe(); };
  }, []);
  return { queue, online, simulatedOffline, error };
}
