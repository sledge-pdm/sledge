import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { interactStore } from '~/stores/EditorStores';
import { Vec2 } from '~/types/Vector';
import { imagePoolController } from './ImagePoolController';

export default class ImageInteract {
  private dragAnchor: Vec2 = { x: 0, y: 0 };
  private isDragging: boolean = false;

  private localPos: Vec2 = { x: 0, y: 0 };

  constructor(
    private wrapperRef: HTMLDivElement,
    private id: string
  ) {}

  private getEntry(): ImagePoolEntry | undefined {
    return imagePoolController.getEntries().get(this.id);
  }
  private setEntry(entry: ImagePoolEntry) {
    return imagePoolController.setEntry(this.id, entry);
  }

  private handlePointerDown(e: PointerEvent) {
    if (e.buttons === 1) {
      const entry = this.getEntry();
      if (entry) {
        this.isDragging = true;
        this.dragAnchor = { x: e.clientX, y: e.clientY };
        this.wrapperRef.setPointerCapture(e.pointerId);
      }
    }
  }

  private pendingMoveUpdate = false;

  private handlePointerMove(e: PointerEvent) {
    if (e.buttons === 1 && this.isDragging) {
      const dx = e.clientX - this.dragAnchor.x;
      const dy = e.clientY - this.dragAnchor.y;
      this.localPos.x += dx / interactStore.zoom;
      this.localPos.y += dy / interactStore.zoom;
      if (!this.pendingMoveUpdate) {
        this.pendingMoveUpdate = true;
        requestAnimationFrame(() => {
          this.wrapperRef.style.transform = `translate(${this.localPos.x}px,${this.localPos.y}px)`;
          this.pendingMoveUpdate = false;
        });
      }
      this.dragAnchor = { x: e.clientX, y: e.clientY };
    }
  }

  private handlePointerUp(e: PointerEvent) {
    if (this.isDragging) {
      const entry = this.getEntry();
      if (entry) {
        entry.x = this.localPos.x;
        entry.y = this.localPos.y;
        this.setEntry(entry);
      }
      this.isDragging = false;
    }
  }

  private onCancel = (e: PointerEvent) => {
    this.isDragging = false;
    this.wrapperRef.releasePointerCapture(e.pointerId);
  };

  private onDown = this.handlePointerDown.bind(this);
  private onMove = this.handlePointerMove.bind(this);
  private onUp = this.handlePointerUp.bind(this);

  public setInteractListeners() {
    this.wrapperRef.addEventListener('pointerdown', this.onDown);
    this.wrapperRef.addEventListener('pointermove', this.onMove);
    this.wrapperRef.addEventListener('pointerup', this.onUp);
    this.wrapperRef.addEventListener('pointercancel', this.onCancel);
  }
  public removeInteractListeners() {
    this.wrapperRef.removeEventListener('pointerdown', this.onDown);
    this.wrapperRef.removeEventListener('pointermove', this.onMove);
    this.wrapperRef.removeEventListener('pointerup', this.onUp);
    this.wrapperRef.removeEventListener('pointercancel', this.onCancel);
  }
}
