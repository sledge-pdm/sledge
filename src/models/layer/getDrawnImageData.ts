import { currentPen, findLayerById, hexToRGB } from "~/stores/Store";
import { drawBrush } from "~/utils/BrushUtils";
import { setPixel } from "~/utils/ImageUtils";
import { drawLine } from "~/utils/MetricUtils";
import { cloneImageData } from "../factories/utils";

export enum DrawState {
  start,
  move,
  end,
}

export const getDrawnImageData = (
  layerId: string,
  state: DrawState,
  currentImage: ImageData,
  canvasPosition: { x: number; y: number },
  lastPosition?: { x: number; y: number }, // 移動中などの補完用
): ImageData | undefined => {
  const layer = findLayerById(layerId);
  if (layer === undefined) return undefined;
  canvasPosition = getMagnificationPosition(
    canvasPosition,
    layer.dotMagnification,
  );
  if (lastPosition)
    lastPosition = getMagnificationPosition(
      lastPosition,
      layer.dotMagnification,
    );

  const pen = currentPen();
  const [r, g, b] = hexToRGB(pen.color);

  const imageData = cloneImageData(currentImage);

  drawBrush(canvasPosition.x, canvasPosition.y, pen.size, (x, y) => {
    if (pen.name === "eraser") {
      setPixel(imageData, x, y, 0, 0, 0, 0);
    } else {
      setPixel(imageData, x, y, r, g, b, 255);
    }
  });

  if (state === DrawState.move && lastPosition !== undefined)
    drawLine(
      lastPosition.x,
      lastPosition.y,
      canvasPosition.x,
      canvasPosition.y,
      (x, y) => {
        drawBrush(x, y, pen.size, (px, py) => {
          if (pen.name === "eraser") {
            setPixel(imageData, x, y, 0, 0, 0, 0);
          } else {
            setPixel(imageData, px, py, r, g, b, 255);
          }
        });
      },
    );

  return imageData;
};

function getMagnificationPosition(
  position: { x: number; y: number },
  dotMagnification: number,
) {
  return {
    x: Math.floor(position.x / dotMagnification),
    y: Math.floor(position.y / dotMagnification),
  };
}
