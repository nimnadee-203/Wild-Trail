import { apiFetch, ApiResponse } from './client';
import { PatrolLog, GPSCoordinate } from '../../types/patrol';

export const patrolApiService = {
  async startPatrol(rangerId: string): Promise<ApiResponse<PatrolLog>> {
    return apiFetch<PatrolLog>('/patrols/start', {
      method: 'POST',
      body: JSON.stringify({ rangerId }),
    });
  },

  async updatePatrolLocation(
    patrolId: string,
    coordinate: GPSCoordinate
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiFetch<{ success: boolean }>(`/patrols/${patrolId}/location`, {
      method: 'POST',
      body: JSON.stringify(coordinate),
    });
  },

  async endPatrol(patrolId: string, notes?: string): Promise<ApiResponse<PatrolLog>> {
    return apiFetch<PatrolLog>(`/patrols/${patrolId}/end`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },
};
