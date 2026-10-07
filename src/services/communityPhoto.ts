export async function retainCommunityPhoto(uri: string, _id: string, _index: number): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Unable to save the selected photo on this device.');
  const blob = await response.blob();
  if (!blob.size || blob.size >= 10 * 1024 * 1024) throw new Error('Choose a photo smaller than 10 MB.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to retain photo for offline reporting.'));
    reader.readAsDataURL(blob);
  });
}
