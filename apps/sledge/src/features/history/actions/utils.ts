import { rawToWebp } from "@sledge/anvil";
import { LayerSnapshot, PackedLayerSnapshot } from "~/features/history/actions/types";
import { findLayerById } from "~/features/layer";
import { getAnvilOf } from "~/features/layer/anvil/AnvilManager";

// Helper function to convert LayerSnapshot to PackedLayerSnapshot
export function packLayerSnapshot(layerSnapshot: LayerSnapshot): PackedLayerSnapshot {
  if (layerSnapshot.image) {
    const image = layerSnapshot.image;
    const webpBuffer = rawToWebp(new Uint8Array(image.buffer.buffer), image.width, image.height);
    return {
      layer: layerSnapshot.layer,
      image: {
        webpBuffer,
        width: image.width,
        height: image.height,
      },
    };
  }
  return { layer: layerSnapshot.layer };
}

export function getPackedLayerSnapshot(layerId: string): PackedLayerSnapshot | undefined {
  const layer = findLayerById(layerId);
  const anvil = getAnvilOf(layerId);
  if (!layer || !anvil) return;

  const webpBuffer = rawToWebp(new Uint8Array(anvil.getBufferPointer().buffer), anvil.getWidth(), anvil.getHeight());
  return {
    layer,
    image: {
      webpBuffer,
      width: anvil.getWidth(),
      height: anvil.getHeight(),
    },
  };
}
