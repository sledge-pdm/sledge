import { Component, JSX, Show } from 'solid-js';
import { normalizeRotation } from '~/features/canvas';
import { coordinateTransform } from '~/features/canvas/transform/UnifiedCoordinateTransform';
import { interactStore } from '~/stores/EditorStores';
import { WindowPos } from '~/types/CoordinateTypes';

export interface HandleProps {
  x: string;
  y: string;
  'data-pos': string;
  size: number;
  visible: boolean;

  elementProps?: Omit<JSX.HTMLAttributes<SVGRectElement>, 'data-pos'>;
}

const Handle: Component<HandleProps> = (props) => {
  const { style: handleStyle = {} } = props.elementProps ?? {};

  return (
    <rect
      stroke='black'
      fill='white'
      {...props.elementProps}
      class={'resize-handle'}
      data-pos={props['data-pos']}
      x={props.x}
      y={props.y}
      width={props.size}
      height={props.size}
      vector-effect={'non-scaling-stroke'}
      pointer-events='all'
      style={{
        ...(typeof handleStyle === 'object' ? handleStyle : {}),
        'box-sizing': 'content-box',
        cursor: props['data-pos'] === 'r' ? 'grab' : `${props['data-pos']}-resize`,
        transform: `translate(-${props.size / 2}px, -${props.size / 2}px)`,
        position: 'absolute',
        visibility: props.visible ? 'visible' : 'collapse',
        'pointer-events': props.visible ? 'auto' : 'none',
        'shape-rendering': 'geometricPrecision',
      }}
    />
  );
};

interface FrameHandlesProps {
  edge?: boolean;
  corner?: boolean;
  rotate?: boolean;
  visible: boolean;
  size: number;
  elementProps?: Omit<JSX.RectSVGAttributes<SVGRectElement>, 'data-pos'>;
}

export const FrameHandles: Component<FrameHandlesProps> = (props) => {
  return (
    <>
      <Show when={props.edge}>
        <Handle x={'50%'} y={'0'} data-pos='n' visible={props.visible} size={props.size} elementProps={props.elementProps} />
        <Handle x={'100%'} y={'50%'} data-pos='e' visible={props.visible} size={props.size} elementProps={props.elementProps} />
        <Handle x={'50%'} y={'100%'} data-pos='s' visible={props.visible} size={props.size} elementProps={props.elementProps} />
        <Handle x={'0'} y={'50%'} data-pos='w' visible={props.visible} size={props.size} elementProps={props.elementProps} />
      </Show>
      <Show when={props.corner}>
        <Handle x={'0'} y={'0'} data-pos='nw' visible={props.visible} size={props.size} elementProps={props.elementProps} />
        <Handle x={'100%'} y={'0'} data-pos='ne' visible={props.visible} size={props.size} elementProps={props.elementProps} />
        <Handle x={'100%'} y={'100%'} data-pos='se' visible={props.visible} size={props.size} elementProps={props.elementProps} />
        <Handle x={'0'} y={'100%'} data-pos='sw' visible={props.visible} size={props.size} elementProps={props.elementProps} />
      </Show>
      <Show when={props.rotate}>
        <Handle
          x={'50%'}
          y={`-${16 / interactStore.zoom}px`}
          data-pos='r'
          visible={props.visible}
          size={props.size}
          elementProps={props.elementProps}
        />
      </Show>
    </>
  );
};

/**
 * キャンバスリサイズ用フレーム矩形
 */
export interface FrameRect {
  x: number; // canvas space
  y: number; // canvas space
  width: number; // canvas space
  height: number; // canvas space
  rotation: number;
}

type ResizePos = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'r';

export interface OnCanvasFrameInteractOptions {
  keepAspect: 'always' | 'shift' | 'none';
  // this may should be separated size/position/rotation snap options
  snapToPixel: boolean;
}

const defaultInteractOptions: OnCanvasFrameInteractOptions = {
  keepAspect: 'shift',
  snapToPixel: false,
};

