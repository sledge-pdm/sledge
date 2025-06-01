// controllers/layer/SelectionManager.ts

import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import SelectionMask from '~/controllers/selection/SelectionMask';
import { TileIndex } from '~/types/Tile';
import { Vec2 } from '~/types/Vector';
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

export interface BoundBox {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export type SelectionFragment = PixelFragment | RectFragment | TileFragment;
export type SelectionEditMode = 'add' | 'subtract' | 'replace';

class SelectionManager {
  private currentMode: SelectionEditMode = 'replace';

  private moveOffset: Vec2 = { x: 0, y: 0 };
  public setMoveOffset(moveOffset: Vec2) {
    this.moveOffset = moveOffset;
  }
  public getMoveOffset() {
    return this.moveOffset;
  }

  // 「確定済み」のマスク
  private selectionMask: SelectionMask;
  // プレビュー専用マスク (onMove/preview 用)
  private previewMask?: SelectionMask;
  private boundBox: BoundBox | undefined;

  public getBoundBox(withMoveOffset: boolean): BoundBox | undefined {
    if (withMoveOffset && this.boundBox) {
      return {
        top: this.boundBox.top + this.moveOffset.y,
        bottom: this.boundBox.bottom + this.moveOffset.y,
        left: this.boundBox.left + this.moveOffset.x,
        right: this.boundBox.right + this.moveOffset.x,
      };
    } else {
      return this.boundBox;
    }
  }

  constructor() {
    // キャンバスサイズが不明な段階では (0,0) で初期化
    this.selectionMask = new SelectionMask(0, 0);
    this.previewMask = undefined;
    this.boundBox = undefined;

    // キャンバスサイズ変更が来たら、両方のマスクをリサイズ
    eventBus.on('canvas:sizeChanged', (e: any) => {
      this.selectionMask.changeSize(e.newSize);
      if (this.previewMask) {
        this.previewMask.changeSize(e.newSize);
      }
    });
  }

  getSelectionMask() {
    return this.selectionMask;
  }

  /** 「プレビュー開始時」に呼ぶ */
  beginPreview(mode: SelectionEditMode) {
    this.currentMode = mode;
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

    this.updateBoundingBox();

    // プレビューをクリア
    this.previewMask = undefined;
    eventBus.emit('selection:changed', { commit: true });
  }

  /** プレビューをキャンセル */
  cancelPreview() {
    this.previewMask = undefined;
    eventBus.emit('selection:changed', { commit: false });
  }

  clear() {
    this.previewMask = undefined;
    this.selectionMask.clear();
    eventBus.emit('selection:changed', { commit: false });
  }

  public updateBoundingBox(): BoundBox | undefined {
    this.boundBox = undefined;
    // 初期値として「未検出」を表すものをセットしておく
    let minX = this.selectionMask.getWidth(); // x の最小値：最初は w より大きい値（必ず更新されるように）
    let maxX = -1; // x の最大値：最初は -1（必ず更新されるように）
    let minY = this.selectionMask.getHeight(); // y の最小値：最初は h
    let maxY = -1; // y の最大値：最初は -1

    // (x, y) を手動でインクリメントしながら全要素を１回走査する
    let idx = 0; // フラグ配列のインデックス
    for (let y = 0; y < this.selectionMask.getHeight(); y++) {
      for (let x = 0; x < this.selectionMask.getWidth(); x++, idx++) {
        // flags[idx] が 1 なら座標 (x, y) が対象となる
        if (this.selectionMask.getMask()[idx]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // もし maxX が -1 のままだったら、1 の立っている点が一度もなかったことを示す
    if (maxX < 0) {
      return undefined;
    }

    this.boundBox = { left: minX, right: maxX, top: minY, bottom: maxY };
    return this.boundBox;
  }
}

export const selectionManager = new SelectionManager();
export const getCurrentSelection = () => selectionManager.getSelectionMask();
