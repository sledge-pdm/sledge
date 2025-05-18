import { writeFile } from '@tauri-apps/plugin-fs';

export async function saveBlobViaTauri(blob: Blob, dirPath: string, defaultName = 'export.png') {
  const buf = new Uint8Array(await blob.arrayBuffer());
  dirPath.replaceAll('/', '\\');
  dirPath = dirPath.endsWith('\\') ? dirPath : dirPath + '\\';
  await writeFile(dirPath + defaultName, buf, {});
  return dirPath + defaultName;
}
