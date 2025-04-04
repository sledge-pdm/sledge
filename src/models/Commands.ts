import { decodeImageData, encodeImageData } from "~/utils/ImageUtils";
import { safeInvoke } from "~/utils/tauri";
import { cloneImageData, updateImageData } from "./data/LayerImage";
import { layerStore } from "./Store";

export enum ImageCommands {
  INVERT = "invert",
  GRAYSCALE = "grayscale",
  SEPIA = "sepia",
}

export async function runImageCommand(
  commandName: ImageCommands,
  image: ImageData
): Promise<ImageData | undefined> {
  const encoded = encodeImageData(cloneImageData(image));
  const result = await safeInvoke<string>(commandName.toString(), {
    encoded,
    width: image.width,
    height: image.height,
  });

  if (!result) return;

  return decodeImageData(result, image.width, image.height);
}

export async function runAndApplyActive(
  commandName: ImageCommands,
  image: ImageData
) {
  const afterImage = await runImageCommand(commandName, image);
  if (afterImage !== undefined) {
    updateImageData(layerStore.activeLayerId, afterImage);
  } else {
    console.log("invert failed.");
  }
}
