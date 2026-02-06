// 新実装の選択範囲マネージャ
// 既存の実装にこだわらず実装を改築していく

import { Size2D } from '@sledge-pdm/core';
import SelectionMask from './SelectionMask';

export type SelectionUpdateType = 'front' | 'back' | 'both';
type SelectionListener = (payload: { type: SelectionUpdateType }) => void;

class SelectionManager {
  // NOTE: "Empty mask" should be undefined as much as possible
  // preview (temporary)
  private front: SelectionMask | undefined;
  // committed
  private back: SelectionMask | undefined;
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

  getMaskForDisplay(): Uint8Array | undefined {
    return this.front?.getMask() ?? this.back?.getMask();
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
    this.emitChange('both');
  }

  applyFrontToBack() {
    this.back = this.front;
    this.front = undefined;
    this.emitChange('both');
  }

  clearFront() {
    this.front = undefined;
    this.emitChange('front');
  }

  clearBack() {
    this.back = undefined;
    this.emitChange('back');
  }

  clearAll() {
    this.front = undefined;
    this.back = undefined;
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
