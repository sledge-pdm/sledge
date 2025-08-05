import { Vec2 } from '@sledge/core';
import { getReferencedZoom, setOffset, setRotation, setZoom } from '~/controllers/canvas/CanvasController';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';

class CanvasAreaInteract {
  private pointers = new Map<number, Vec2>();

  private lastPointX: number = 0;
  private lastPointY: number = 0;

  private lastDist: number = 0;
  private lastAngle: number = 0;

  private offsetX = () => interactStore.offsetOrigin.x + interactStore.offset.x;
  private offsetY = () => interactStore.offsetOrigin.y + interactStore.offset.y;
  private transform = (x: number, y: number, zoom: number) => {
    return `translate(${x}px, ${y}px) scale(${zoom})`;
  };

  public updateTransform = () => {
    this.canvasStack.style.transform = this.transform(this.offsetX(), this.offsetY(), interactStore.zoom);
  };

  public updateCursor = (cursor: 'auto' | 'default' | 'grab' | 'grabbing') => {
    this.canvasStack.style.cursor = cursor;
    this.wrapperRef.style.cursor = cursor;
  };

  constructor(
    private canvasStack: HTMLDivElement,
    private wrapperRef: HTMLDivElement
  ) {}

  static isDraggable(e: PointerEvent) {
    return e.buttons === 4 || (e.buttons === 1 && e.ctrlKey && !selectionManager.isSelected()); // [2]
  }

  private handlePointerDown(e: PointerEvent) {
    this.lastPointX = e.clientX;
    this.lastPointY = e.clientY;
    // this.wrapperRef.setPointerCapture(e.pointerId); ←前まで
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (e.pointerType === 'touch') {
      // タッチ
      if (this.pointers.size === 1) {
        this.wrapperRef.setPointerCapture(e.pointerId);
        setInteractStore('isDragging', true);
      } else if (this.pointers.size === 2) {
        for (const id of this.pointers.keys()) {
          this.wrapperRef.setPointerCapture(id);
        }
        this.wrapperRef.setPointerCapture(e.pointerId);
        // ピンチズームの開始時に距離を記録
        const [p0, p1] = Array.from(this.pointers.values());
        this.lastDist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        this.lastAngle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      }
    } else {
      // タッチ以外
      if (CanvasAreaInteract.isDraggable(e)) {
        this.wrapperRef.setPointerCapture(e.pointerId);
        setInteractStore('isDragging', true);
      }
    }
  }

  private handlePointerMove(e: PointerEvent) {
    this.lastPointX = e.clientX;
    this.lastPointY = e.clientY;

    if (!this.pointers.has(e.pointerId)) return;
    const prev = this.pointers.get(e.pointerId)!;
    const now = { x: e.clientX, y: e.clientY };

    if (e.pointerType === 'touch') {
      // タッチ
      if (this.pointers.size === 1 && interactStore.isDragging) {
        // 一本指のパン
        this.pointers.set(e.pointerId, now);
        const dx = now.x - prev.x,
          dy = now.y - prev.y;
        setOffset({
          x: interactStore.offset.x + dx,
          y: interactStore.offset.y + dy,
        });
        this.updateTransform();
      } else if (this.pointers.size === 2) {
        // 2 本指: まず旧指位置をコピーしてから更新
        const prevPointers = new Map(this.pointers);
        this.pointers.set(e.pointerId, now);
        const oldPts = Array.from(prevPointers.values());
        const newPts = Array.from(this.pointers.values());
        const prevMidX = (oldPts[0].x + oldPts[1].x) / 2;
        const prevMidY = (oldPts[0].y + oldPts[1].y) / 2;
        const [p0, p1] = newPts;

        // (3) ズーム
        const zoomOld = interactStore.zoom;
        const distNew = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        const scaleFact = distNew / this.lastDist;
        this.lastDist = distNew;
        const newZoom = zoomOld * scaleFact;

        // (4) 中点のキャンバス座標
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        const rect = this.canvasStack.getBoundingClientRect();
        const canvasMidX = (midX - rect.left) / zoomOld;
        const canvasMidY = (midY - rect.top) / zoomOld;

        // (5) 並進量（画面上の中点移動をキャンバス座標に）
        const dxCanvas = (midX - prevMidX) / zoomOld;
        const dyCanvas = (midY - prevMidY) / zoomOld;

        const angleNew = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const deltaRad = angleNew - this.lastAngle;
        this.lastAngle = angleNew;
        const rotOldDeg = interactStore.rotation;
        const rotNewDeg = Math.round(rotOldDeg + (deltaRad * 180) / Math.PI) % 360;

        // (6) 適用
        setZoom(newZoom);
        setOffset({
          x: interactStore.offset.x + canvasMidX * (zoomOld - newZoom) + dxCanvas,
          y: interactStore.offset.y + canvasMidY * (zoomOld - newZoom) + dyCanvas,
        });
        setRotation(rotNewDeg);

        this.updateTransform();
      }
    } else {
      // タッチ以外
      if (CanvasAreaInteract.isDraggable(e)) {
        this.pointers.set(e.pointerId, now);
        if (interactStore.isDragging) {
          const dx = e.clientX - prev.x;
          const dy = e.clientY - prev.y;
          setOffset({
            x: interactStore.offset.x + dx,
            y: interactStore.offset.y + dy,
          });
          this.updateTransform();
          this.updateCursor('grabbing');
        } else {
          this.updateCursor('grab');
        }
      } else {
        this.updateCursor('auto');
      }
    }
  }

