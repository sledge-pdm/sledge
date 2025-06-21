import { getReferencedZoom } from '~/controllers/canvas/CanvasController';
import { Vec2 } from '~/models/types/Vector';
import { interactStore, setInteractStore } from '~/stores/EditorStores';

class CanvasAreaInteract {
  private pointers = new Map<number, Vec2>();

  private lastPointX: number = 0;
  private lastPointY: number = 0;

  private lastDist: number = 0;

  private offsetX = () => interactStore.offsetOrigin.x + interactStore.offset.x;
  private offsetY = () => interactStore.offsetOrigin.y + interactStore.offset.y;
  private transform = (x: number, y: number, zoom: number) => {
    return `translate(${x}px, ${y}px) scale(${zoom})`;
  };

  public updateTransform = () => {
    this.canvasStack.style.transform = this.transform(this.offsetX(), this.offsetY(), interactStore.zoom);
  };

  constructor(
    private canvasStack: HTMLDivElement,
    private wrapperRef: HTMLDivElement
  ) {}

  static isDraggable(e: PointerEvent) {
    return e.buttons === 4 || (e.buttons === 1 && e.ctrlKey);
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
        this.wrapperRef.setPointerCapture(e.pointerId);
        // ピンチズームの開始時に距離を記録
        const [p0, p1] = Array.from(this.pointers.values());
        this.lastDist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
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
        setInteractStore('offset', {
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

        // (6) 適用
        setInteractStore('zoom', newZoom);
        setInteractStore('offset', {
          x: interactStore.offset.x + canvasMidX * (zoomOld - newZoom) + dxCanvas,
          y: interactStore.offset.y + canvasMidY * (zoomOld - newZoom) + dyCanvas,
        });
        +this.updateTransform();
      }
    } else {
      // タッチ以外
      if (CanvasAreaInteract.isDraggable(e)) {
        this.pointers.set(e.pointerId, now);
        if (interactStore.isDragging) {
          const dx = e.clientX - prev.x;
          const dy = e.clientY - prev.y;
          setInteractStore('offset', {
            x: interactStore.offset.x + dx,
            y: interactStore.offset.y + dy,
          });
          this.updateTransform();
        }
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
    setInteractStore('zoom', zoomNew);
    setInteractStore('offset', {
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
    this.wrapperRef.addEventListener('pointermove', this.onPointerMove);
    this.wrapperRef.addEventListener('pointerup', this.onPointerUp);
    this.wrapperRef.addEventListener('pointercancel', this.onPointerCancel);
    // wheel
    this.wrapperRef.addEventListener('wheel', this.onWheel, { passive: true });
    // keyboard
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  public removeInteractListeners() {
    this.wrapperRef.removeEventListener('pointerdown', this.onPointerDown);
    this.wrapperRef.removeEventListener('pointermove', this.onPointerMove);
    this.wrapperRef.removeEventListener('pointerup', this.onPointerUp);
    this.wrapperRef.removeEventListener('pointercancel', this.onPointerCancel);
    this.wrapperRef.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}

export default CanvasAreaInteract;
