import { combine_masks_subtract, flip_pixels_vertically } from '~/utils/wasm';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { createTexture, deleteTexture } from '~/utils/TextureUtils';
import { updateFrascoCanvas } from '~/webgl/service';
import { registerCommandsHistory } from '../history';
import { convertSelectionToImageSnippet } from '../history/command/snippet/ConvertSelectionToImageCommands';
import { createEntryFromRawBuffer, insertEntry, selectEntry } from '../image_pool';
import { activeLayer } from '../layer';
import { layerManager } from '../layer/frasco/LayerManager';
import { logUserInfo, logUserWarn } from '../log';
import { TOOL_CATEGORIES } from '../tools/Tools';
import { selectionManager } from './SelectionManager';
import { cancelSelection, getCurrentSelectionBuffer } from './service';

export function deleteSelectedArea(props?: { layerId?: string; noAction?: boolean }): Uint8ClampedArray | undefined {
  const selection = selectionManager.getBack();
  if (!selection) return;
  const lid = props?.layerId ?? activeLayer().id;
  const width = projectStore.canvas.size.width;
  const height = projectStore.canvas.size.height;

  const bBox = selection.getBoundBox();
  if (!bBox) {
    logUserWarn('No selection to delete.');
    return;
  }
  const layer = layerManager.getLayerOptional(lid);
  if (!layer) return;
  const mask = selection.getMask();
  const bounds = {
    x: bBox.left,
    y: bBox.top,
    width: bBox.right - bBox.left + 1,
    height: bBox.bottom - bBox.top + 1,
  };
  const glBounds = {
    x: bounds.x,
    y: height - bounds.y - bounds.height,
    width: bounds.width,
    height: bounds.height,
  };
  const maskTexture = buildSelectionMaskTexture(layer, mask, width, height);
  if (!maskTexture) return;

  if (props?.noAction) {
    layer.commitHistory(glBounds, { silent: true });
  } else {
    layer.commitHistory(glBounds, { context: { tool: TOOL_CATEGORIES.RECT_SELECTION } });
  }
  layer.applyEffectWithTextures({ fragmentSrc: CLEAR_WITH_MASK_300ES }, { u_mask: maskTexture }, glBounds);
  deleteTexture(layer.getGLContext(), maskTexture);

  updateFrascoCanvas('delete selected area');
  logUserInfo('Selected area cleared.');

  return layerManager.exportRawCanvas(lid);
}

const CLEAR_WITH_MASK_300ES = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_src;
uniform sampler2D u_mask;

void main() {
  vec4 src = texture(u_src, v_uv);
  float m = texture(u_mask, v_uv).r;
  if (m > 0.0) {
    outColor = vec4(0.0);
  } else {
    outColor = src;
  }
}
`;

export function invertSelectionArea() {
  selectionManager.commitOffset();
  const selection = selectionManager.getBack();
  const mask = selection?.getMask();
  if (!selection || !mask || mask.length === 0) {
    logUserWarn('No selection to invert.');
    return;
  }

  // 3) すべて 1 のマスクから現在のマスクを減算して反転を得る
  //    out = 1 & ~mask == ~mask
  let ones: Uint8Array | null = new Uint8Array(mask.length).fill(1);
  const inverted = new Uint8Array(combine_masks_subtract(ones, mask));

  ones = null;
  selection.setMask(inverted);
  logUserInfo('Selection inverted.');
}

export async function convertSelectionToImage(deleteAfter?: boolean) {
  const selectionData = getCurrentSelectionBuffer();
  if (!selectionData) return;
  const { buffer, bbox } = selectionData;

  const selectionBefore = selectionManager.getSelection();

  const { entry, image } = await createEntryFromRawBuffer(buffer, bbox.width, bbox.height);
  entry.descriptionName = '[ from selection ]';
  entry.transform.x = bbox.x;
  entry.transform.y = bbox.y;
  entry.transform.scaleX = 1;
  entry.transform.scaleY = 1;

  insertEntry(entry, image, { register: false });
  selectEntry(entry.id);

  if (deleteAfter) {
    deleteSelectedArea({ noAction: true });
  }
  cancelSelection();

  const entryIndex = projectStore.imagePool.entries.findIndex((item) => item.id === entry.id);
  const { commands, context } = convertSelectionToImageSnippet({
    entry,
    image,
    index: entryIndex,
    layerId: projectStore.layers.state.activeLayerId,
    selectionBefore,
    deleteAfter,
  });
  registerCommandsHistory(commands, { context });

  if (deleteAfter) {
    updateFrascoCanvas('delete selected area');
  }
}

function buildSelectionMaskTexture(layer: ReturnType<typeof layerManager.getLayerOptional>, mask: Uint8Array, width: number, height: number) {
  if (!layer) return;
  const expected = width * height;
  if (mask.length !== expected) return;
  const rgba = new Uint8ClampedArray(expected * 4);
  for (let i = 0; i < expected; i++) {
    const v = mask[i] ? 255 : 0;
    const idx = i * 4;
    rgba[idx] = v;
    rgba[idx + 3] = 255;
  }
  flip_pixels_vertically(new Uint8Array(rgba.buffer), width, height);
  const texture = createTexture(layer.getGLContext(), width, height, new Uint8Array(rgba.buffer));
  return texture;
}
