import { BaseLayer, Layer } from '~/features/layer';

export type LayerListStore = {
  layers: Layer[];
  baseLayer: BaseLayer;
  activeLayerId: string;
  isImagePoolActive: boolean;
};

export const defaultLayerListStore: LayerListStore = {
  layers: new Array<Layer>(),
  baseLayer: {
    colorMode: 'transparent',
  },
  activeLayerId: '',
  isImagePoolActive: true,
};
