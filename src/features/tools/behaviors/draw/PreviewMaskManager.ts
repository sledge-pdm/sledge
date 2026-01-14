import { BitmaskFactory, BitmaskShape, GripColor, GripKernel, GripStrokeStyle, Layer } from '@sledge-pdm/frasco';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { logSystemWarn } from '~/features/log/service';
import { mask_to_path } from '~/utils/wasm';

export type PreviewShape = {
  bitmaskShape: BitmaskShape;
  svgPath: string;
};

const DEFAULT_PREVIEW_COLOR: GripColor = [0, 0, 0, 255];

function shapeKey(kernelId: string, style: GripStrokeStyle): string {
  const normalizedStyle = normalizeStyle(style);
  return `${kernelId}-${normalizedStyle.size}-${normalizedStyle.opacity ?? 1}`;
}

class PreviewMaskManager {
  private stores: Map<string, PreviewShape> = new Map();
  private factory?: BitmaskFactory;
  private previewLayer?: Layer;
  private boundContext?: WebGL2RenderingContext;

  get(kernel: GripKernel, style: GripStrokeStyle): PreviewShape | undefined {
    const key = shapeKey(kernel.id, style);
    const cached = this.stores.get(key);
    if (cached) return cached;

    const created = this.create(kernel, style);
    if (!created) return undefined;
    this.stores.set(key, created);
    return created;
  }

  private create(kernel: GripKernel, style: GripStrokeStyle): PreviewShape | undefined {
    const factory = this.getFactory();
    if (!factory) return undefined;

    const normalizedStyle = normalizeStyle(style);
    const bitmaskShape = factory.createPointMask(kernel, normalizedStyle);
    const svgPath = mask_to_path(bitmaskShape.mask, bitmaskShape.width, bitmaskShape.height, 0, 0);

    return {
      bitmaskShape,
      svgPath,
    };
  }

  private getFactory(): BitmaskFactory | undefined {
    let gl: WebGL2RenderingContext;
    try {
      gl = layerManager.getContext();
    } catch {
      logSystemWarn('PreviewMaskManager: WebGL2 context not set.', { label: 'PreviewMaskManager' });
      return undefined;
    }

    if (!this.factory || this.boundContext !== gl) {
      this.previewLayer?.dispose();
      this.previewLayer = new Layer(gl, { width: 1, height: 1 });
      this.factory = new BitmaskFactory(this.previewLayer);
      this.boundContext = gl;
    }

    return this.factory;
  }
}

export const previewMaskManager = new PreviewMaskManager();

function normalizeStyle(style: GripStrokeStyle): GripStrokeStyle {
  return {
    size: style.size,
    color: DEFAULT_PREVIEW_COLOR,
    opacity: 1,
  };
}
