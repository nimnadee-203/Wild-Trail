import { readIncidentPhoto } from './incidentPhoto';
import { fetch } from 'expo/fetch';

// These identify a public unsigned upload preset; no API secret belongs in the app.
const CLOUD_NAME = 'effmagck';
const UPLOAD_PRESET = 'wildtrail_incidents';

export async function uploadIncidentPhoto(uri: string): Promise<string> {
  const { data, size } = await readIncidentPhoto(uri);
  if (size === 0) throw new Error('The selected photo is empty. Please take it again.');
  if (size >= 10 * 1024 * 1024) throw new Error('The selected photo must be smaller than 10 MB.');

  const body = new FormData();
  body.append('file', data);
  body.append('upload_preset', UPLOAD_PRESET);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    // Let FormData set Content-Type, including its multipart boundary.
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body,
      signal: controller.signal,
    });
    const result = (await response.json()) as {
      secure_url?: unknown;
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(result.error?.message || `Photo upload failed (HTTP ${response.status}).`);
    }
    if (typeof result.secure_url !== 'string' || !result.secure_url.startsWith('https://')) {
      throw new Error('Photo storage did not return a valid photo URL.');
    }
    return result.secure_url;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Photo upload timed out. Check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
