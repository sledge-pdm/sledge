// import { ProjectV0 } from '@sledge-pdm/core';
// import { allLayers } from '~/features/layer';
// import { layerManager } from '~/features/layer/frasco/LayerManager';
// import { canvasStore, imagePoolStore, layerListStore, projectStore } from '~/stores/ProjectStores';
// import { packr } from '~/utils/msgpackr';

// /**
//  * @deprecated this is outdated function, use '~/features/io/project/out/save' instead;
//  */
// export function getLayerBuffers(): Map<string, Uint8ClampedArray> {
//   const map = new Map<string, Uint8ClampedArray>();
//   allLayers().forEach((layer) => {
//     try {
//       map.set(layer.id, layerManager.exportRawCanvas(layer.id));
//     } catch {
//       const size = projectStore.canvas.canvas;
//       map.set(layer.id, new Uint8ClampedArray(size.width * size.height * 4));
//     }
//   });
//   return map;
// }

// /**
//  * @deprecated this is outdated function, use '~/features/io/project/out/save' instead;
//  */
// export const dumpProject = async (): Promise<Uint8Array> => {
//   const project: ProjectV0 = {
//     canvasStore: canvasStore,
//     projectStore: projectStore,
//     layerListStore: layerListStore,
//     imagePoolStore: imagePoolStore,
//     layerBuffers: getLayerBuffers(),
//     imagePool: imagePoolStore.entries,
//   };
//   const packed = packr.pack(project);
//   return packed instanceof Uint8Array ? packed : Uint8Array.of(packed);
// };