  private handlePointerUp(e: PointerEvent) {
    this.lastPointX = e.clientX;
    this.lastPointY = e.clientY;

    this.pointers.delete(e.pointerId);
    this.wrapperRef.releasePointerCapture(e.pointerId);
    if (this.pointers.size === 0) {
      setInteractStore('isDragging', false);
      this.lastDist = 0;
    }
  }

  private handlePointerCancel(e: PointerEvent) {
    this.handlePointerUp(e);
  }

  private handleWheel(e: WheelEvent) {
    if (e.shiftKey) {
      const amount = globalConfig.editor.rotateDegreePerWheelScroll;
      if (e.deltaY > 0) {
        setRotation(interactStore.rotation + amount);
      } else {
        setRotation(interactStore.rotation - amount);
      }
      return;
    }
    this.zoom(e.deltaY, 1);
  }

  private zoom(deltaY: number, multiply: number) {
    const referencedZoom = getReferencedZoom() ?? 1;
    const delta = (deltaY > 0 ? -interactStore.wheelZoomStep : interactStore.wheelZoomStep) * multiply;

    const zoomOld = interactStore.zoom;
    let zoomNew = Math.round((interactStore.zoom + interactStore.zoom * delta) * 1000) / 1000;
    zoomNew = Math.min(Math.max(zoomNew, interactStore.zoomMin * referencedZoom), interactStore.zoomMax * referencedZoom);

    const rect = this.canvasStack.getBoundingClientRect();
    const canvasX = (this.lastPointX - rect.left) / zoomOld;
    const canvasY = (this.lastPointY - rect.top) / zoomOld;
    setZoom(zoomNew);
    setOffset({
      x: interactStore.offset.x + canvasX * (zoomOld - zoomNew),
      y: interactStore.offset.y + canvasY * (zoomOld - zoomNew),
    });

    this.updateTransform();
  }

  private KEY_ZOOM_MULT = 1.3;

  private handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey) {
      if (e.key === '+') {
        // in
        this.zoom(-1, this.KEY_ZOOM_MULT);
      } else if (e.key === '-') {
        // out
        this.zoom(1, this.KEY_ZOOM_MULT);
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.ctrlKey) {
      if (e.key === '+') {
        // in
      } else if (e.key === '-') {
        // out
      }
    }
  }

  private onPointerDown = this.handlePointerDown.bind(this);
  private onPointerMove = this.handlePointerMove.bind(this);
  private onPointerUp = this.handlePointerUp.bind(this);
  private onPointerCancel = this.handlePointerCancel.bind(this);
  private onWheel = this.handleWheel.bind(this);
  private onKeyDown = this.handleKeyDown.bind(this);
  private onKeyUp = this.handleKeyUp.bind(this);

  public setInteractListeners() {
    this.wrapperRef.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.wrapperRef.addEventListener('pointercancel', this.onPointerCancel);
    // wheel
    this.wrapperRef.addEventListener('wheel', this.onWheel, { passive: true });
    // keyboard
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  public removeInteractListeners() {
    this.wrapperRef.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.wrapperRef.removeEventListener('pointercancel', this.onPointerCancel);
    this.wrapperRef.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}

export default CanvasAreaInteract;
