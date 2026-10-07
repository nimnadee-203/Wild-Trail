import { apiFetch, ApiResponse } from './client';
import { PatrolLog, GPSCoordinate, AssignedPatrol } from '../../types/patrol';

export const MOCK_ASSIGNED_PATROLS: AssignedPatrol[] = [
  {
    id: 'PAT-0156',
    name: 'Northern Boundary Patrol',
    park: 'Yala National Park',
    date: '2026-10-08',
    startTime: '08:00',
    duration: 4,
    priority: 'HIGH',
    status: 'ASSIGNED',
    instructions: 'Check northern boundary, fence integrity, and water points for anti-poaching activity.',
    route: [
      [81.503, 6.3672],
      [81.5044, 6.3681],
      [81.5057, 6.3695],
    ],
  },
  {
    id: 'PAT-0157',
    name: 'River Corridor Patrol',
    park: 'Yala National Park',
    date: '2026-10-08',
    startTime: '14:00',
    duration: 3,
    priority: 'MEDIUM',
    status: 'ASSIGNED',
    instructions: 'Monitor river bank wildlife crossing corridor and survey waterhole Zone C.',
    route: [
      [81.512, 6.371],
      [81.514, 6.3735],
      [81.5165, 6.376],
    ],
  },
  {
    id: 'PAT-0158',
    name: 'Coastal Dune Sector Patrol',
    park: 'Yala National Park',
    date: '2026-10-09',
    startTime: '06:00',
    duration: 5,
    priority: 'LOW',
    status: 'ASSIGNED',
    instructions: 'Inspect coastal perimeter, verify camera trap operations, and report any encroachment.',
    route: [
      [81.52, 6.38],
      [81.5225, 6.382],
      [81.525, 6.385],
    ],
  },
];

export const patrolApiService = {
  async getRangerAssignedPatrols(rangerId: string = 'R001'): Promise<ApiResponse<AssignedPatrol[]>> {
    // API endpoint: GET /api/rangers/:rangerId/patrols
    // Currently using mock data until manager assignment backend API is integrated
    try {
      const response = await apiFetch<AssignedPatrol[]>(`/rangers/${rangerId}/patrols`);
      if (response.data && response.data.length > 0) {
        return response;
      }
    } catch {
      // Fall back to mock data
    }
    return {
      data: MOCK_ASSIGNED_PATROLS,
      error: null,
      status: 200,
    };
  },

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

