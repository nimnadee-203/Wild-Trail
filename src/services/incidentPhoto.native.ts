import { File } from 'expo-file-system';

// Camera URIs are local files, so they must not be checked as HTTP responses.
export async function readIncidentPhoto(uri: string) {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error('The selected photo is no longer on this device. Please take it again.');
  }
  if (file.size >= 10 * 1024 * 1024) {
    throw new Error('The selected photo must be smaller than 10 MB.');
  }
  const data = await file.bytes();
  return { data, contentType: file.type || 'image/jpeg', size: data.byteLength };
}
