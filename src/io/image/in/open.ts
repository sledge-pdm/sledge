import { changeCanvasSize as setCanvasSize } from '~/controllers/canvas/CanvasController';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { addLayer } from '~/controllers/layer/LayerListController';
import { BlendMode, LayerType } from '~/models/layer/Layer';
import { loadImageBuffer, loadLocalImage } from '~/utils/DataUtils';

export const initProjectWithNewImage = async (filePath: string, fileName: string) => {
  const imagePath = `${filePath}\\${fileName}`;
  const imageBitmap = await loadLocalImage(imagePath);
  setCanvasSize({
    width: imageBitmap.width,
    height: imageBitmap.height,
  });

  const imageBuffer = await loadImageBuffer(imageBitmap); // ここで画像のバッファを読み込み
  imageBitmap.close();

  const initLayer = addLayer({
    enabled: true,
    name: fileName,
    mode: BlendMode.normal,
    type: LayerType.Dot,
    dotMagnification: 1,
    opacity: 1,
  });

  const agent = getAgentOf(initLayer.id);
  agent?.setBuffer(Uint8ClampedArray.from(imageBuffer), false, true);
};
