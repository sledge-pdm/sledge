import { FileLocation } from '@sledge/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { Exporter } from '~/features/io/export/exporter/Exporter';
import { JPEGExporter } from '~/features/io/export/exporter/JPEGExporter';
import { LosslessWebPExporter } from '~/features/io/export/exporter/LosslessWebPExporter';
import { LossyWebPExporter } from '~/features/io/export/exporter/LossyWebPExporter';
import { PNGExporter } from '~/features/io/export/exporter/PNGExporter';
import { SVGExporter } from '~/features/io/export/exporter/SVGExporter';
import { convertToExtension, ExportableFileTypes } from '~/features/io/FileExtensions';
import { allLayers } from '~/features/layer';
import { logSystemError, logUserError, logUserSuccess, logUserWarn } from '~/features/log/service';
import { normalizeJoin } from '~/utils/FileUtils';

export interface CanvasExportOptions {
  perLayer: boolean;
  format: ExportableFileTypes;
  quality?: number; // jpeg 時の品質 0～1, png のときは無視
  scale: number; // 1（そのまま）～10 など
}

const LOG_LABEL = 'ExportService';

const exporters = new Map<ExportableFileTypes, Exporter>([
  ['png', new PNGExporter()],
  ['jpeg', new JPEGExporter()],
  ['svg', new SVGExporter()],
  ['webp_lossless', new LosslessWebPExporter()],
  ['webp_lossy', new LossyWebPExporter()],
]);

export async function exportImage(folderPath: string, fileName: string, options: CanvasExportOptions): Promise<FileLocation | undefined> {
  try {
    const exporter = exporters.get(options.format);
    if (!exporter) throw new Error('Export Error: Exporter not defined');
    const ext = convertToExtension(options.format);
    if (!options.perLayer) {
      // whole canvas export
      const canvasBlob: Blob = await exporter.canvasToBlob(options.quality, options.scale);
      const location = await saveBlobViaTauri(canvasBlob, folderPath, `${fileName}.${ext}`);
      if (location) {
        logUserSuccess(`exported ${location.name}`, { label: LOG_LABEL, duration: 4000 });
        return location;
      }
      return undefined;
    } else {
      const layerLocations = await Promise.all(
        allLayers().map(async (layer) => {
          const layerBlob = await exporter.layerToBlob(layer, options.quality, options.scale);
          const loc = await saveBlobViaTauri(layerBlob, normalizeJoin(folderPath, fileName), `${fileName}_${layer.name}.${ext}`);
          return loc;
        })
      );
      const exportedCount = layerLocations.filter(Boolean).length;
      if (exportedCount) {
        logUserSuccess(`exported ${exportedCount} layer(s) to ${folderPath}`, {
          label: LOG_LABEL,
          duration: 4000,
        });
      }
      return {
        path: folderPath,
        name: fileName,
      };
    }
  } catch (error) {
    logSystemError('export failed.', { label: LOG_LABEL, details: [error] });
    logUserError('export failed.', { label: LOG_LABEL });
    throw error;
  }
}

export async function saveBlobViaTauri(blob: Blob, folderPath: string, fileName = 'export.png'): Promise<FileLocation | undefined> {
  if (!(await exists(folderPath))) {
    await mkdir(folderPath, { recursive: true });
  }
  const filePath = normalizeJoin(folderPath, fileName);
  if (await exists(filePath)) {
    const ok = await confirm(`File already exists:\n${filePath}\n\nOverwrite?`, {
      kind: 'info',
      okLabel: 'Overwrite',
      cancelLabel: 'Cancel',
      title: 'Export',
    });
    if (!ok) {
      logUserWarn('export cancelled.', { label: LOG_LABEL });
      return;
    }
  }

  const buf = new Uint8Array(await blob.arrayBuffer());
  await writeFile(normalizeJoin(folderPath, fileName), buf, {});
  return {
    path: folderPath,
    name: fileName,
  };
}
