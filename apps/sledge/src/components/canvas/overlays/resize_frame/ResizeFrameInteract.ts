import { screenToCanvas } from '~/features/canvas/CanvasPositionCalculator';

/**
 * キャンバスリサイズ用フレーム矩形
 */
export interface ResizeFrameRect {
  x: number; // canvas space
  y: number; // canvas space
  width: number; // canvas space
  height: number; // canvas space
}

type ResizePos = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/**
 * ResizeFrameInteract
 *
 * CanvasResizeFrame の <svg> ルートにポインターリスナーを張り、枠のドラッグ/リサイズを行い
 * 変更は rAF でバッチして onChange コールバック経由で通知する。
 * screenToCanvas が使えるため zoom 等は考慮不要。
 */
export class ResizeFrameInteract {
  private pointerActive = false;
  private mode: 'drag' | 'resize' | undefined;
  private resizePos: ResizePos | undefined;

  private startRect: ResizeFrameRect | undefined;
  private startPointerCanvasX = 0;
  private startPointerCanvasY = 0;

  // rAF batching (同一フレーム内の余分な再計算を避ける)
  private rafId: number | null = null;
  private rafScheduled = false;
  private pending: ResizeFrameRect | undefined;

  // 最小サイズ（1px 未満はゼロ領域になり視認できないため）
  private readonly minSize = 1;

  constructor(
    private svgRoot: SVGSVGElement,
    /** 現在のフレーム矩形取得（編集中は最新を返す想定） */
    private getRect: () => ResizeFrameRect,
    /** 進行中の変更通知（プレビュー用） */
    private onChange: (rect: ResizeFrameRect) => void,
    /** 操作確定時（PointerUp） */
    private onCommit?: (start: ResizeFrameRect, end: ResizeFrameRect, e: PointerEvent) => void
  ) {}

  private enqueue(rect: ResizeFrameRect) {
    this.pending = rect;
    if (!this.rafScheduled) {
      this.rafScheduled = true;
      this.rafId = requestAnimationFrame(this.flush);
    }
  }

  private flush = () => {
    this.rafScheduled = false;
    const p = this.pending;
    this.pending = undefined;
    if (!p) return;
    this.onChange(p);
  };

  private handlePointerDown = (e: PointerEvent) => {
    // 左クリック(通常: button===0) 以外は無視
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const handle = target.closest?.('.resize-handle') as HTMLElement | null;
    const dragSurface = target.closest?.('.drag-surface');
    const rect = this.getRect();
    if (!rect) return;

    // 開始ポインタ位置（canvas 空間）
    const { x: cx, y: cy } = screenToCanvas({ x: e.clientX, y: e.clientY });
    this.startPointerCanvasX = cx;
    this.startPointerCanvasY = cy;
    // スナップ前提: 開始時点で整数に正規化して基準を安定化
    this.startRect = this.snapRect(rect);

    if (handle) {
      this.mode = 'resize';
      this.resizePos = handle.getAttribute('data-pos') as ResizePos | undefined;
    } else if (dragSurface) {
      this.mode = 'drag';
      this.resizePos = undefined;
    } else {
      return; // 外側クリックは無視
    }

    this.pointerActive = true;
    this.svgRoot.setPointerCapture(e.pointerId);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.pointerActive || !this.mode || !this.startRect) return;
    const { x: cx, y: cy } = screenToCanvas({ x: e.clientX, y: e.clientY });
    const dx = cx - this.startPointerCanvasX;
    const dy = cy - this.startPointerCanvasY;

    if (this.mode === 'drag') {
      const next: ResizeFrameRect = this.snapRect({
        x: this.startRect.x + dx,
        y: this.startRect.y + dy,
        width: this.startRect.width,
        height: this.startRect.height,
      });
      this.enqueue(next);
      return;
    }

    if (this.mode === 'resize') {
      let { x, y, width, height } = this.startRect;
      switch (this.resizePos) {
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

      // Shift でアスペクト固定（任意。キャンバスの縦横比維持したいケース用）
      if (e.shiftKey) {
        const aspect = this.startRect.width / this.startRect.height || 1;
        if (['n', 's'].includes(this.resizePos || '')) {
          width = Math.max(this.minSize, height * aspect);
        } else if (['e', 'w'].includes(this.resizePos || '')) {
          height = Math.max(this.minSize, width / aspect);
        } else {
          // 角: 大きい方に合わせる
          if (width / height > aspect) {
            height = Math.max(this.minSize, width / aspect);
          } else {
            width = Math.max(this.minSize, height * aspect);
          }
        }
        // 左/上調整中はピボット保持のため位置再計算
        if (this.resizePos?.includes('w')) {
          x = this.startRect.x + (this.startRect.width - width);
        }
        if (this.resizePos?.includes('n')) {
          y = this.startRect.y + (this.startRect.height - height);
        }
      }

      const next: ResizeFrameRect = this.snapRect({ x, y, width, height });
      this.enqueue(next);
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.pointerActive) return;
    this.pointerActive = false;
    try {
      this.svgRoot.releasePointerCapture(e.pointerId);
    } catch {}

    // バッチが残っていれば flush
    if (this.pending) this.flush();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.rafScheduled = false;
    }

    if (this.startRect) {
      const endRect = this.getRect();
      if (this.onCommit) this.onCommit(this.startRect, endRect, e);
    }
    this.mode = undefined;
    this.resizePos = undefined;
    this.startRect = undefined;
  };

  public setInteractListeners() {
    this.removeInteractListeners();
    this.svgRoot.addEventListener('pointerdown', this.handlePointerDown);
    this.svgRoot.addEventListener('pointermove', this.handlePointerMove);
    this.svgRoot.addEventListener('pointerup', this.handlePointerUp);
  }

  public removeInteractListeners() {
    this.svgRoot.removeEventListener('pointerdown', this.handlePointerDown);
    this.svgRoot.removeEventListener('pointermove', this.handlePointerMove);
    this.svgRoot.removeEventListener('pointerup', this.handlePointerUp);
  }

  /**
   * 矩形を整数キャンバスピクセルにスナップ。
   * 位置は四捨五入、サイズは最低 1。
   * （必要に応じて UX 調整: floor/ceil 方式に変えられるよう一括で実装）
   */
  private snapRect(r: ResizeFrameRect): ResizeFrameRect {
    const snappedX = Math.round(r.x);
    const snappedY = Math.round(r.y);
    const snappedW = Math.max(1, Math.round(r.width));
    const snappedH = Math.max(1, Math.round(r.height));
    return { x: snappedX, y: snappedY, width: snappedW, height: snappedH };
  }
}

export default ResizeFrameInteract;
