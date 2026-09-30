import { APP_CONFIG } from '../../constants/config';
import { storageService } from '../../storage/asyncStorage';
import { STORAGE_KEYS } from '../../storage/keys';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await storageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${APP_CONFIG.apiBaseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: data.message || 'API request failed',
        status: response.status,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'Network request failed',
      status: 0,
    };
  }
}
