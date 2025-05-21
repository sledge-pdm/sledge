import { path } from '@tauri-apps/api';
import { save } from '@tauri-apps/plugin-dialog';
import { BaseDirectory, mkdir, writeTextFile } from '@tauri-apps/plugin-fs';
import { getAgentOf } from '~/controllers/canvas/layer/LayerAgentManager';
import { findLayerById } from '~/controllers/canvas/layer/LayerListController';
import { calcThumbnailSize, ThumbnailGenerator } from '~/controllers/canvas/ThumbnailGenerator';
import { addRecentFile } from '~/controllers/config/GlobalConfigController';
import { canvasStore, imagePoolStore, layerHistoryStore, layerListStore, projectStore, setProjectStore } from '~/stores/ProjectStores';
import { blobToDataUrl } from '~/utils/DataUtils';
import { getFileNameAndPath } from '~/utils/PathUtils';
import genFileId from './genFileId';
import { saveThumbnailExternal } from './saveThumbnail';

export async function saveProject(name?: string, existingPath?: string) {
  let selectedPath: string | null;

  if (existingPath) {
    selectedPath = existingPath;
  } else {
    try {
      await mkdir('sledge', {
        baseDir: BaseDirectory.Home,
        recursive: true,
      });
    } catch (e) {
      console.warn('failed or skipped making new directory:', e);
    }

    const home = await path.homeDir();
    selectedPath = await save({
      title: 'save sledge project',
      defaultPath: await path.join(home, `sledge/${name ?? projectStore.name}.sledge`),
      filters: [{ name: 'sledge project', extensions: ['sledge'] }],
    });
  }

  if (typeof selectedPath === 'string') {
    setProjectStore('path', selectedPath);

    const fileId = await genFileId(selectedPath);
    const { width, height } = canvasStore.canvas;
    const thumbSize = calcThumbnailSize(width, height);
    const thumbnailBlob = await new ThumbnailGenerator().generateCanvasThumbnailBlob(thumbSize.width, thumbSize.height);
    const thumbnailDataUrl = await blobToDataUrl(thumbnailBlob);
    const thumbPath = await saveThumbnailExternal(fileId, thumbnailDataUrl);

    const data = await parseCurrentProject();
    await writeTextFile(selectedPath, data);
    console.log('project saved to:', selectedPath);

    setProjectStore('isProjectChangedAfterSave', false);
    addRecentFile(getFileNameAndPath(selectedPath));
  } else {
    console.log('save cancelled');
  }
}

export const parseCurrentProject = async (): Promise<string> => {
  const base = {
    canvas: canvasStore.canvas,
    project: projectStore,
    imagePool: imagePoolStore,
    images: Object.fromEntries(
      Object.entries(layerHistoryStore).map(([id, state]) => {
        const agent = getAgentOf(id);
        if (!agent) return [];
        return [
          id,
          {
            current: Array.from(agent.getBuffer()),
            width: agent.getWidth(),
            height: agent.getHeight(),
            dotMagnification: findLayerById(id)?.dotMagnification,
          },
        ];
      })
    ),
    layer: {
      layers: layerListStore.layers.map((layer) => ({
        ...layer,
        dsl: undefined,
      })),
      activeLayerId: layerListStore.activeLayerId,
    },
  };

  return JSON.stringify({
    ...base,
  });
};
