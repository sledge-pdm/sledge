import { decodeImageData, encodeImageData } from "./ImageUtils";
import { safeInvoke } from "./tauri";

export async function invertImageInRust(
  image: ImageData
): Promise<ImageData | undefined> {
  const encoded = encodeImageData(image);
  const result = await safeInvoke<string>("invert", {
    encoded,
    width: image.width,
    height: image.height,
  });

  if (!result) return;

  return decodeImageData(result, image.width, image.height);
}