type InteractTarget = HTMLElement | SVGSVGElement;

export class OnCanvasFrameInteract {
  private pointerActive = false;
  private mode: 'drag' | 'resize' | 'rotate' | undefined;
  private capturedHandlePos: ResizePos | undefined;

  private startRect: FrameRect | undefined;
  private startPointerCanvasX = 0;
  private startPointerCanvasY = 0;
  private startPointerClientX = 0;
  private startPointerClientY = 0;
  private readonly minSize = 1;

  private options: OnCanvasFrameInteractOptions;

  constructor(
    private frameRoot: InteractTarget,
    private getRect: () => FrameRect,
    private onChange: (rect: FrameRect) => void,
    private onCommit: (start: FrameRect, end: FrameRect, e: PointerEvent) => void,
    options?: OnCanvasFrameInteractOptions
  ) {
    this.options = options ?? defaultInteractOptions;
  }

  public setOptions(options: Partial<OnCanvasFrameInteractOptions>) {
    this.options = { ...this.options, ...options };
  }

  private handlePointerDown = (e: PointerEvent) => {
    // 左クリック(通常: button===0) 以外は無視
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const handle = target.closest?.('.resize-handle') as HTMLElement | null;
    const dragSurface = target.closest?.('.drag-surface');

    const rect = this.getRect();
    if (!rect) return;

    this.startPointerClientX = e.clientX;
    this.startPointerClientY = e.clientY;
    const { x: cx, y: cy } = coordinateTransform.windowToCanvas(WindowPos.from(e));
    this.startPointerCanvasX = cx;
    this.startPointerCanvasY = cy;

    this.startRect = this.snapRectIfEnabled(rect);

    if (handle) {
      const dataPos = handle.getAttribute('data-pos') as ResizePos | undefined;
      this.capturedHandlePos = dataPos;
      if (dataPos === 'r') {
        this.mode = 'rotate';
      } else {
        this.mode = 'resize';
      }
    } else if (dragSurface) {
      this.mode = 'drag';
      this.capturedHandlePos = undefined;
    } else {
      return;
    }

    this.pointerActive = true;
    this.frameRoot.setPointerCapture(e.pointerId);
  };

