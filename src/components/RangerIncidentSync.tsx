import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { loadRangerIncidentSettings, syncRangerIncidents, updateRangerIncidentNetwork } from '../services/rangerIncidentQueue';

export function RangerIncidentSync() {
  useEffect(() => {
    let active = true;
    const sync = () => { void syncRangerIncidents().catch(error => console.warn('Ranger incident sync waiting:', error)); };
    void loadRangerIncidentSettings().then(async () => {
      const state = await Network.getNetworkStateAsync();
      if (active) updateRangerIncidentNetwork(state);
    }).catch(() => { if (active) sync(); });
    const network = Network.addNetworkStateListener(state => {
      if (active) updateRangerIncidentNetwork(state);
    });
    const app = AppState.addEventListener('change', state => { if (state === 'active') sync(); });
    const timer = setInterval(() => { if (AppState.currentState === 'active') sync(); }, 30_000);
    return () => { active = false; network.remove(); app.remove(); clearInterval(timer); };
  }, []);
  return null;
}
