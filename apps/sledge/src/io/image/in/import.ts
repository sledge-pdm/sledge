import { FileLocation } from '@sledge/core';
import { changeCanvasSize } from '~/features/canvas';
import { addLayer, BlendMode, LayerType } from '~/features/layer';
import { getAgentOf } from '~/features/layer/agent/LayerAgentManager';
import { setFileStore } from '~/stores/EditorStores';
import { loadImageData, loadLocalImage } from '~/utils/DataUtils';
import { join, pathToFileLocation } from '~/utils/FileUtils';

export async function importImageFromPath(location: FileLocation): Promise<boolean> {
  if (!location || !location.path || !location.name) {
    console.log('Invalid file location');
    return false;
  }
  const path = join(location.path, location.name);
  const bitmap = await loadLocalImage(path);
  const imageData = await loadImageData(bitmap);

  setFileStore('openAs', 'image');
  // it's not meant to overwrite image on save.
  // this should be treated well in save function using openAs state.
  setFileStore(
    'savedLocation',
    pathToFileLocation(path) ?? {
      name: undefined,
      path: undefined,
    }
  );

  console.log('path', {
    name: location.name,
    path: location.path,
  });

  changeCanvasSize(
    {
      width: imageData.width,
      height: imageData.height,
    },
    true
  );

  const initLayer = addLayer(
    {
      enabled: true,
      name: location.name,
      mode: BlendMode.normal,
      type: LayerType.Dot,
      dotMagnification: 1,
      opacity: 1,
    },
    {
      noDiff: true,
    }
  );

  const agent = getAgentOf(initLayer.id);
  agent?.setBuffer(Uint8ClampedArray.from(imageData.data), false, true);

  return true;
}
