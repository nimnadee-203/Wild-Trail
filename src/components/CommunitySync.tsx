import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncCommunityReports } from '../services/communityReports';

export function CommunitySync() {
  useEffect(() => {
    const sync = () => { void syncCommunityReports().catch((error) => console.warn('Community sync waiting:', error)); };
    sync();
    const timer = setInterval(() => { if (AppState.currentState === 'active') sync(); }, 30_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') sync(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return null;
}
