import { resetLayerImage } from '~/controllers/layer/LayerController';
import { Layer } from '~/models/layer/Layer';
import { setCanvasStore, setImagePoolStore, setLayerListStore, setProjectStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { mapReviver } from './jsonTyped';

export const loadProjectJson = (text: string) => {
  const data = JSON.parse(text, mapReviver);

  if (data.canvasStore) {
    const { width, height } = data.canvasStore.canvas;
    setCanvasStore('canvas', 'width', width);
    setCanvasStore('canvas', 'height', height);
    eventBus.emit('canvas:sizeChanged', { newSize: { width, height } });
  }

  if (data.projectStore) {
    setProjectStore(data.projectStore);
  }

  if (data.imagePoolStore?.entries) {
    setImagePoolStore('entries', data.imagePoolStore.entries);
  }

  if (data.layerListStore) {
    const layers: Layer[] = data.layerListStore.layers.map((l: any) => {
      const { pixels, dotMagnification = 1, ...rest } = l;
      const layer = { ...rest, dotMagnification };
      const agent = resetLayerImage(layer.id, dotMagnification, pixels ?? undefined);
      return layer;
    });

    setLayerListStore((store) => {
      return {
        ...store,
        ...data.layerListStore,
        layers,
      };
    });
  }
};
