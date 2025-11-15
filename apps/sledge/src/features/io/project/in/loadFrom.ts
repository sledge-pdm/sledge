import { FileLocation } from '@sledge/core';
import { changeCanvasSizeWithNoOffset } from '~/features/canvas';
import { tryGetImageFromClipboard } from '~/features/io/clipboard/ClipboardUtils';
import { applyProjectLocation, applyProjectLocationFromPath } from '~/features/io/project/ProjectLocationManager';
import { addLayer, BlendMode, LayerType } from '~/features/layer';
import { anvilManager } from '~/features/layer/anvil/AnvilManager';
import { loadImageData, loadLocalImage } from '~/utils/DataUtils';
import { normalizeJoin } from '~/utils/FileUtils';
import { updateLayerPreview, updateWebGLCanvas } from '~/webgl/service';

export async function loadProjectFromImagePath(location: FileLocation): Promise<boolean> {
  if (!location || !location.path || !location.name) {
    console.log('Invalid file location');
    return false;
  }
  const path = normalizeJoin(location.path, location.name);
  const bitmap = await loadLocalImage(path);
  const imageData = await loadImageData(bitmap);

  if (!applyProjectLocationFromPath(path, 'image')) {
    applyProjectLocation(undefined, 'image');
  }

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

  updateWebGLCanvas(false, `Import ${location.name}`);
  updateLayerPreview(initLayer.id);

  return true;
}

export async function loadProjectFromClipboardImage(): Promise<boolean> {
  try {
    const data = await tryGetImageFromClipboard();

    if (!data) return false;

    applyProjectLocation(undefined, 'image');

    changeCanvasSizeWithNoOffset(
      {
        width: data.width,
        height: data.height,
      },
      true
    );

    const initLayer = addLayer(
      {
        enabled: true,
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

    anvilManager.registerAnvil(initLayer.id, new Uint8ClampedArray(data.imageBuf), data.width, data.height);

    updateWebGLCanvas(false, `Import from clipboard`);
    updateLayerPreview(initLayer.id);

    return true;
  } catch (e) {
    console.log('failed to load from clipboard');
    throw new Error('failed to load project from clipboard');
    return false;
  }
}
