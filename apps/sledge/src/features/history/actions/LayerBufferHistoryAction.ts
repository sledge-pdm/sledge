import { RGBAColor } from '~/features/color';
import { getAgentOf } from '~/features/layer/agent/LayerAgentManager';
import { TileIndex } from '~/features/layer/managers/Tile';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { cancelMove } from '~/features/selection/SelectionOperator';
import { BaseHistoryAction } from '../base';

export type PackedRGBA = number;
export const packRGBA = (c: RGBAColor): PackedRGBA => (c[3] << 24) | (c[0] << 16) | (c[1] << 8) | c[2];
export const unpackRGBA = (p: PackedRGBA): RGBAColor => [(p >> 16) & 0xff, (p >> 8) & 0xff, p & 0xff, (p >>> 24) & 0xff];

export type PixelListPatch = {
  type: 'pixels';
  tile: TileIndex;
  idx: Uint16Array;
  before: Uint32Array;
  after: Uint32Array;
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
    public readonly patch: LayerBufferPatch,
    context?: any
  ) {
    super(context, `Layer ${layerId}: buffer`);
  }

  undo(): void {
    const layerId = this.layerId;
    const agent = getAgentOf(layerId);
    if (!agent) {
      console.log(`no agent found for  ${layerId}.`);
      return;
    }
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      return;
    }
    console.log(`undo layer ${layerId}.`);
    agent.undoPatch(this.patch);
  }

  redo(): void {
    const layerId = this.layerId;
    const agent = getAgentOf(layerId);
    if (!agent) {
      console.log(`no agent found for  ${layerId}.`);
      return;
    }
    if (floatingMoveManager.isMoving()) {
      cancelMove();
      return;
    }
    console.log(`redo layer ${layerId}.`);
    agent.redoPatch(this.patch);
  }
}
