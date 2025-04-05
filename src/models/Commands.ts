import { decodeImageData, encodeImageData } from "~/utils/ImageUtils";
import { safeInvoke } from "~/utils/tauri";
import { cloneImageData, updateImageData } from "./data/LayerImage";
import { layerStore } from "./Store";

export enum ImageCommands {
  INVERT = "invert",
  GRAYSCALE = "grayscale",
  GLITCH = "glitch",
  SEPIA = "sepia",
  BRIGHTNESS = "brightness",
}

export type ImageCommandParams =
  | {
      command:
        | ImageCommands.INVERT
        | ImageCommands.GRAYSCALE
        | ImageCommands.SEPIA;
    }
  | { command: ImageCommands.BRIGHTNESS; delta: number };

export async function runImageCommand(
  param: ImageCommandParams,
  image: ImageData
): Promise<ImageData | undefined> {
  const encoded = encodeImageData(cloneImageData(image));

  let invokeArgs: Record<string, unknown> = {
    encoded,
    width: image.width,
    height: image.height,
  };

  switch (param.command) {
    case ImageCommands.BRIGHTNESS:
      invokeArgs["delta"] = param.delta;
      break;
    // 他のコマンドは追加引数なし
  }

  const result = await safeInvoke<string>(param.command, invokeArgs);

  if (!result) return;

  return decodeImageData(result, image.width, image.height);
}

export async function runAndApplyActive(
  param: ImageCommandParams,
  image: ImageData
) {
  const afterImage = await runImageCommand(param, image);
  if (afterImage !== undefined) {
    updateImageData(layerStore.activeLayerId, afterImage);
  } else {
    console.log(`${param.command} failed.`);
  }
}
