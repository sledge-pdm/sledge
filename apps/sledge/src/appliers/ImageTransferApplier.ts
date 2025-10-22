import { projectHistoryController } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { findLayerById } from '~/features/layer';
import { flushPatch, getBufferPointer, getHeight, getWidth, registerWholeChange } from '~/features/layer/anvil/AnvilController';
import { loadLocalImage } from '~/utils/DataUtils';

export interface ImageTransferParams {
  entry: {
    transform: { x: number; y: number; scaleX: number; scaleY: number };
    base: { width: number; height: number };
    imagePath: string; // file path (already used by ImagePool)
  };
  targetLayerId: string;
}

export async function transferToLayer({ entry, targetLayerId }: ImageTransferParams): Promise<void> {
  const bitmap = await loadLocalImage(entry.imagePath);

  const scaleX = entry.transform.scaleX ?? 1;
  const scaleY = entry.transform.scaleY ?? 1;
  const w = Math.max(1, Math.round(bitmap.width * scaleX));
  const h = Math.max(1, Math.round(bitmap.height * scaleY));

  const off = new OffscreenCanvas(w, h);
  const ctx = off.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bitmap, 0, 0, w, h);

  bitmap.close();

  const { data: srcBuf } = ctx.getImageData(0, 0, w, h);

  const layer = findLayerById(targetLayerId);
  if (!layer) throw new Error('Layer not found');
  const layerW = getWidth(targetLayerId)!;
  const layerH = getHeight(targetLayerId)!;

  const buf = getBufferPointer(targetLayerId);
  if (!buf) return;

  registerWholeChange(targetLayerId, buf);
  const dot = layer?.dotMagnification || 1;

  let dstX = Math.floor(entry.transform.x / dot);
  let dstY = Math.floor(entry.transform.y / dot);

  let srcX = 0;
  let srcY = 0;

  if (dstX < 0) {
    srcX = -dstX; // 左にはみ出した分をソース側でスキップ
    dstX = 0;
  }
  if (dstY < 0) {
    srcY = -dstY; // 上にはみ出した分
    dstY = 0;
  }

  const copyW = Math.max(0, Math.min(w - srcX, layerW - dstX));
  const copyH = Math.max(0, Math.min(h - srcY, layerH - dstY));
  if (copyW === 0 || copyH === 0) return;

  for (let y = 0; y < copyH; ++y) {
    const srcBase = ((srcY + y) * w + srcX) * 4;
    let dstOff = ((dstY + y) * layerW + dstX) * 4;
    for (let x = 0; x < copyW; ++x) {
      const r = srcBuf[srcBase + x * 4 + 0];
      const g = srcBuf[srcBase + x * 4 + 1];
      const b = srcBuf[srcBase + x * 4 + 2];
      const a = srcBuf[srcBase + x * 4 + 3]; // 0-255

      if (a === 0) {
        dstOff += 4;
        continue;
      } // 完全透明はスキップ
      if (a === 255) {
        // 不透明はそのままコピー
        buf[dstOff++] = r;
        buf[dstOff++] = g;
        buf[dstOff++] = b;
        buf[dstOff++] = 255;
        continue;
      }
      const inv = 255 - a;
      buf[dstOff] = ((r * a + buf[dstOff] * inv + 127) * 257) >> 16;
      buf[dstOff + 1] = ((g * a + buf[dstOff + 1] * inv + 127) * 257) >> 16;
      buf[dstOff + 2] = ((b * a + buf[dstOff + 2] * inv + 127) * 257) >> 16;
      buf[dstOff + 3] = Math.min(255, a + (((buf[dstOff + 3] * inv + 127) * 257) >> 16));
      dstOff += 4;
    }
  }
  const patch = flushPatch(targetLayerId);
  if (patch) {
    projectHistoryController.addAction(
      new AnvilLayerHistoryAction({
        layerId: targetLayerId,
        patch,
        context: { tool: 'image' },
      })
    );
  }
}
