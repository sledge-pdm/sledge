// controllers/layer/SelectionManager.ts

import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import SelectionMask from '~/controllers/selection/SelectionMask';
import { TileIndex } from '~/models/types/Tile';
import { Vec2 } from '~/models/types/Vector';
import { eventBus } from '~/utils/EventBus';

export type PixelFragment = {
  kind: 'pixel';
  position: Vec2;
};

export type RectFragment = {
  kind: 'rect';
  startPosition: Vec2;
  width: number;
  height: number;
};

export type TileFragment = {
  kind: 'tile';
  index: TileIndex;
};

export type SelectionFragment = PixelFragment | RectFragment | TileFragment;
export type SelectionEditMode = 'add' | 'subtract' | 'replace';

class SelectionManager {
  private currentMode: SelectionEditMode = 'replace';
  public getCurrentMode() {
    return this.currentMode;
  }

  private moveOffset: Vec2 = { x: 0, y: 0 };
  public setMoveOffset(moveOffset: Vec2) {
    this.moveOffset = moveOffset;
  }
  public getMoveOffset() {
    return this.moveOffset;
  }

  public move(delta: Vec2) {
    this.moveOffset.x += delta.x;
    this.moveOffset.y += delta.y;
    eventBus.emit('selection:moved', { newOffset: this.moveOffset });
    return this.moveOffset;
  }

  public moveTo(pos: Vec2) {
    this.moveOffset = pos;
    eventBus.emit('selection:moved', { newOffset: this.moveOffset });
    return this.moveOffset;
  }

  // 「確定済み」のマスク
  private selectionMask: SelectionMask;
  // プレビュー専用マスク (onMove/preview 用)
  private previewMask?: SelectionMask;

  public getSelectionMask() {
    return this.selectionMask;
  }

  public getPreviewMask() {
    return this.previewMask;
  }

  constructor() {
    // キャンバスサイズが不明な段階では (0,0) で初期化
    this.selectionMask = new SelectionMask(0, 0);
    this.previewMask = undefined;

    // キャンバスサイズ変更が来たら、両方のマスクをリサイズ
    eventBus.on('canvas:sizeChanged', (e: any) => {
      this.selectionMask.changeSize(e.newSize);
      if (this.previewMask) {
        this.previewMask.changeSize(e.newSize);
      }
    });
  }

  isMaskOverlap(pos: Vec2, withMoveOffset?: boolean) {
    if (withMoveOffset) {
      pos.x -= this.moveOffset.x;
      pos.y -= this.moveOffset.y;
    }
    return this.selectionMask.get(pos) === 1;
  }

  /** 「プレビュー開始時」に呼ぶ */
  beginPreview(mode: SelectionEditMode) {
    this.currentMode = mode;
    this.moveOffset = { x: 0, y: 0 };
    eventBus.emit('selection:moved', { newOffset: this.moveOffset });
    if (mode === 'replace') {
      // Replace なら確定済みをクリアしてから新しい previewMask
      this.selectionMask.clear();
    }
    // プレビュー用マスクを作り直し (activeMask には影響しない)
    this.previewMask = new SelectionMask(this.selectionMask.getWidth(), this.selectionMask.getHeight());
  }

  /**
   * プレビュー中に「このフラグメントだけをプレビュー」に含めたいとき呼ぶ
   * 例: onMove で RectFragment が渡されるごとに
   */
  setPreviewFragment(frag: SelectionFragment) {
    if (!this.previewMask) return;

    let changed = false;

    const tm = getActiveAgent()?.getTileManager()!;
    switch (frag.kind) {
      case 'pixel': {
        this.previewMask.setFlag(frag.position, 1);
        changed = true;
        break;
      }
      case 'tile': {
        const tile = tm.getTile(frag.index);
        const offset = tile.getOffset();
        for (let x = offset.x; x < offset.x + tile.size; x++) {
          for (let y = offset.y; y < offset.y + tile.size; y++) {
            this.previewMask.setFlag({ x, y }, 1);
            changed = true;
          }
        }
        break;
      }
      case 'rect': {
        const sx = frag.startPosition.x;
        const sy = frag.startPosition.y;
        const ex = sx + frag.width;
        const ey = sy + frag.height;
        for (let y = sy; y < ey; y++) {
          for (let x = sx; x < ex; x++) {
            this.previewMask.setFlag({ x, y }, 1);
            changed = true;
          }
        }
        break;
      }
    }

    // 毎回プレビュー更新イベント
    if (changed) eventBus.emit('selection:changed', { commit: false });
  }

  /** onEnd で呼ぶ */
  commit() {
    if (!this.previewMask) return;
    const size = this.selectionMask.getWidth() * this.selectionMask.getHeight();
    const activeMask = this.selectionMask.getMask(); // Uint8Array
    const preview = this.previewMask.getMask();

    if (this.currentMode === 'replace') {
      // まるごと差し替え
      this.selectionMask.setMask(preview); // ※SelectionMask 側に setMask(buf:Uint8Array) を用意しておく
    } else if (this.currentMode === 'add') {
      // OR 合成: activeMask |= preview
      for (let i = 0; i < size; i++) {
        activeMask[i] = activeMask[i] || preview[i];
      }
      this.selectionMask.setMask(activeMask);
    } else if (this.currentMode === 'subtract') {
      // AND NOT: activeMask &= !preview
      for (let i = 0; i < size; i++) {
        activeMask[i] = activeMask[i] && preview[i] ^ 1;
      }
      this.selectionMask.setMask(activeMask);
    }

    // プレビューをクリア
    this.previewMask = undefined;
    eventBus.emit('selection:changed', { commit: true });
  }

  /** プレビューをキャンセル */
  cancelPreview() {
    this.previewMask = undefined;
    eventBus.emit('selection:changed', { commit: false });
  }

  public getCombinedMask(): Uint8Array {
    if (!this.previewMask) return this.selectionMask.getMask();

    const combined = new Uint8Array(this.selectionMask.getMask());

    const modeSub = selectionManager.getCurrentMode() === 'subtract';

    for (let y = 0; y < this.selectionMask.getHeight(); y++) {
      for (let x = 0; x < this.selectionMask.getWidth(); x++) {
        const i = y * this.selectionMask.getWidth() + x;
        combined[i] = modeSub
          ? combined[i] & (this.previewMask.getMask()[i] ^ 1) // NAND
          : combined[i] | this.previewMask.getMask()[i]; // OR
      }
    }

    return combined;
  }

  clear() {
    this.previewMask = undefined;
    this.selectionMask.clear();
    eventBus.emit('selection:changed', { commit: false });
  }

  public forEachMaskPixels(fn: (position: Vec2) => void, withMoveOffset?: boolean) {}
}

export const selectionManager = new SelectionManager();
export const getCurrentSelection = () => selectionManager.getSelectionMask();
