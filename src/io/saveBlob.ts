import { BaseDirectory, writeFile } from '@tauri-apps/plugin-fs';

export async function saveBlobViaTauri(blob: Blob, defaultName = 'export.png') {
  // Blob → Uint8Array に変換
  const buf = new Uint8Array(await blob.arrayBuffer());
  // ファイルとして書き込み
  await writeFile(defaultName, buf, {
    baseDir: BaseDirectory.Picture,
  });
}
