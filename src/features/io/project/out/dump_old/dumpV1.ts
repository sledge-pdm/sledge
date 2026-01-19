// import { encodeWebp, ProjectV1 } from '@sledge-pdm/core';
// import { projectHistoryController } from '~/features/history';
// import { allLayers } from '~/features/layer';
// import { layerManager } from '~/features/layer/frasco/LayerManager';
// import { canvasStore, imagePoolStore, layerListStore, projectStore, snapshotStore } from '~/stores/ProjectStores';
// import { getCurrentVersion } from '~/utils/VersionUtils';

// /**
//  * @deprecated this is outdated function, use '~/features/io/project/out/save' instead;
//  */
// export const dumpProjectJson = async (): Promise<ProjectV1> => {
//   const buffers = new Map<
//     string,
//     {
//       webpBuffer: Uint8Array;
//     }
//   >();
//   const size = projectStore.canvas.canvas;
//   allLayers().forEach((l) => {
//     let buffer: Uint8ClampedArray;
//     try {
//       buffer = layerManager.exportRawCanvas(l.id);
//     } catch {
//       buffer = new Uint8ClampedArray(size.width * size.height * 4);
//     }
//     buffers.set(l.id, {
//       webpBuffer: encodeWebp(buffer, size.width, size.height),
//     });
//   });
//   const project: ProjectV1 = {
//     version: await getCurrentVersion(),
//     projectVersion: 1,
//     canvas: {
//       store: { ...canvasStore },
//     },
//     project: {
//       store: { ...projectStore },
//     },
//     imagePool: {
//       store: { ...imagePoolStore },
//     },
//     history: projectHistoryController.getSerialized(),
//     layers: {
//       store: { ...layerListStore },
//       buffers: buffers,
//     },
//     snapshots: {
//       store: { ...snapshotStore },
//     },
//   };

//   return project;
// };
