import { getReferencedZoom } from '~/controllers/canvas/CanvasController';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { Vec2 } from '~/types/Vector';

class CanvasAreaInteract {
  private dragPosition: Vec2 = { x: 0, y: 0 };

  private lastX: number[] = [0, 0];
  private lastY: number[] = [0, 0];
  private lastDist: number = 0;

  private getMutualMove = (move0: number, move1: number) => {
    // 逆方向なら0
    if (Math.sign(move0) !== Math.sign(move1)) return 0;
    return Math.min(move1, move0);
  };

  private handleTouchMove(e: TouchEvent, canvasStack: HTMLDivElement) {
    if (interactStore.isInStroke) return;

    if (e.touches.length === 1) {
      const xMove0 = e.touches[0].clientX - this.lastX[0];
      if (xMove0 !== 0 && this.lastX[0] !== 0) {
        setInteractStore('offset', {
          x: interactStore.offset.x + xMove0,
          y: interactStore.offset.y,
        });
      }
      const yMove0 = e.touches[0].clientY - this.lastY[0];
      if (yMove0 !== 0 && this.lastY[0] !== 0) {
        setInteractStore('offset', {
          x: interactStore.offset.x,
          y: interactStore.offset.y + yMove0,
        });
      }
      this.lastX[0] = e.touches[0].clientX;
      this.lastY[0] = e.touches[0].clientY;
    }
    if (e.touches.length >= 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy) * interactStore.touchZoomSensitivity;
      if (this.lastDist !== 0) {
        const scaleFactor = dist / this.lastDist;
        const zoomOld = interactStore.zoom;
        const zoomNew = zoomOld * scaleFactor;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = canvasStack.getBoundingClientRect();
        const canvasX = (midX - rect.left) / zoomOld;
        const canvasY = (midY - rect.top) / zoomOld;
        setInteractStore('zoom', zoomNew);
        setInteractStore('offset', {
          x: interactStore.offset.x + canvasX * (zoomOld - zoomNew),
          y: interactStore.offset.y + canvasY * (zoomOld - zoomNew),
        });
      }
      const xMove0 = e.touches[0].clientX - this.lastX[0];
      const xMove1 = e.touches[1].clientX - this.lastX[1];
      const mutualMoveX = this.getMutualMove(xMove0, xMove1);
      if (mutualMoveX !== 0 && this.lastX[0] !== 0 && this.lastX[1] !== 0) {
        setInteractStore('offset', {
          x: interactStore.offset.x + mutualMoveX,
          y: interactStore.offset.y,
        });
      }
      const yMove0 = e.touches[0].clientY - this.lastY[0];
      const yMove1 = e.touches[1].clientY - this.lastY[1];
      const mutualMoveY = this.getMutualMove(yMove0, yMove1);
      if (mutualMoveY !== 0 && this.lastY[0] !== 0 && this.lastY[1] !== 0) {
        setInteractStore('offset', {
          x: interactStore.offset.x,
          y: interactStore.offset.y + mutualMoveY,
        });
      }
      this.lastX[0] = e.touches[0].clientX;
      this.lastX[1] = e.touches[1].clientX;
      this.lastY[0] = e.touches[0].clientY;
      this.lastY[1] = e.touches[1].clientY;
      this.lastDist = dist;
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    this.lastX = [0, 0];
    this.lastY = [0, 0];
    this.lastDist = 0;
  }

  private handleWheel(e: WheelEvent, canvasStack: HTMLDivElement) {
    const referencedZoom = getReferencedZoom();
    if (!referencedZoom) return;
    const delta = e.deltaY > 0 ? -interactStore.wheelZoomStep : interactStore.wheelZoomStep;

    const zoomOld = interactStore.zoom;
    const zoomNew = Math.round((interactStore.zoom + interactStore.zoom * delta) * 1000) / 1000;

    if (zoomNew < interactStore.zoomMin * referencedZoom || interactStore.zoomMax * referencedZoom < zoomNew) return;

    const rect = canvasStack.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / zoomOld;
    const canvasY = (e.clientY - rect.top) / zoomOld;
    setInteractStore('zoom', zoomNew);
    setInteractStore('offset', {
      x: interactStore.offset.x + canvasX * (zoomOld - zoomNew),
      y: interactStore.offset.y + canvasY * (zoomOld - zoomNew),
    });
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    setInteractStore('isDragging', true);
    this.dragPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.buttons === 4 || (e.buttons === 1 && interactStore.isCtrlPressed)) {
      e.preventDefault();
      e.stopPropagation();
      setInteractStore('isDragging', true);
      this.dragPosition = { x: e.clientX, y: e.clientY };
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (e.buttons === 4 || (e.buttons === 1 && interactStore.isCtrlPressed)) {
      e.preventDefault();
      e.stopPropagation();
      if (interactStore.isDragging) {
        const dx = e.clientX - this.dragPosition.x;
        const dy = e.clientY - this.dragPosition.y;
        setInteractStore('offset', {
          x: interactStore.offset.x + dx,
          y: interactStore.offset.y + dy,
        });
        this.dragPosition = { x: e.clientX, y: e.clientY };
      }
    }
  }

  private handleMouseOff(e: MouseEvent) {
    setInteractStore('isDragging', false);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey) setInteractStore('isCtrlPressed', true);
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Control') setInteractStore('isCtrlPressed', false);
  }

  public setInteractListeners(wrapper: HTMLDivElement, canvasStack: HTMLDivElement) {
    wrapper.addEventListener('touchstart', (e) => this.handleTouchStart.bind(this)(e));
    wrapper.addEventListener('touchmove', (e) => this.handleTouchMove.bind(this)(e, canvasStack), { passive: true });
    wrapper.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

    wrapper.addEventListener('wheel', (e) => this.handleWheel.bind(this)(e, canvasStack), { passive: true });

    wrapper.addEventListener('mousedown', this.handleMouseDown.bind(this));
    wrapper.addEventListener('mousemove', this.handleMouseMove.bind(this));
    wrapper.addEventListener('mouseup', this.handleMouseOff.bind(this));
    wrapper.addEventListener('mouseleave', this.handleMouseOff.bind(this));
    wrapper.addEventListener('mouseout', this.handleMouseOff.bind(this));

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  public removeInteractListeners(wrapper: HTMLDivElement, canvasStack: HTMLDivElement) {
    wrapper.removeEventListener('touchmove', (e) => this.handleTouchMove.bind(this)(e, canvasStack));
    wrapper.removeEventListener('touchend', this.handleTouchEnd.bind(this));

    wrapper.removeEventListener('wheel', (e) => this.handleWheel.bind(this)(e, canvasStack));

    wrapper.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    wrapper.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    wrapper.removeEventListener('mouseup', this.handleMouseOff.bind(this));
    wrapper.removeEventListener('mouseleave', this.handleMouseOff.bind(this));
    wrapper.removeEventListener('mouseout', this.handleMouseOff.bind(this));

    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}

export default CanvasAreaInteract;
