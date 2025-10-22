import { FileLocation } from '@sledge/core';
import { changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { addLayer, BlendMode, LayerType } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { setFileStore } from '~/stores/EditorStores';
import { loadImageData, loadLocalImage } from '~/utils/DataUtils';
import { eventBus } from '~/utils/EventBus';
import { normalizeJoin, pathToFileLocation } from '~/utils/FileUtils';

export async function importImageFromPath(location: FileLocation): Promise<boolean> {
  if (!location || !location.path || !location.name) {
    console.log('Invalid file location');
    return false;
  }
  const path = normalizeJoin(location.path, location.name);
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

  changeCanvasSizeWithNoOffset(
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
      uniqueName: false,
    }
  );

  anvilManager.registerAnvil(initLayer.id, new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

  eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: `Import ${location.name}` });
  eventBus.emit('preview:requestUpdate', { layerId: initLayer.id });

  return true;
}
