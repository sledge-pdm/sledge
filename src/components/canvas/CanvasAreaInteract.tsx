import {
  canvasStore,
  getReferencedZoom,
  setCanvasStore,
} from "~/stores/project/canvasStore";

class CanvasAreaInteract {
  private dragPosition: Vec2 = { x: 0, y: 0 };

  private lastX: number[] = [0, 0];
  private lastY: number[] = [0, 0];
  private lastDist: number = 0;

  constructor() { }

  private getMutualMove = (move0: number, move1: number) => {
    // 逆方向なら0
    if (Math.sign(move0) !== Math.sign(move1)) return 0;
    return Math.min(move1, move0);
  };

  private handleTouchMove(e: TouchEvent, canvasStack: HTMLDivElement) {
    if (canvasStore.isInStroke) return;

    if (e.touches.length === 1) {
      const xMove0 = e.touches[0].clientX - this.lastX[0];
      if (xMove0 !== 0 && this.lastX[0] !== 0) {
        setCanvasStore("offset", {
          x: canvasStore.offset.x + xMove0,
          y: canvasStore.offset.y,
        });
      }
      const yMove0 = e.touches[0].clientY - this.lastY[0];
      if (yMove0 !== 0 && this.lastY[0] !== 0) {
        setCanvasStore("offset", {
          x: canvasStore.offset.x,
          y: canvasStore.offset.y + yMove0,
        });
      }
      this.lastX[0] = e.touches[0].clientX;
      this.lastY[0] = e.touches[0].clientY;
    }
    if (e.touches.length >= 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist =
        Math.sqrt(dx * dx + dy * dy) * canvasStore.touchZoomSensitivity;
      if (this.lastDist !== 0) {
        const scaleFactor = dist / this.lastDist;
        const zoomOld = canvasStore.zoom;
        const zoomNew = zoomOld * scaleFactor;
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = canvasStack.getBoundingClientRect();
        const canvasX = (midX - rect.left) / zoomOld;
        const canvasY = (midY - rect.top) / zoomOld;
        setCanvasStore("zoom", zoomNew);
        setCanvasStore("offset", {
          x: canvasStore.offset.x + canvasX * (zoomOld - zoomNew),
          y: canvasStore.offset.y + canvasY * (zoomOld - zoomNew),
        });
      }
      const xMove0 = e.touches[0].clientX - this.lastX[0];
      const xMove1 = e.touches[1].clientX - this.lastX[1];
      const mutualMoveX = this.getMutualMove(xMove0, xMove1);
      if (mutualMoveX !== 0 && this.lastX[0] !== 0 && this.lastX[1] !== 0) {
        setCanvasStore("offset", {
          x: canvasStore.offset.x + mutualMoveX,
          y: canvasStore.offset.y,
        });
      }
      const yMove0 = e.touches[0].clientY - this.lastY[0];
      const yMove1 = e.touches[1].clientY - this.lastY[1];
      const mutualMoveY = this.getMutualMove(yMove0, yMove1);
      if (mutualMoveY !== 0 && this.lastY[0] !== 0 && this.lastY[1] !== 0) {
        setCanvasStore("offset", {
          x: canvasStore.offset.x,
          y: canvasStore.offset.y + mutualMoveY,
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
    e.preventDefault();
    const referencedZoom = getReferencedZoom();
    const delta =
      (e.deltaY > 0 ? -canvasStore.wheelZoomStep : canvasStore.wheelZoomStep) *
      referencedZoom;

    const zoomOld = canvasStore.zoom;
    const zoomNew = Math.max(
      canvasStore.zoomMin * referencedZoom,
      Math.min(canvasStore.zoomMax * referencedZoom, canvasStore.zoom + delta),
    );
    const rect = canvasStack.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) / zoomOld;
    const canvasY = (e.clientY - rect.top) / zoomOld;
    setCanvasStore("zoom", zoomNew);
    setCanvasStore("offset", {
      x: canvasStore.offset.x + canvasX * (zoomOld - zoomNew),
      y: canvasStore.offset.y + canvasY * (zoomOld - zoomNew),
    });
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.buttons === 4 || (e.buttons === 1 && canvasStore.isCtrlPressed)) {
      e.preventDefault();
      e.stopPropagation();
      setCanvasStore("isDragging", true);
      this.dragPosition = { x: e.clientX, y: e.clientY };
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (e.buttons === 4 || (e.buttons === 1 && canvasStore.isCtrlPressed)) {
      e.preventDefault();
      e.stopPropagation();
      if (canvasStore.isDragging) {
        const dx = e.clientX - this.dragPosition.x;
        const dy = e.clientY - this.dragPosition.y;
        setCanvasStore("offset", {
          x: canvasStore.offset.x + dx,
          y: canvasStore.offset.y + dy,
        });
        this.dragPosition = { x: e.clientX, y: e.clientY };
      }
    }
  }

  private handleMouseOff(e: MouseEvent) {
    setCanvasStore("isDragging", false);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey) setCanvasStore("isCtrlPressed", true);
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.key === "Control") setCanvasStore("isCtrlPressed", false);
  }

  public setInteractListeners(
    wrapper: HTMLDivElement,
    canvasStack: HTMLDivElement,
  ) {
    wrapper.addEventListener("touchmove", (e) =>
      this.handleTouchMove.bind(this)(e, canvasStack),
    );
    wrapper.addEventListener("touchend", this.handleTouchEnd.bind(this));

    wrapper.addEventListener("wheel", (e) =>
      this.handleWheel.bind(this)(e, canvasStack),
    );

    wrapper.addEventListener("mousedown", this.handleMouseDown.bind(this));
    wrapper.addEventListener("mousemove", this.handleMouseMove.bind(this));
    wrapper.addEventListener("mouseup", this.handleMouseOff.bind(this));
    wrapper.addEventListener("mouseleave", this.handleMouseOff.bind(this));
    wrapper.addEventListener("mouseout", this.handleMouseOff.bind(this));

    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  }

  public removeInteractListeners(
    wrapper: HTMLDivElement,
    canvasStack: HTMLDivElement,
  ) {
    wrapper.removeEventListener("touchmove", (e) =>
      this.handleTouchMove.bind(this)(e, canvasStack),
    );
    wrapper.removeEventListener("touchend", this.handleTouchEnd.bind(this));

    wrapper.removeEventListener("wheel", (e) =>
      this.handleWheel.bind(this)(e, canvasStack),
    );

    wrapper.removeEventListener("mousedown", this.handleMouseDown.bind(this));
    wrapper.removeEventListener("mousemove", this.handleMouseMove.bind(this));
    wrapper.removeEventListener("mouseup", this.handleMouseOff.bind(this));
    wrapper.removeEventListener("mouseleave", this.handleMouseOff.bind(this));
    wrapper.removeEventListener("mouseout", this.handleMouseOff.bind(this));

    window.removeEventListener("keydown", this.handleKeyDown.bind(this));
    window.removeEventListener("keyup", this.handleKeyUp.bind(this));
  }
}

export default CanvasAreaInteract;
