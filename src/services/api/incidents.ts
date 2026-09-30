import { apiFetch, ApiResponse } from './client';
import { IncidentReport, ConflictReport } from '../../types/incident';

export const incidentApiService = {
  async getIncidents(): Promise<ApiResponse<IncidentReport[]>> {
    return apiFetch<IncidentReport[]>('/incidents');
  },

  async createIncidentReport(
    payload: Omit<IncidentReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<ApiResponse<IncidentReport>> {
    return apiFetch<IncidentReport>('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createConflictReport(
    payload: Omit<ConflictReport, 'id' | 'createdAt' | 'status'>
  ): Promise<ApiResponse<ConflictReport>> {
    return apiFetch<ConflictReport>('/conflicts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getConflictHistory(reporterId?: string): Promise<ApiResponse<ConflictReport[]>> {
    const query = reporterId ? `?reporterId=${reporterId}` : '';
    return apiFetch<ConflictReport[]>(`/conflicts${query}`);
  },
};
