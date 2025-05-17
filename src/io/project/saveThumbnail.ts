import { appDataDir } from '@tauri-apps/api/path';
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { dataUrlToBytes } from '~/utils/DataUtils';

export const thumbnailDir = async () => (await appDataDir()) + '\\sledge\\thumbnails\\';
export const thumbnailPath = async (fileId: string) => (await appDataDir()) + '\\sledge\\thumbnails\\' + fileId;

export async function saveThumbnailExternal(fileId: string, dataUrl: string): Promise<string> {
  const dir = (await appDataDir()) + '\\sledge\\thumbnails\\';
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
  const path = `${dir}${fileId}.png`;
  const bytes = dataUrlToBytes(dataUrl);
  await writeFile(path, bytes);
  return path;
}
