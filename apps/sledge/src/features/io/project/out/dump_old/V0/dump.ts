import { ProjectV0 } from '~/features/io/types/Project';
import { allLayers } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { canvasStore, imagePoolStore, layerListStore, projectStore } from '~/stores/ProjectStores';
import { packr } from '~/utils/msgpackr';

/**
 * @deprecated this is outdated function, use '~/features/io/project/out/save';
 */
export function getLayerBuffers(): Map<string, Uint8ClampedArray> {
  const map = new Map<string, Uint8ClampedArray>();
  allLayers().forEach((layer) => {
    map.set(layer.id, getAnvilOf(layer.id)!.getImageData());
  });
  return map;
}

/**
 * @deprecated this is outdated function, use '~/features/io/project/out/save';
 */
export const dumpProject = async (): Promise<Uint8Array> => {
  const project: ProjectV0 = {
    canvasStore: canvasStore,
    projectStore: projectStore,
    layerListStore: layerListStore,
    imagePoolStore: imagePoolStore,
    layerBuffers: getLayerBuffers(),
    imagePool: imagePoolStore.entries,
  };
  const packed = packr.pack(project);
  return packed instanceof Uint8Array ? packed : Uint8Array.of(packed);
};
