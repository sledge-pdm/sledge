import { BaseLayer, Layer } from '~/features/layer';

export type LayerListStore = {
  layers: Layer[];
  baseLayer: BaseLayer;
  activeLayerId: string;
  selectionEnabled: boolean;
  selected: Set<string>;
  isImagePoolActive: boolean;
};

export const defaultLayerListStore: LayerListStore = {
  layers: new Array<Layer>(),
  baseLayer: {
    colorMode: 'transparent',
  },
  activeLayerId: '',
  selectionEnabled: false,
  selected: new Set<string>(),
  isImagePoolActive: true,
};
