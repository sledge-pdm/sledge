import { FileLocation } from '@sledge-pdm/core';
import { Exporter } from '~/features/io/export/exporter/Exporter';
import { JPEGExporter } from '~/features/io/export/exporter/JPEGExporter';
import { LosslessWebPExporter } from '~/features/io/export/exporter/LosslessWebPExporter';
import { LossyWebPExporter } from '~/features/io/export/exporter/LossyWebPExporter';
import { PNGExporter } from '~/features/io/export/exporter/PNGExporter';
import { SVGExporter } from '~/features/io/export/exporter/SVGExporter';
import { EXPORT_TYPES, ExportableTypes } from '~/features/io/export/types';
import { allLayers } from '~/features/layer';
import { logSystemError, logUserError, logUserSuccess, logUserWarn } from '~/features/log/service';
import { normalizeJoin } from '~/utils/FileUtils';
import { dialog, fs } from '~/utils/platform';

export interface CanvasExportOptions {
  perLayer: boolean;
  format: ExportableTypes;
  quality?: number; // jpeg 時の品質 0～1, png のときは無視
  scale: number; // 1（そのまま）～10 など
}

const LOG_LABEL = 'ExportService';

const exporters = new Map<ExportableTypes, Exporter>([
  ['png', new PNGExporter()],
  ['jpeg', new JPEGExporter()],
  ['webp_lossless', new LosslessWebPExporter()],
  ['webp_lossy', new LossyWebPExporter()],
  ['svg', new SVGExporter()],
]);

export async function exportImage(folderPath: string, fileName: string, options: CanvasExportOptions): Promise<FileLocation | undefined> {
  try {
    const exporter = exporters.get(options.format);
    if (!exporter) throw new Error('Export Error: Exporter not defined');
    const ext = EXPORT_TYPES[options.format].fileExtension;
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
  if (!(await fs.exists(folderPath))) {
    await fs.mkdir(folderPath, { recursive: true });
  }
  const filePath = normalizeJoin(folderPath, fileName);
  if (await fs.exists(filePath)) {
    const ok = await dialog.confirm(`File already exists:\n${filePath}\n\nOverwrite?`, {
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
  await fs.writeFile(normalizeJoin(folderPath, fileName), buf, {});
  return {
    path: folderPath,
    name: fileName,
  };
}
