import { apiFetch, ApiResponse } from './client';
import { WildlifeAlert } from '../../types/alert';

export const alertApiService = {
  async getActiveAlerts(): Promise<ApiResponse<WildlifeAlert[]>> {
    return apiFetch<WildlifeAlert[]>('/alerts/active');
  },
};
