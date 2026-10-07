// Web photos use browser blob/data URLs from the image picker.
export async function readIncidentPhoto(uri: string) {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Unable to read the selected photo (HTTP ${response.status}).`);
  }
  const data = await response.blob();
  return { data, contentType: data.type || 'image/jpeg', size: data.size };
}
