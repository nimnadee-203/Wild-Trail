import { router } from 'expo-router';

let reportSession = 0;

export function openRangerIncidentReport(emergency = false) {
  // Hidden tab screens stay mounted. A new session remounts only the editable form.
  router.push({
    pathname: '/(ranger)/report-incident',
    params: {
      reportSession: `${Date.now()}-${++reportSession}`,
      emergency: emergency ? 'true' : 'false',
    },
  });
}
