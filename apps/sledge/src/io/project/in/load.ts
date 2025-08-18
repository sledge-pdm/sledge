import { ReactiveMap } from '@solid-primitives/map';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { Project } from '~/io/project/out/dump';
import { setCanvasStore, setImagePoolStore, setLayerListStore, setProjectStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';

export const loadProjectJson = (project: Project) => {
  setCanvasStore(project.canvasStore);
  setImagePoolStore('entries', new ReactiveMap(project.imagePoolStore.entries));
  setLayerListStore(project.layerListStore);
  setProjectStore(project.projectStore);

  // 既存プロジェクト読み込み時にもcanvas:sizeChangedイベントを発火
  // SelectionManagerが正しくマスクサイズを更新できるようにする
  eventBus.emit('canvas:sizeChanged', { newSize: project.canvasStore.canvas });

  project.layerListStore.layers.forEach((layer) => {
    // Uncaught (in promise) TypeError: project.layerBuffers?.get is not a function
    // layerBuffers = {}
    resetLayerImage(layer.id, layer.dotMagnification, project.layerBuffers?.get(layer.id) ?? undefined);
  });
};
