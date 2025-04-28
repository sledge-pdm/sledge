import { Layer } from '~/types/Layer';

export type LayerListStore = {
  layers: Layer[];
  activeLayerId: string;
};
