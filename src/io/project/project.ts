// src/io/project.ts
import { path } from '@tauri-apps/api'
import { open as dialogOpen, save } from '@tauri-apps/plugin-dialog'
import {
  BaseDirectory,
  mkdir,
  readTextFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs'
import { Layer } from '~/types/Layer'
import { addRecent } from '~/stores/global/globalStore'
import {
  adjustZoomToFit,
  canvasStore,
  centeringCanvas,
  setCanvasStore,
} from '~/stores/project/canvasStore'
import {
  layerImageStore,
  setLayerImageStore,
} from '~/stores/project/layerImageStore'
import {
  findLayerById,
  layerStore,
  setLayerStore,
} from '~/stores/project/layerStore'
import { projectStore, setProjectStore } from '~/stores/project/projectStore'
import { decodeImageData, encodeImageData } from '~/utils/ImageUtils'
import { getFileNameAndPath } from '~/utils/pathUtils'

export async function importProjectJsonFromFileSelection(): Promise<
  string | undefined
> {
  const home = await path.homeDir()
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
  })
  if (!file) {
    console.log('ファイルが選択されていません')
    return undefined
  }
  console.log(file)
  const jsonText = await readTextFile(file)
  const projectJson = JSON.parse(jsonText)

  await importProjectJson(projectJson)

  return file
}

export async function importProjectJsonFromPath(filePath: string) {
  if (!filePath) {
    console.log('ファイルが選択されていません')
    return
  }
  const jsonText = await readTextFile(filePath)
  const projectJson = JSON.parse(jsonText)

  importProjectJson(projectJson)
}

export async function importProjectJson(projectJson: any) {
  if (projectJson.project) {
    console.log(projectJson.project)
    setProjectStore('name', projectJson.project.name)
    setProjectStore('path', projectJson.project.path)
  }

  if (projectJson.canvas) {
    const { width, height } = projectJson.canvas
    setCanvasStore('canvas', 'width', width)
    setCanvasStore('canvas', 'height', height)
  }

  if (projectJson.images) {
    setLayerImageStore({})
    Object.keys(projectJson.images).forEach((id) => {
      console.log(`read ${id}`)
      const imageData = projectJson.images[id]
      console.log(imageData)
      initLayerImage(id, Number(imageData.dotMagnification || 1))
      setLayerImageStore(
        id,
        'current',
        decodeImageData(
          imageData.current,
          Number(imageData.width),
          Number(imageData.height)
        )
      )
    })
  }

  if (
    projectJson.layer &&
    projectJson.layer.layers &&
    Array.isArray(projectJson.layer.layers)
  ) {
    const layers: Layer[] = []
    projectJson.layer.layers.map((l: any) => {
      layers.push({
        ...l,
        dsl: undefined,
      } as Layer)
    })

    setLayerStore('layers', layers)
    setLayerStore('activeLayerId', projectJson.layer.activeLayerId)
  }

  adjustZoomToFit()
  centeringCanvas()
}

export const parseCurrentProject = (): string => {
  return JSON.stringify({
    project: projectStore,
    canvas: canvasStore.canvas,
    images: Object.fromEntries(
      Object.entries(layerImageStore).map(([id, state]) => [
        id,
        {
          current: encodeImageData(state.current),
          width: state.current.width,
          height: state.current.height,
          dotMagnification: findLayerById(id)?.dotMagnification,
        },
      ])
    ),
    layer: {
      layers: layerStore.layers.map((layer) => ({
        ...layer,
        dsl: undefined, // TODO: save dsl
      })),
      activeLayerId: layerStore.activeLayerId,
    },
  })
}

export async function saveProject(existingPath?: string) {
  let selectedPath: String | null
  if (existingPath) {
    selectedPath = existingPath
  } else {
    try {
      await mkdir('sledge', {
        baseDir: BaseDirectory.Home,
        recursive: true,
      })
    } catch (e) {
      console.warn('ディレクトリ作成スキップまたは失敗:', e)
    }

    const home = await path.homeDir()
    selectedPath = await save({
      title: 'Sledge プロジェクトを保存',
      defaultPath: await path.join(home, `sledge/${projectStore.name}.sledge`),
      filters: [{ name: 'Sledge Project', extensions: ['sledge'] }],
    })
  }

  if (typeof selectedPath === 'string') {
    setProjectStore('path', selectedPath)
    const data = parseCurrentProject()
    await writeTextFile(selectedPath, data)
    console.log('プロジェクト保存:', selectedPath)

    const fileLoc = getFileNameAndPath(selectedPath)
    if (fileLoc !== undefined) addRecent(fileLoc)
  } else {
    console.log('保存キャンセルされました')
  }
}
