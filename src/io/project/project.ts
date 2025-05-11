import { path } from '@tauri-apps/api';
import { open as dialogOpen, save } from '@tauri-apps/plugin-dialog';
import { BaseDirectory, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { addRecentFile } from '~/controllers/config/GlobalConfigController';
import { findLayerById } from '~/controllers/layer_list/LayerListController';
import { exportThumbnailDataURL } from '~/controllers/webgl/WebGLCanvasController';
import { getWebglRenderer } from '~/models/webgl/WebGLRenderer';
import { getImageOf } from '~/routes/editor';
import {
  canvasStore,
  layerHistoryStore,
  layerListStore,
  loadStoreFromProjectJson as loadProjectStore,
  projectStore,
  setProjectStore,
} from '~/stores/ProjectStores';
import { Consts } from '~/utils/consts';
import { getFileNameAndPath } from '~/utils/PathUtils';

export async function importProjectFromFileSelection(): Promise<string | undefined> {
  const home = await path.homeDir();
  const file = await dialogOpen({
    multiple: false,
    directory: false,
    defaultPath: await path.join(home, 'sledge'),
    filters: [
      {
        name: 'sledge files',
        extensions: ['sledge'],
      },
    ],
  });

  if (!file) {
    console.log('file not selected');
    return undefined;
  }

  const jsonText = await readTextFile(file);
  const projectJson = JSON.parse(jsonText);

  loadProjectStore(projectJson);

  return file;
}

export async function getProjectJsonFromPath(filePath: string) {
  if (!filePath) {
    console.log('file not selected');
    return;
  }
  const jsonText = await readTextFile(filePath);
  const projectJson = JSON.parse(jsonText);

  return projectJson;
}

export async function importProjectFromPath(filePath: string) {
  if (!filePath) {
    console.log('file not selected');
    return;
  }
  const jsonText = await readTextFile(filePath);
  const projectJson = JSON.parse(jsonText);

  loadProjectStore(projectJson);
}

export const parseCurrentProject = async (thumbnailSize = Consts.projectThumbnailSize): Promise<string> => {
  // 1) まず既存のデータ部分を作る
  const base = {
    project: projectStore,
    canvas: canvasStore.canvas,
    images: Object.fromEntries(
      Object.entries(layerHistoryStore).map(([id, state]) => {
        const image = getImageOf(id);
        if (!image) return [];
        return [
          id,
          {
            current: image,
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

  const renderer = getWebglRenderer();
  if (renderer === undefined) throw new Error('wwww');
  // 2) サムネイル生成 (WebGL Controller のインスタンスを取得)
  const thumbnailDataURL = await exportThumbnailDataURL(renderer, thumbnailSize, thumbnailSize);

  // 3) JSON に thumbnail フィールドを追加
  return JSON.stringify({
    ...base,
    thumbnail: thumbnailDataURL,
    thumbnailSize,
  });
};

export async function saveProject(existingPath?: string) {
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
      defaultPath: await path.join(home, `sledge/${projectStore.name}.sledge`),
      filters: [{ name: 'sledge project', extensions: ['sledge'] }],
    });
  }

  if (typeof selectedPath === 'string') {
    setProjectStore('path', selectedPath);
    const data = await parseCurrentProject();
    await writeTextFile(selectedPath, data);
    console.log('project saved to:', selectedPath);

    setProjectStore('isProjectChangedAfterSave', false);
    addRecentFile(getFileNameAndPath(selectedPath));
  } else {
    console.log('save cancelled');
  }
}
