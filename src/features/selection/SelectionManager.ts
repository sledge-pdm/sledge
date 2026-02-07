import { Size2D, Vec2 } from '@sledge-pdm/core';
import { apply_mask_offset } from '~/utils/wasm';
import SelectionMask from './SelectionMask';

export type SelectionUpdateType = 'front' | 'back' | 'both';
type SelectionListener = (payload: { type: SelectionUpdateType }) => void;

class SelectionManager {
  // NOTE: "Empty mask" should be undefined as much as possible
  // preview (temporary)
  private front: SelectionMask | undefined;
  // committed
  private back: SelectionMask | undefined;
  private offset: Vec2 = { x: 0, y: 0 };
  private listeners = new Set<SelectionListener>();

  constructor() {
    this.front = undefined;
    this.back = undefined;
  }

  getFront() {
    return this.front;
  }

  getBack() {
    return this.back;
  }

  setFront(mask: SelectionMask | undefined) {
    this.front = mask;
    this.emitChange('front');
  }

  setBack(mask: SelectionMask | undefined) {
    this.back = mask;
    this.emitChange('back');
  }

  getSelection(): SelectionMask | undefined {
    if (this.front) return this.front;
    return this.back;
  }

  getOffset() {
    return this.offset;
  }

  setOffset(offset: Vec2) {
    this.offset = offset;
    this.emitChange(this.front ? 'front' : 'back');
  }

  shiftOffset(delta: Vec2) {
    this.offset = { x: this.offset.x + delta.x, y: this.offset.y + delta.y };
    this.emitChange(this.front ? 'front' : 'back');
  }

  clearOffset() {
    this.offset = { x: 0, y: 0 };
  }

  commitOffset() {
    const target = this.back ?? this.front;
    if (!target) {
      this.clearOffset();
      return;
    }
    if (this.offset.x === 0 && this.offset.y === 0) return;

    const width = target.getWidth();
    const height = target.getHeight();
    const newMask = new Uint8Array(apply_mask_offset(target.getMask(), width, height, this.offset.x, this.offset.y));
    target.setMask(newMask);
    this.clearOffset();
    this.emitChange(this.front ? 'front' : 'back');
  }

  getBoundBox() {
    return this.front?.getBoundBox() ?? this.back?.getBoundBox();
  }

  hasSelection() {
    const mask = this.front ?? this.back;
    if (!mask) return false;
    return !mask.isCleared();
  }

  resize(size: Size2D) {
    this.front?.changeSize(size);
    this.back?.changeSize(size);
    this.clearOffset();
    this.emitChange('both');
  }

  applyFrontToBack() {
    this.back = this.front;
    this.front = undefined;
    this.emitChange('both');
  }

  clearFront() {
    this.front = undefined;
    this.clearOffset();
    this.emitChange('front');
  }

  clearBack() {
    this.back = undefined;
    this.clearOffset();
    this.emitChange('back');
  }

  clearAll() {
    this.front = undefined;
    this.back = undefined;
    this.clearOffset();
    this.emitChange('both');
  }

  subscribe(listener: SelectionListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitChange(type: SelectionUpdateType) {
    for (const listener of this.listeners) {
      listener({ type });
    }
  }
}

export const selectionManager = new SelectionManager();
