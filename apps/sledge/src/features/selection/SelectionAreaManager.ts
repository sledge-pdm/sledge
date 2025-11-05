// controllers/layer/SelectionManager.ts

import { TileIndex } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
import { apply_mask_offset, combine_masks_add, combine_masks_replace, combine_masks_subtract, fill_rect_mask, slice_patch_rgba } from '@sledge/wasm';
// import { getActiveAgent, getBufferOf } from '~/features/layer/agent/LayerAgentManager'; // legacy
import { activeLayer } from '~/features/layer';
import { getBufferPointer } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { FloatingBuffer } from '~/features/selection/FloatingMoveManager';
import SelectionMask from '~/features/selection/SelectionMask';
import { SelectionEditMode } from '~/stores/editor/InteractStore';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
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

export type WholeFragment = {
  kind: 'whole';
  mask: Uint8Array; // should be sized to layer width * layer height
};
export type PartialFragment = {
  kind: 'partial';
  partialMask: Uint8Array; // should be sized to bbox width * bbox height
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SelectionFragment = PixelFragment | RectFragment | TileFragment | WholeFragment | PartialFragment;
export type SelectionState = 'idle' | 'selected';

class SelectionAreaManager {
  private prevEditMode: SelectionEditMode | undefined = undefined;
  private state: SelectionState = 'idle';

  public getState() {
    return this.state;
  }

  public setState(state: SelectionState) {
    this.state = state;

    eventBus.emit('selection:updateSelectionMenu', {});
    eventBus.emit('selection:updateSelectionPath', {});
  }

  private areaOffset: Vec2 = { x: 0, y: 0 };
  public setAreaOffset(areaOffset: Vec2) {
    this.areaOffset = areaOffset;
  }
  public getAreaOffset() {
    return this.areaOffset;
  }

  public shiftOffset(delta: Vec2) {
    this.areaOffset.x += delta.x;
    this.areaOffset.y += delta.y;

    eventBus.emit('selection:updateSelectionMenu', {});
    eventBus.emit('selection:updateSelectionPath', {});
    return this.areaOffset;
  }

  public setOffset(pos: Vec2) {
    this.areaOffset = pos;

    eventBus.emit('selection:updateSelectionMenu', {});
    eventBus.emit('selection:updateSelectionPath', {});
    return this.areaOffset;
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

  public isSelected() {
    return !this.selectionMask.isCleared();
  }

  constructor() {
    const width = canvasStore?.canvas?.width ?? 0;
    const height = canvasStore?.canvas?.height ?? 0;
    this.selectionMask = new SelectionMask(width, height);
    this.previewMask = undefined;

    // キャンバスサイズ変更が来たら、両方のマスクをリサイズ
    eventBus.on('canvas:sizeChanged', (e: any) => {
      console.log('SelectionManager: Received canvas:sizeChanged event', e.newSize);
      this.selectionMask.changeSize(e.newSize);
      if (this.previewMask) {
        this.previewMask.changeSize(e.newSize);
      }
      // console.log('SelectionManager: Mask size updated to', e.newSize);
    });
  }

  isMaskOverlap(pos: Vec2, withMoveOffset?: boolean) {
    console.log(pos);
    if (withMoveOffset) {
      pos.x -= this.areaOffset.x;
      pos.y -= this.areaOffset.y;
    }
    return this.selectionMask.get(pos) === 1;
  }

  /** 「プレビュー開始時」に呼ぶ */
  beginPreview(tempEditMode: SelectionEditMode) {
    this.prevEditMode = interactStore.selectionEditMode;
    setInteractStore('selectionEditMode', tempEditMode);
    this.updatePreview();
  }

  updatePreview() {
    this.areaOffset = { x: 0, y: 0 };

    eventBus.emit('selection:updateSelectionMenu', {});
    eventBus.emit('selection:updateSelectionPath', {});

    if (this.selectionMask.getWidth() === 0 || this.selectionMask.getHeight() === 0) {
      console.warn('SelectionManager: SelectionMask size is 0x0. Canvas size may not be initialized properly.');
      return;
    }

    if (interactStore.selectionEditMode === 'replace') {
      // Replace なら確定済みをクリアしてから新しい previewMask
      this.selectionMask.clear();
      // クリア後は状態をidleに更新
      this.setState('idle');
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

    // マスクサイズが0x0の場合はエラーログを出力して早期リターン
    if (this.previewMask.getWidth() === 0 || this.previewMask.getHeight() === 0) {
      console.warn('SelectionManager: PreviewMask size is 0x0. Canvas size may not be initialized properly.');
      return;
    }

    let changed = false;

    const anvil = getAnvilOf(activeLayer().id);
    switch (frag.kind) {
      case 'pixel': {
        this.previewMask.setFlag(frag.position, 1);
        changed = true;
        break;
      }
      case 'whole': {
        this.previewMask.setMask(frag.mask);
        changed = true;
        break;
      }
      case 'tile': {
        if (!anvil) break;
        const tileSize = anvil.getTileSize();
        // TileIndex (legacy) から行列を推測 (row/col か x/y を許容)
        const col: number = (frag.index as any).col ?? (frag.index as any).x;
        const row: number = (frag.index as any).row ?? (frag.index as any).y;
        const ox = col * tileSize;
        const oy = row * tileSize;
        for (let x = ox; x < ox + tileSize; x++) {
          for (let y = oy; y < oy + tileSize; y++) {
            this.previewMask.setFlag({ x, y }, 1);
            changed = true;
          }
        }
        break;
      }
      case 'rect': {
        const sx = frag.startPosition.x;
        const sy = frag.startPosition.y;

        // wasmで矩形を高速描画
        const mask = this.previewMask.getMask();
        fill_rect_mask(mask, this.previewMask.getWidth(), this.previewMask.getHeight(), sx, sy, frag.width, frag.height);
        changed = true;
        break;
      }
      case 'partial': {
        // PartialFragmentから全体マスクに部分的にコピー
        const fullMask = this.previewMask.getMask();
        const fullWidth = this.previewMask.getWidth();
        const fullHeight = this.previewMask.getHeight();

        for (let py = 0; py < frag.height; py++) {
          for (let px = 0; px < frag.width; px++) {
            const srcIndex = py * frag.width + px;
            const destX = frag.x + px;
            const destY = frag.y + py;

            if (destX >= 0 && destX < fullWidth && destY >= 0 && destY < fullHeight) {
              const destIndex = destY * fullWidth + destX;
              fullMask[destIndex] = frag.partialMask[srcIndex];
            }
          }
        }
        changed = true;
        break;
      }
    }

    // 毎回プレビュー更新イベント
    if (changed) {
      eventBus.emit('selection:updateSelectionMenu', {});
      eventBus.emit('selection:updateSelectionPath', {});
    }
  }

  /** onEnd で呼ぶ */
  commit() {
    if (!this.previewMask) return;
    const activeMask = this.selectionMask.getMask(); // Uint8Array
    const preview = this.previewMask.getMask();

    let resultMask: Uint8Array;

    if (interactStore.selectionEditMode === 'replace') {
      // まるごと差し替え
      resultMask = new Uint8Array(combine_masks_replace(preview));
    } else if (interactStore.selectionEditMode === 'add') {
      // OR 合成: wasmで高速処理
      resultMask = new Uint8Array(combine_masks_add(activeMask, preview));
    } else if (interactStore.selectionEditMode === 'subtract') {
      // AND NOT: wasmで高速処理
      resultMask = new Uint8Array(combine_masks_subtract(activeMask, preview));
    } else {
      resultMask = activeMask;
    }

    if (this.prevEditMode) {
      setInteractStore('selectionEditMode', this.prevEditMode);
      this.prevEditMode === undefined;
    }

    this.selectionMask.setMask(resultMask);

    // プレビューをクリア
    this.previewMask = undefined;

    // 状態を更新: 選択範囲があればselected、なければidle
    this.updateStateBasedOnSelection();

    eventBus.emit('selection:updateSelectionMenu', { immediate: true });
    eventBus.emit('selection:updateSelectionPath', { immediate: true });
  }

  selectAll() {
    this.selectionMask.selectAll();

    this.previewMask = undefined;
    this.updateStateBasedOnSelection();

    eventBus.emit('selection:updateSelectionMenu', { immediate: true });
    eventBus.emit('selection:updateSelectionPath', { immediate: true });
  }

  /** プレビューをキャンセル */
  cancelPreview() {
    this.previewMask = undefined;

    // 状態を更新: キャンセル後は選択状況に基づいて状態を決定
    this.updateStateBasedOnSelection();

    eventBus.emit('selection:updateSelectionMenu', { immediate: true });
    eventBus.emit('selection:updateSelectionPath', { immediate: true });
  }

  public getCombinedMask(): Uint8Array {
    if (!this.previewMask) return this.selectionMask.getMask();

    const baseMask = this.selectionMask.getMask();
    const previewMask = this.previewMask.getMask();

    // wasmで高速合成
    if (interactStore.selectionEditMode === 'subtract') {
      return new Uint8Array(combine_masks_subtract(baseMask, previewMask));
    } else {
      // add または replace の場合は OR 合成
      return new Uint8Array(combine_masks_add(baseMask, previewMask));
    }
  }

  /**
   * moveOffsetで見せかけていた選択範囲の移動を、実際のselectionMaskに反映する
   */
  commitOffset() {
    const offset = this.getAreaOffset();
    if (offset.x === 0 && offset.y === 0) return;

    const width = this.selectionMask.getWidth();
    const height = this.selectionMask.getHeight();
    const oldMask = this.selectionMask.getMask();

    // wasmで高速オフセット適用
    const newMask = new Uint8Array(apply_mask_offset(oldMask, width, height, offset.x, offset.y));

    this.selectionMask.setMask(newMask);
    this.setAreaOffset({ x: 0, y: 0 }); // オフセットをリセット

    // 状態を更新: 移動完了後はselected状態に戻す
    if (this.isSelected()) {
      this.setState('selected');
    }

    eventBus.emit('selection:updateSelectionMenu', { immediate: true });
    eventBus.emit('selection:updateSelectionPath', { immediate: true });
  }

  clear() {
    this.previewMask = undefined;
    this.selectionMask.clear();
    this.setState('idle');

    eventBus.emit('selection:updateSelectionMenu', { immediate: true });
    eventBus.emit('selection:updateSelectionPath', { immediate: true });
  }

  /**
   * 現在の選択状況に基づいてstateを更新する
   */
  private updateStateBasedOnSelection() {
    if (this.isSelected()) {
      this.setState('selected'); // 選択状態に遷移
    } else {
      this.setState('idle');
    }
  }

  public getFloatingBuffer(srcLayerId: string): FloatingBuffer | undefined {
    const buffer = getBufferPointer(srcLayerId);
    if (!buffer) return;
    // canvasStore が未初期化なケース (極早期テスト) では何も返さない
    if (!canvasStore?.canvas) return;
    const { width, height } = canvasStore.canvas;

    this.commitOffset();
    this.commit();

    // slice buffer by mask
    const patch = slice_patch_rgba(new Uint8Array(buffer.buffer), width, height, new Uint8Array(this.getCombinedMask()), width, height, 0, 0);

    return {
      buffer: new Uint8ClampedArray(patch.buffer),
      offset: { x: 0, y: 0 },
      width,
      height,
    };
  }
}

export const selectionManager = new SelectionAreaManager();
export const getCurrentSelection = () => selectionManager.getSelectionMask();
