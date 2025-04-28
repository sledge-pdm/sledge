import { path } from '@tauri-apps/api';
import { open as dialogOpen, save } from '@tauri-apps/plugin-dialog';
import {
  BaseDirectory,
  mkdir,
  readTextFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import {
  adjustZoomToFit,
  centeringCanvas,
} from '~/controllers/canvas/CanvasController';
import resetLayerImage from '~/controllers/layer/LayerController';
import { findLayerById } from '~/controllers/layer_list/LayerListController';
import { getImageOf } from '~/routes/editor';
import { addRecent } from '~/stores/GlobalStores';
import { canvasStore, setCanvasStore } from '~/stores/project/canvasStore';
import {
  layerHistoryStore,
  layerListStore,
  projectStore,
  setLayerHistoryStore,
  setLayerListStore,
  setProjectStore,
} from '~/stores/ProjectStores';
import { Layer } from '~/types/Layer';
import { decodeImageData, encodeImageData } from '~/utils/ImageUtils';
import { getFileNameAndPath } from '~/utils/pathUtils';

export async function importProjectJsonFromFileSelection(): Promise<
  string | undefined
> {
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
    console.log('ファイルが選択されていません');
    return undefined;
  }
  console.log(file);
  const jsonText = await readTextFile(file);
  const projectJson = JSON.parse(jsonText);

  await importProjectJson(projectJson);

  return file;
}

export async function importProjectJsonFromPath(filePath: string) {
  if (!filePath) {
    console.log('ファイルが選択されていません');
    return;
  }
  const jsonText = await readTextFile(filePath);
  const projectJson = JSON.parse(jsonText);

  importProjectJson(projectJson);
}

export async function importProjectJson(projectJson: any) {
  if (projectJson.project) {
    console.log(projectJson.project);
    setProjectStore('name', projectJson.project.name || undefined);
    setProjectStore('path', projectJson.project.path || undefined);
  }

  if (projectJson.canvas) {
    const { width, height } = projectJson.canvas;
    setCanvasStore('canvas', 'width', width);
    setCanvasStore('canvas', 'height', height);
  }

  if (projectJson.images) {
    setLayerHistoryStore({});
    Object.keys(projectJson.images).forEach((id) => {
      console.log(`read ${id}`);
      const imageData = projectJson.images[id];
      const agent = resetLayerImage(
        id,
        Number(imageData.dotMagnification || 1)
      );
      const image = decodeImageData(
        imageData.current,
        Number(imageData.width),
        Number(imageData.height)
      );
      agent.setImage(image);
    });
  }

  if (
    projectJson.layer &&
    projectJson.layer.layers &&
    Array.isArray(projectJson.layer.layers)
  ) {
    const layers: Layer[] = [];
    projectJson.layer.layers.map((l: any) => {
      layers.push({
        ...l,
        dsl: undefined,
      } as Layer);
    });

    setLayerListStore('layers', layers);
    setLayerListStore('activeLayerId', projectJson.layer.activeLayerId);
  }

  adjustZoomToFit();
  centeringCanvas();
}

export const parseCurrentProject = (): string => {
  return JSON.stringify({
    project: projectStore,
    canvas: canvasStore.canvas,
    images: Object.fromEntries(
      Object.entries(layerHistoryStore).map(([id, state]) => {
        const image = getImageOf(id);
        if (!image) return [];
        return [
          id,
          {
            current: encodeImageData(image),
            width: image.width,
            height: image.height,
            dotMagnification: findLayerById(id)?.dotMagnification,
          },
        ];
      })
    ),
    layer: {
      layers: layerListStore.layers.map((layer) => ({
        ...layer,
        dsl: undefined, // TODO: save dsl
      })),
      activeLayerId: layerListStore.activeLayerId,
    },
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
      console.warn('ディレクトリ作成スキップまたは失敗:', e);
    }

    const home = await path.homeDir();
    selectedPath = await save({
      title: 'Sledge プロジェクトを保存',
      defaultPath: await path.join(home, `sledge/${projectStore.name}.sledge`),
      filters: [{ name: 'Sledge Project', extensions: ['sledge'] }],
    });
  }

  if (typeof selectedPath === 'string') {
    setProjectStore('path', selectedPath);
    const data = parseCurrentProject();
    await writeTextFile(selectedPath, data);
    console.log('プロジェクト保存:', selectedPath);

    setProjectStore('isProjectChangedAfterSave', false);

    const fileLoc = getFileNameAndPath(selectedPath);
    if (fileLoc !== undefined) addRecent(fileLoc);
  } else {
    console.log('保存キャンセルされました');
  }
}
