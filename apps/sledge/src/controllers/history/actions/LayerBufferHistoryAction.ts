import { Vec2 } from '@sledge/core';
import { BaseHistoryAction } from '~/controllers/history/actions/BaseHistoryAction';
import { TileIndex } from '~/controllers/layer/image/managers/Tile';
import { getAgentOf } from '~/controllers/layer/LayerAgentManager';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { cancelMove } from '~/controllers/selection/SelectionOperator';
import { RGBAColor } from '~/utils/ColorUtils';

export type DiffKind = 'pixel' | 'tile' | 'whole';

export type DiffBase = {
  kind: DiffKind;
};

export type PixelDiff = DiffBase & {
  kind: 'pixel';
  position: Vec2;
  before: RGBAColor;
  after: RGBAColor;
};

export type TileDiff = DiffBase & {
  kind: 'tile';
  index: TileIndex;
  beforeColor: RGBAColor | undefined;
  afterColor: RGBAColor;
};

export type WholeDiff = DiffBase & {
  kind: 'whole';
  before: Uint8ClampedArray;
  after: Uint8ClampedArray;
};

export type Diff = PixelDiff | TileDiff | WholeDiff;

export const getDiffHash = (diff: Diff) => {
  switch (diff.kind) {
    case 'pixel':
      // 数値ベースのハッシュに変更（文字列生成を避ける）
      return diff.position.x * 100000 + diff.position.y; // 5桁まで対応
    case 'tile':
      return `tile:${diff.index.row},${diff.index.column}`;
    case 'whole':
      return `whole`; // whole以外には存在しないはず
  }
};

export type DiffAction = {
  diffs: Map<string | number, Diff>;
};

// Packed color helpers (AABBGGRR or similar). We'll use little-endian RR GG BB AA for clarity in JS.
export type PackedRGBA = number; // 0xAARRGGBB
export const packRGBA = (c: RGBAColor): PackedRGBA => (c[3] << 24) | (c[0] << 16) | (c[1] << 8) | c[2];
export const unpackRGBA = (p: PackedRGBA): RGBAColor => [(p >> 16) & 0xff, (p >> 8) & 0xff, p & 0xff, (p >>> 24) & 0xff];

// Tile-bucketed SoA patch representation
export type PixelListPatch = {
  type: 'pixels';
  tile: TileIndex;
  idx: Uint16Array; // tile-local indices
  before: Uint32Array; // packed RGBA
  after: Uint32Array; // packed RGBA
};

export type TileFillPatch = {
  type: 'tileFill';
  tile: TileIndex;
  before?: PackedRGBA;
  after: PackedRGBA;
};

export type WholePatch = {
  type: 'whole';
  before: Uint8ClampedArray;
  after: Uint8ClampedArray;
};

export type LayerBufferPatch = {
  layerId: string;
  pixels?: PixelListPatch[];
  tiles?: TileFillPatch[];
  whole?: WholePatch;
};

// history action for layer buffer changes
export class LayerBufferHistoryAction extends BaseHistoryAction {
  readonly type = 'layer_buffer' as const;

  constructor(
    public readonly layerId: string,
    public readonly actionOrPatch: DiffAction | LayerBufferPatch,
    context?: any
  ) {
    super(context, `Layer ${layerId}: buffer`);
  }

  protected undoTileDiff(tileDiff: TileDiff): void {
    if (tileDiff.beforeColor) getAgentOf(this.layerId)?.getTileManager().fillWholeTile(tileDiff.index, tileDiff.beforeColor, false);
  }

  protected redoTileDiff(tileDiff: TileDiff): void {
    getAgentOf(this.layerId)?.getTileManager().fillWholeTile(tileDiff.index, tileDiff.afterColor, false);
  }

  undo(): void {
    const layerId = this.layerId;
    const agent = getAgentOf(layerId);
    if (!agent) {
      console.log(`no agent found for  ${layerId}.`);
      return;
    }

    // If the selection is in move state, cancel the move
    if (selectionManager.isMoveState()) {
      cancelMove();
      return;
    }

    console.log(`undo layer ${layerId}.`);
    // Prefer patch path when available
    const anyPayload = this.actionOrPatch as any;
    if (anyPayload && anyPayload.layerId && (anyPayload.pixels || anyPayload.tiles || anyPayload.whole)) {
      agent.undoPatch(anyPayload);
    } else {
      // fallback to legacy Map-based action
      // undoAction emits 'webgl:requestUpdate' and 'preview:requestUpdate' actions itself!
      agent.undoAction(this.actionOrPatch as DiffAction);
    }
  }

  redo(): void {
    const layerId = this.layerId;
    const agent = getAgentOf(layerId);
    if (!agent) {
      console.log(`no agent found for  ${layerId}.`);
      return;
    }

    // If the selection is in move state, cancel the move
    if (selectionManager.isMoveState()) {
      cancelMove();
      return;
    }

    console.log(`redo layer ${layerId}.`);
    const anyPayload = this.actionOrPatch as any;
    if (anyPayload && anyPayload.layerId && (anyPayload.pixels || anyPayload.tiles || anyPayload.whole)) {
      agent.redoPatch(anyPayload);
    } else {
      // redoAction emits 'webgl:requestUpdate' and 'preview:requestUpdate' actions itself!
      agent.redoAction(this.actionOrPatch as DiffAction);
    }
  }
}
