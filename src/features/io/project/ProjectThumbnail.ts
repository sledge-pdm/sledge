import { canvasThumbnailGenerator } from '~/features/canvas/CanvasThumbnailGenerator';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { blobToDataUrl, dataUrlToBytes } from '~/utils/DataUtils';
import { getFileUniqueId, normalizeJoin } from '~/utils/FileUtils';
import { calcThumbnailSize } from '~/utils/ThumbnailUtils';
import { fs, path } from '~/utils/platform';

/** @description where project thumbnails are kept: one png per project file id. */
export const thumbnailDir = async () => normalizeJoin(await path.appDataDir(), 'thumbnails');
export const thumbnailPath = async (fileId: string) => normalizeJoin(await path.appDataDir(), 'thumbnails', fileId);

/** @description write a thumbnail png for `fileId`, creating the directory if it is not there yet. */
export async function saveThumbnailExternal(fileId: string, dataUrl: string): Promise<string> {
  const dir = await thumbnailDir();
  if (!(await fs.exists(dir))) {
    await fs.mkdir(dir, { recursive: true });
  }
  const filePath = normalizeJoin(dir, `${fileId}.png`);
  const bytes = dataUrlToBytes(dataUrl);
  await fs.writeFile(filePath, bytes);
  return filePath;
}

/** @description render the canvas at thumbnail size and store it under the project file's id. */
export async function saveThumbnailData(selectedPath: string): Promise<string> {
  const fileId = await getFileUniqueId(selectedPath);
  const { width, height } = projectStore.canvas.size;
  const thumbSize = calcThumbnailSize(width, height);
  const thumbnailBlob = await canvasThumbnailGenerator.generateCanvasThumbnailBlob(thumbSize.width, thumbSize.height);
  const thumbnailDataUrl = await blobToDataUrl(thumbnailBlob);
  return await saveThumbnailExternal(fileId, thumbnailDataUrl);
}
