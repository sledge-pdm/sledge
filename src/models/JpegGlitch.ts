import { safeInvoke } from "~/utils/tauri";
import { layerStore } from "./Store";
import { updateImageData } from "./data/LayerImage";

export async function runJpegGlitchAndApply(
  canvas: HTMLCanvasElement,
  image: ImageData,
  seed: number
) {
  const encoded = base64EncodeBytes(new Uint8Array(image.data.buffer));

  const result = await safeInvoke<string>("jpeg_glitch", {
    encoded,
    width: image.width,
    height: image.height,
    seed,
  });

  if (!result || !result.startsWith("data:image/jpeg")) {
    console.warn("jpeg_glitch failed or returned invalid data URI.");
    return;
  }

  const img = new Image();
  img.src = result;

  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = () => {
      console.error(
        "Image failed to load. Data URI might be invalid or corrupted."
      );
      console.log("Data URI preview:", result.slice(0, 300) + "...");
    };
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  // オプション：Canvas → ImageData に戻して layer に反映
  const newImageData = ctx.getImageData(0, 0, image.width, image.height);
  updateImageData(layerStore.activeLayerId, newImageData);
}

function base64EncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
