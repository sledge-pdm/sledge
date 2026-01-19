import { toUint8Array, toUint8ClampedArray } from '@sledge-pdm/core';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { Exporter } from '~/features/io/export/exporter/Exporter';
import { Layer } from '~/features/layer';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { projectStore } from '~/stores/RuntimeProject';
import { create_opacity_mask, mask_to_path } from '~/utils/wasm';

export class SVGExporter extends Exporter {
  async canvasToBlob(quality?: number, scale: number = 1): Promise<Blob> {
    const { width, height } = projectStore.canvas.size;

    // 64x64莉･蜀・・蛻ｶ髯舌メ繧ｧ繝・け
    if (width > 128 || height > 128) {
      throw new Error('SVG export is only supported for images 128x128 or smaller');
    }

    if (webGLRenderer === undefined) throw new Error('Export Error: Renderer not defined');
    const buffer = webGLRenderer.readPixelsFlipped();

    // wasm繧剃ｽｿ縺｣縺ｦ荳埼乗・驛ｨ蛻・・繝槭せ繧ｯ繧剃ｽ懈・
    const mask = create_opacity_mask(toUint8Array(buffer), width, height);

    // wasm繧剃ｽｿ縺｣縺ｦSVG繝代せ繧堤函謌・
    const svgPath = mask_to_path(mask, width, height, 0, 0);

    // 繧ｹ繧ｱ繝ｼ繝ｫ繧帝←逕ｨ縺励◆繧ｵ繧､繧ｺ
    const scaledWidth = Math.round(width * scale);
    const scaledHeight = Math.round(height * scale);

    // SVG繝峨く繝･繝｡繝ｳ繝医ｒ菴懈・・・iewBox縺ｯ蜈・・繧ｵ繧､繧ｺ縲『idth/height縺ｯ繧ｹ繧ｱ繝ｼ繝ｫ驕ｩ逕ｨ・・
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${scaledWidth}" height="${scaledHeight}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <clipPath id="clipPath">
    <path d="${svgPath}" fill="black" />
  </clipPath>
  <path d="${svgPath}" fill="black" />
</svg>`;

    return new Blob([svgContent], { type: 'image/svg+xml' });
  }

  async layerToBlob(layer: Layer, quality?: number, scale: number = 1): Promise<Blob> {
    const { width, height } = projectStore.canvas.size;

    // 64x64莉･蜀・・蛻ｶ髯舌メ繧ｧ繝・け
    if (width > 128 || height > 128) {
      throw new Error('SVG export is only supported for images 128x128 or smaller');
    }

    if (webGLRenderer === undefined) throw new Error('Export Error: Renderer not defined');
    const buffer = toUint8ClampedArray(getLayer(layer.id).readPixels()) as Uint8ClampedArray<ArrayBuffer>;
    if (!buffer) throw new Error(`Export Error: Cannot export layer ${layer.name}.`);

    // wasm繧剃ｽｿ縺｣縺ｦ荳埼乗・驛ｨ蛻・・繝槭せ繧ｯ繧剃ｽ懈・
    const mask = create_opacity_mask(toUint8Array(buffer), width, height);

    // wasm繧剃ｽｿ縺｣縺ｦSVG繝代せ繧堤函謌・
    const svgPath = mask_to_path(mask, width, height, 0, 0);

    // 繧ｹ繧ｱ繝ｼ繝ｫ繧帝←逕ｨ縺励◆繧ｵ繧､繧ｺ
    const scaledWidth = Math.round(width * scale);
    const scaledHeight = Math.round(height * scale);

    // SVG繝峨く繝･繝｡繝ｳ繝医ｒ菴懈・・・iewBox縺ｯ蜈・・繧ｵ繧､繧ｺ縲『idth/height縺ｯ繧ｹ繧ｱ繝ｼ繝ｫ驕ｩ逕ｨ・・
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${scaledWidth}" height="${scaledHeight}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <clipPath id="clipPath">
    <path d="${svgPath}" fill="black" />
  </clipPath>
  <path d="${svgPath}" fill="black" />
</svg>`;

    return new Blob([svgContent], { type: 'image/svg+xml' });
  }
}
