import { toUint8Array } from '@sledge/anvil';
import { create_opacity_mask, mask_to_path } from '@sledge/wasm';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { Exporter } from '~/features/io/export/exporter/Exporter';
import { Layer } from '~/features/layer';
import { getBufferCopy } from '~/features/layer/anvil/AnvilController';
import { canvasStore } from '~/stores/ProjectStores';

export class SVGExporter extends Exporter {
  async canvasToBlob(quality?: number, scale: number = 1): Promise<Blob> {
    const { width, height } = canvasStore.canvas;

    // 64x64以内の制限チェック
    if (width > 128 || height > 128) {
      throw new Error('SVG export is only supported for images 128x128 or smaller');
    }

    if (webGLRenderer === undefined) throw new Error('Export Error: Renderer not defined');
    const buffer = webGLRenderer.readPixelsFlipped();

    // wasmを使って不透明部分のマスクを作成
    const mask = create_opacity_mask(toUint8Array(buffer), width, height);

    // wasmを使ってSVGパスを生成
    const svgPath = mask_to_path(mask, width, height, 0, 0);

    // スケールを適用したサイズ
    const scaledWidth = Math.round(width * scale);
    const scaledHeight = Math.round(height * scale);

    // SVGドキュメントを作成（viewBoxは元のサイズ、width/heightはスケール適用）
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
    const { width, height } = canvasStore.canvas;

    // 64x64以内の制限チェック
    if (width > 128 || height > 128) {
      throw new Error('SVG export is only supported for images 128x128 or smaller');
    }

    if (webGLRenderer === undefined) throw new Error('Export Error: Renderer not defined');
    const buffer = getBufferCopy(layer.id);
    if (!buffer) throw new Error(`Export Error: Cannot export layer ${layer.name}.`);

    // wasmを使って不透明部分のマスクを作成
    const mask = create_opacity_mask(toUint8Array(buffer), width, height);

    // wasmを使ってSVGパスを生成
    const svgPath = mask_to_path(mask, width, height, 0, 0);

    // スケールを適用したサイズ
    const scaledWidth = Math.round(width * scale);
    const scaledHeight = Math.round(height * scale);

    // SVGドキュメントを作成（viewBoxは元のサイズ、width/heightはスケール適用）
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
