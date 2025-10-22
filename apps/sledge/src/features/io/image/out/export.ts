import { FileLocation } from '@sledge/core';
import { pictureDir } from '@tauri-apps/api/path';
import { confirm } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { convertToExtension, ExportableFileTypes } from '~/features/io/FileExtensions';
import { Exporter } from '~/features/io/image/out/exporter/Exporter';
import { JPEGExporter } from '~/features/io/image/out/exporter/JPEGExporter';
import { LosslessWebPExporter } from '~/features/io/image/out/exporter/LosslessWebPExporter';
import { LossyWebPExporter } from '~/features/io/image/out/exporter/LossyWebPExporter';
import { PNGExporter } from '~/features/io/image/out/exporter/PNGExporter';
import { SVGExporter } from '~/features/io/image/out/exporter/SVGExporter';
import { allLayers } from '~/features/layer';
import { setLastSettingsStore } from '~/stores/EditorStores';
import { normalizeJoin } from '~/utils/FileUtils';

export interface CanvasExportOptions {
  perLayer: boolean;
  format: ExportableFileTypes;
  quality?: number; // jpeg 時の品質 0～1, png のときは無視
  scale: number; // 1（そのまま）～10 など
}

export const defaultExportDir = async () => {
  const dir = normalizeJoin(await pictureDir(), 'sledge');
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }

  return dir;
};

const exporters = new Map<ExportableFileTypes, Exporter>([
  ['png', new PNGExporter()],
  ['jpeg', new JPEGExporter()],
  ['svg', new SVGExporter()],
  ['webp_lossless', new LosslessWebPExporter()],
  ['webp_lossy', new LossyWebPExporter()],
]);

export async function exportImage(dirPath: string, fileName: string, options: CanvasExportOptions): Promise<FileLocation | undefined> {
  const exporter = exporters.get(options.format);
  const ext = convertToExtension(options.format);

  if (!exporter) throw new Error('Export Error: Exporter not defined');

  if (!options.perLayer) {
    // whole canvas export
    const canvasBlob: Blob = await exporter.canvasToBlob(options.quality, options.scale);
    return await saveBlobViaTauri(canvasBlob, dirPath, `${fileName}.${ext}`);
  } else {
    const layerLocations = await Promise.all(
      allLayers().map(async (layer) => {
        const layerBlob = await exporter.layerToBlob(layer, options.quality, options.scale);
        const loc = await saveBlobViaTauri(layerBlob, normalizeJoin(dirPath, fileName), `${fileName}_${layer.name}.${ext}`);
        return loc;
      })
    );
    return {
      path: dirPath,
      name: fileName,
    };
  }
}

export async function saveBlobViaTauri(blob: Blob, dirPath: string, fileName = 'export.png'): Promise<FileLocation | undefined> {
  if (!(await exists(dirPath))) {
    await mkdir(dirPath, { recursive: true });
  }
  const filePath = normalizeJoin(dirPath, fileName);
  if (await exists(filePath)) {
    const ok = await confirm(`File already exists:\n${filePath}\n\nOverwrite?`, {
      kind: 'info',
      okLabel: 'Overwrite',
      cancelLabel: 'Cancel',
      title: 'Export',
    });
    if (!ok) {
      console.warn('export cancelled.');
      return;
    }
  }

  const buf = new Uint8Array(await blob.arrayBuffer());
  await writeFile(normalizeJoin(dirPath, fileName), buf, {});
  setLastSettingsStore('exportedDirPaths', (prev) => {
    if (prev.includes(dirPath)) {
      prev = [...prev.filter((p) => p !== dirPath), dirPath];
      return prev;
    }
    if (prev.length >= 10) prev.shift();
    return [...prev, dirPath];
  });

  return {
    path: dirPath,
    name: fileName,
  };
}
