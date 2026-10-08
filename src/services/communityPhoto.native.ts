import { Directory, File, Paths } from 'expo-file-system';

export async function retainCommunityPhoto(uri: string, id: string, index: number) {
  const folder = new Directory(Paths.document, 'community-reports');
  folder.create({ idempotent: true, intermediates: true });
  const source = new File(uri);
  if (!source.exists || !source.size) throw new Error('Unable to read the selected photo.');
  if (source.size >= 10 * 1024 * 1024) throw new Error('Choose a photo smaller than 10 MB.');
  const destination = new File(folder, `${id}-${index}${source.extension || '.jpg'}`);
  source.copy(destination);
  return destination.uri;
}