  private handlePointerMove = (e: PointerEvent) => {
    this.emitChangeByPointerEvent(e);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.pointerActive) return;
    this.emitChangeByPointerEvent(e);
    this.pointerActive = false;
    try {
      this.frameRoot.releasePointerCapture(e.pointerId);
    } catch {}
    if (this.startRect) {
      const endRect = this.getRect();
      if (this.onCommit) this.onCommit(this.startRect, endRect, e);
    }
    this.mode = undefined;
    this.capturedHandlePos = undefined;
    this.startRect = undefined;
  };

  private emitChangeByPointerEvent = (e: PointerEvent) => {
    if (!this.pointerActive || !this.mode || !this.startRect) return;
    const { x: cx, y: cy } = coordinateTransform.windowToCanvas(WindowPos.from(e));
    const dx = cx - this.startPointerCanvasX;
    const dy = cy - this.startPointerCanvasY;

    if (this.mode === 'drag') {
      const nextRaw: FrameRect = {
        ...this.startRect,
        x: this.startRect.x + dx,
        y: this.startRect.y + dy,
      };
      const next: FrameRect = this.snapRectIfEnabled(nextRaw);
      this.onChange(next);
      return;
    }

    if (this.mode === 'resize') {
      let { x, y, width, height } = this.startRect;
      switch (this.capturedHandlePos) {
        case 'e':
          width = Math.max(this.minSize, this.startRect.width + dx);
          break;
        case 'w':
          width = Math.max(this.minSize, this.startRect.width - dx);
          x = this.startRect.x + dx;
          break;
        case 's':
          height = Math.max(this.minSize, this.startRect.height + dy);
          break;
        case 'n':
          height = Math.max(this.minSize, this.startRect.height - dy);
          y = this.startRect.y + dy;
          break;
        case 'se':
          width = Math.max(this.minSize, this.startRect.width + dx);
          height = Math.max(this.minSize, this.startRect.height + dy);
          break;
        case 'ne':
          width = Math.max(this.minSize, this.startRect.width + dx);
          height = Math.max(this.minSize, this.startRect.height - dy);
          y = this.startRect.y + dy;
          break;
        case 'sw':
          width = Math.max(this.minSize, this.startRect.width - dx);
          x = this.startRect.x + dx;
          height = Math.max(this.minSize, this.startRect.height + dy);
          break;
        case 'nw':
          width = Math.max(this.minSize, this.startRect.width - dx);
          x = this.startRect.x + dx;
          height = Math.max(this.minSize, this.startRect.height - dy);
          y = this.startRect.y + dy;
          break;
      }

      const shouldKeepAspect = this.options.keepAspect === 'always' || (this.options.keepAspect === 'shift' && e.shiftKey);
      if (shouldKeepAspect) {
        const aspect = this.startRect.width / this.startRect.height || 1;
        if (['n', 's'].includes(this.capturedHandlePos || '')) {
          width = Math.max(this.minSize, height * aspect);
        } else if (['e', 'w'].includes(this.capturedHandlePos || '')) {
          height = Math.max(this.minSize, width / aspect);
        } else {
          if (width / height > aspect) {
            height = Math.max(this.minSize, width / aspect);
          } else {
            width = Math.max(this.minSize, height * aspect);
          }
        }
        if (this.capturedHandlePos?.includes('w')) {
          x = this.startRect.x + (this.startRect.width - width);
        }
        if (this.capturedHandlePos?.includes('n')) {
          y = this.startRect.y + (this.startRect.height - height);
        }
      }

      const next: FrameRect = this.snapRectIfEnabled({ x, y, width, height, rotation: this.startRect.rotation });
      this.onChange(next);
    }

    if (this.mode === 'rotate') {
      const svgRect = this.frameRoot.getBoundingClientRect();
      if (!svgRect) return;
      const rectCenterX = (svgRect.left + svgRect.right) / 2;
      const rectCenterY = (svgRect.top + svgRect.bottom) / 2;

      const startAngle = Math.atan2(this.startPointerClientY - rectCenterY, this.startPointerClientX - rectCenterX);
      const currentAngle = Math.atan2(e.clientY - rectCenterY, e.clientX - rectCenterX);

      const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
      let newRotation = this.startRect.rotation + deltaAngle;
      newRotation = normalizeRotation(newRotation);

      const next: FrameRect = this.snapRectIfEnabled({ ...this.startRect, rotation: newRotation });
      this.onChange(next);
    }
  };

  public setInteractListeners() {
    this.removeInteractListeners();
    this.frameRoot.addEventListener('pointerdown', this.handlePointerDown as EventListener);
    this.frameRoot.addEventListener('pointermove', this.handlePointerMove as EventListener);
    this.frameRoot.addEventListener('pointerup', this.handlePointerUp as EventListener);
  }

  public removeInteractListeners() {
    this.frameRoot.removeEventListener('pointerdown', this.handlePointerDown as EventListener);
    this.frameRoot.removeEventListener('pointermove', this.handlePointerMove as EventListener);
    this.frameRoot.removeEventListener('pointerup', this.handlePointerUp as EventListener);
  }

  private snapRectIfEnabled(r: FrameRect): FrameRect {
    // TODO: more specific snap with separated option
    if (this.options.snapToPixel) {
      const snappedX = Math.round(r.x);
      const snappedY = Math.round(r.y);
      const snappedW = Math.max(1, Math.round(r.width));
      const snappedH = Math.max(1, Math.round(r.height));
      return { x: snappedX, y: snappedY, width: snappedW, height: snappedH, rotation: r.rotation };
    } else {
      return r;
    }
  }
}
