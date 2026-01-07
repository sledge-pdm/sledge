import type { RGBA } from '@sledge-pdm/core';
import { vi } from 'vitest';
import { PaletteType, selectPalette, setPaletteColor } from '~/features/color';
import { projectHistoryController } from '~/features/history';
import type { ImagePoolEntry } from '~/features/image_pool';
import { BlendMode, Layer, LayerType } from '~/features/layer';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { setCanvasStore, setImagePoolStore, setLayerListStore } from '~/stores/ProjectStores';
import { defaultCanvasStore } from '~/stores/project/CanvasStore';
import { defaultImagePoolStore } from '~/stores/project/ImagePoolStore';
import { defaultLayerListStore } from '~/stores/project/LayerListStore';
import { BLACK } from './colors';

type LayerInput = string | (Partial<Layer> & { id: string });

const DEFAULT_CANVAS = { width: 32, height: 32 };

function normalizeLayer(input: LayerInput): Layer {
  if (typeof input === 'string') {
    return {
      id: input,
      name: input,
      type: LayerType.Dot,
      typeDescription: 'dot',
      enabled: true,
      opacity: 1,
      mode: BlendMode.normal,
      dotMagnification: 1,
      cutFreeze: false,
    };
  }
  return {
    id: input.id,
    name: input.name ?? input.id,
    type: input.type ?? LayerType.Dot,
    typeDescription: input.typeDescription ?? 'dot',
    enabled: input.enabled ?? true,
    opacity: input.opacity ?? 1,
    mode: input.mode ?? BlendMode.normal,
    dotMagnification: input.dotMagnification ?? 1,
    cutFreeze: input.cutFreeze ?? false,
  };
}

export class ProjectTestFixture {
  private canvas = { ...DEFAULT_CANVAS };
  private layers: Layer[] = [];
  private registerLayerBuffers = false;
  private activeLayerId: string | undefined = undefined;
  private poolEntries: ImagePoolEntry[] = [];
  private selectedEntryId: string | undefined = undefined;
  private palette: { palette: PaletteType; color: RGBA } | undefined = {
    palette: PaletteType.primary,
    color: BLACK,
  };
  private shouldClearHistory = true;
  private shouldClearMocks = true;

  public withCanvas(size: { width: number; height: number }) {
    this.canvas = size;
    return this;
  }

  public withLayers(layerInputs: LayerInput[]) {
    this.layers = layerInputs.map(normalizeLayer);
    return this;
  }

  public withActiveLayer(id: string) {
    this.activeLayerId = id;
    return this;
  }

  public withImagePool(entries: ImagePoolEntry[], selectedId?: string) {
    this.poolEntries = entries;
    this.selectedEntryId = selectedId;
    return this;
  }

  public withPalette(palette: PaletteType, color: RGBA) {
    this.palette = { palette, color };
    return this;
  }

  public useLayerBuffers() {
    this.registerLayerBuffers = true;
    return this;
  }

  public clearHistory(flag = true) {
    this.shouldClearHistory = flag;
    return this;
  }

  public clearMocks(flag = true) {
    this.shouldClearMocks = flag;
    return this;
  }

  public apply() {
    if (this.shouldClearMocks) vi.clearAllMocks();

    // reset project stores
    setCanvasStore(() => ({ canvas: { ...defaultCanvasStore.canvas } }));
    setImagePoolStore(() => ({ ...defaultImagePoolStore }));
    setLayerListStore(() => ({
      ...defaultLayerListStore,
      baseLayer: { ...defaultLayerListStore.baseLayer },
      layers: [],
      selected: new Set<string>(),
    }));

    // reset layer manager
    (layerManager as any).layers.clear();
    (layerManager as any).pending.clear();

    // apply canvas
    setCanvasStore('canvas', { ...this.canvas });

    // apply layers + optional buffer registration
    if (this.layers.length > 0) {
      setLayerListStore('layers', this.layers);
      if (this.activeLayerId) {
        setLayerListStore('activeLayerId', this.activeLayerId);
      } else {
        setLayerListStore('activeLayerId', this.layers[0].id);
      }

      if (this.registerLayerBuffers) {
        this.layers.forEach((layer) => {
          const buffer = new Uint8ClampedArray(this.canvas.width * this.canvas.height * 4);
          layerManager.registerLayer(layer.id, buffer, this.canvas.width, this.canvas.height, { inputSpace: 'canvas' });
        });
      }
    }

    // apply image pool
    setImagePoolStore('entries', this.poolEntries);
    setImagePoolStore('selectedEntryId', this.selectedEntryId);

    // palette/color setup
    if (this.palette) {
      selectPalette(this.palette.palette);
      setPaletteColor(this.palette.palette, this.palette.color);
    }

    if (this.shouldClearHistory) {
      projectHistoryController.clearHistory();
    }

    return {
      layers: this.layers,
      canvas: this.canvas,
      poolEntries: this.poolEntries,
    };
  }
}

export const projectFixture = () => new ProjectTestFixture();
