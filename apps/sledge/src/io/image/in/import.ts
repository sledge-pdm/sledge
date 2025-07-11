import { changeCanvasSize } from '~/controllers/canvas/CanvasController';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { addLayer } from '~/controllers/layer/LayerListController';
import { BlendMode, LayerType } from '~/models/layer/Layer';
import { setProjectStore } from '~/stores/ProjectStores';

export function importImageFromWindow(): boolean {
  // @ts-ignore
  const imageData = window.__IMAGE__;

  if (!imageData || !imageData.buffer || !imageData.width || !imageData.height || !imageData.fileName) {
    console.log('No image data found');
    return false;
  }

  const fileName = imageData.fileName;
  const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.');

  setProjectStore('name', fileNameWithoutExt);

  changeCanvasSize({
    width: imageData.width,
    height: imageData.height,
  });

  const initLayer = addLayer({
    enabled: true,
    name: fileName,
    mode: BlendMode.normal,
    type: LayerType.Dot,
    dotMagnification: 1,
    opacity: 1,
  });

  const agent = getAgentOf(initLayer.id);
  agent?.setBuffer(Uint8ClampedArray.from(imageData.buffer), false, true);

  return true;
}
