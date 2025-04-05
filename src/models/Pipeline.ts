import { decodeImageData, encodeImageData } from "~/utils/ImageUtils";
import { cloneImageData, updateImageData } from "./data/LayerImage";
import { safeInvoke } from "~/utils/tauri";
import { layerStore } from "./Store";

export async function runPipeline(
  commandLine: string,
  image: ImageData
): Promise<ImageData | undefined> {
  const encoded = encodeImageData(cloneImageData(image));

  const result = await safeInvoke<string>("run_pipeline", {
    dsl: commandLine, // "grayscale > brightness(20) > *out(layer0)",
    encoded,
    width: image.width,
    height: image.height,
  });

  if (!result) return;

  return decodeImageData(result, image.width, image.height);
}

export async function runPipelineAndApplyActive(
  commandLine: string,
  image: ImageData
) {
  const afterImage = await runPipeline(commandLine, image);
  if (afterImage !== undefined) {
    updateImageData(layerStore.activeLayerId, afterImage);
  } else {
    console.log(`${commandLine} failed.`);
  }
}
