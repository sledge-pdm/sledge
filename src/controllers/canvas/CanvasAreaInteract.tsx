import { getReferencedZoom } from '~/controllers/canvas/CanvasController';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { Vec2 } from '~/types/Vector';

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

  private handlePointerDown(e: PointerEvent) {
    this.lastPointX = e.clientX;
    this.lastPointY = e.clientY;

    // capture してドラッグ中も動きを取りこぼさない
    this.wrapperRef.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (e.pointerType === 'touch') {
      // タッチ
      if (this.pointers.size === 1) {
        setInteractStore('isDragging', true);
      } else if (this.pointers.size === 2) {
        // ピンチズームの開始時に距離を記録
        const [p0, p1] = Array.from(this.pointers.values());
        this.lastDist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      }
    } else {
      // タッチ以外
      if (e.buttons === 4 || (e.buttons === 1 && e.ctrlKey)) {
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
    this.pointers.set(e.pointerId, now);

    if (e.pointerType === 'touch') {
      // タッチ
      if (this.pointers.size === 1 && interactStore.isDragging) {
        // パン（ドラッグ移動）
        const dx = now.x - prev.x;
        const dy = now.y - prev.y;
        setInteractStore('offset', {
          x: interactStore.offset.x + dx,
          y: interactStore.offset.y + dy,
        });
        this.updateTransform();
      } else if (this.pointers.size === 2) {
        // ピンチズーム or 並進 + ズーム
        const [p0, p1] = Array.from(this.pointers.values());
        // 1) ズーム
        const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        const scale = dist / this.lastDist;
        this.lastDist = dist;
        // 中心点をキャンバス座標系に変換
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        const rect = this.canvasStack.getBoundingClientRect();
        const canvasX = (midX - rect.left) / interactStore.zoom;
        const canvasY = (midY - rect.top) / interactStore.zoom;
        // ズーム更新
        const newZoom = interactStore.zoom * scale;
        setInteractStore('zoom', newZoom);
        // オフセット補正
        setInteractStore('offset', {
          x: interactStore.offset.x + canvasX * (interactStore.zoom - newZoom),
          y: interactStore.offset.y + canvasY * (interactStore.zoom - newZoom),
        });
        // 2) 並進
        // （必要なら二本指の同方向移動分を追加）
        this.updateTransform();
      }
    } else {
      // タッチ以外
      if (e.buttons === 4 || (e.buttons === 1 && e.ctrlKey)) {
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
    // タッチキャンセルなど
    this.handlePointerUp(e);
  }

  private handleWheel(e: WheelEvent) {
    this.zoom(e.deltaY, 1);
  }

  private zoom(deltaY: number, multiply: number) {
    const referencedZoom = getReferencedZoom() ?? 1;
    const delta = (deltaY > 0 ? -interactStore.wheelZoomStep : interactStore.wheelZoomStep) * multiply;

    const zoomOld = interactStore.zoom;
    const zoomNew = Math.round((interactStore.zoom + interactStore.zoom * delta) * 1000) / 1000;

    if (zoomNew < interactStore.zoomMin * referencedZoom || interactStore.zoomMax * referencedZoom < zoomNew) return;

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
