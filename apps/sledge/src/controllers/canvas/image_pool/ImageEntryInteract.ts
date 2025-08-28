import { updateEntryPartial } from '~/controllers/canvas/image_pool/ImagePoolController';
import { ImagePoolEntry } from '~/models/canvas/image_pool/ImagePool';
import { interactStore } from '~/stores/EditorStores';

type ResizePos = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/**
 * ImageEntryInteract
 *
 * 各 ImagePool エントリのポインター操作を担当（現状はログ出力のみ）。
 * コンストラクタに SVG ルート（ハンドル含む）と、最新の Entry を返す getter を渡す。
 */
class ImageEntryInteract {
  private pointerActive = false;
  private mode: 'drag' | 'resize' | undefined;
  private startClientX = 0;
  private startClientY = 0;
  private startX = 0;
  private startY = 0;
  private startScaleX = 1;
  private startScaleY = 1;
  private resizePos: ResizePos | undefined;

  constructor(
    private svgRoot: SVGSVGElement,
    private getEntry: () => ImagePoolEntry | undefined
  ) {}

  private handlePointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    const handle = target.closest?.('.resize-handle') as HTMLElement | null;
    const entry = this.getEntry();
    if (!entry) return;

    this.pointerActive = true;
    this.startClientX = e.clientX;
    this.startClientY = e.clientY;
    this.startX = entry.transform?.x ?? entry.x;
    this.startY = entry.transform?.y ?? entry.y;
    this.startScaleX = entry.transform?.scaleX ?? entry.scale;
    this.startScaleY = entry.transform?.scaleY ?? entry.scale;

    if (handle) {
      this.mode = 'resize';
      this.resizePos = handle.getAttribute('data-pos') as ResizePos | undefined;
    } else {
      this.mode = 'drag';
      this.resizePos = undefined;
    }

    this.svgRoot.setPointerCapture(e.pointerId);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.pointerActive || !this.mode) return;
    const zoom = interactStore.zoom || 1;
    const dx = (e.clientX - this.startClientX) / zoom;
    const dy = (e.clientY - this.startClientY) / zoom;
    const entry = this.getEntry();
    if (!entry) return;

    if (this.mode === 'drag') {
      const nx = this.startX + dx;
      const ny = this.startY + dy;
      console.debug('[ImagePool] drag delta', { id: entry.id, dx, dy, nx, ny, zoom });
      // 実表示反映（旧プロパティ + transform）
      updateEntryPartial(entry.id, {
        x: nx,
        y: ny,
        transform: {
          x: nx,
          y: ny,
          scaleX: entry.transform?.scaleX ?? entry.scale,
          scaleY: entry.transform?.scaleY ?? entry.scale,
        },
      });
    } else if (this.mode === 'resize') {
      const baseW = entry.base?.width ?? entry.width;
      const baseH = entry.base?.height ?? entry.height;
      let nextScaleX = this.startScaleX;
      let nextScaleY = this.startScaleY;
      switch (this.resizePos) {
        case 'e':
          nextScaleX = Math.max(0.01, (baseW * this.startScaleX + dx) / baseW);
          break;
        case 'w':
          nextScaleX = Math.max(0.01, (baseW * this.startScaleX - dx) / baseW);
          break;
        case 's':
          nextScaleY = Math.max(0.01, (baseH * this.startScaleY + dy) / baseH);
          break;
        case 'n':
          nextScaleY = Math.max(0.01, (baseH * this.startScaleY - dy) / baseH);
          break;
        case 'se':
          nextScaleX = Math.max(0.01, (baseW * this.startScaleX + dx) / baseW);
          nextScaleY = Math.max(0.01, (baseH * this.startScaleY + dy) / baseH);
          break;
        case 'ne':
          nextScaleX = Math.max(0.01, (baseW * this.startScaleX + dx) / baseW);
          nextScaleY = Math.max(0.01, (baseH * this.startScaleY - dy) / baseH);
          break;
        case 'sw':
          nextScaleX = Math.max(0.01, (baseW * this.startScaleX - dx) / baseW);
          nextScaleY = Math.max(0.01, (baseH * this.startScaleY + dy) / baseH);
          break;
        case 'nw':
          nextScaleX = Math.max(0.01, (baseW * this.startScaleX - dx) / baseW);
          nextScaleY = Math.max(0.01, (baseH * this.startScaleY - dy) / baseH);
          break;
      }

      // ピボット座標（開始時のボックスから算出）
      const startW = baseW * this.startScaleX;
      const startH = baseH * this.startScaleY;
      const pivot = (() => {
        switch (this.resizePos) {
          case 'se':
          case 'e':
          case 's':
            return { x: this.startX, y: this.startY, type: 'tl' as const };
          case 'nw':
            return { x: this.startX + startW, y: this.startY + startH, type: 'br' as const };
          case 'ne':
          case 'n':
            return { x: this.startX, y: this.startY + startH, type: 'bl' as const };
          case 'sw':
          case 'w':
            return { x: this.startX + startW, y: this.startY, type: 'tr' as const };
          default:
            return { x: this.startX, y: this.startY, type: 'tl' as const };
        }
      })();

      // ピボット固定で新しい位置を求める
      let newX = this.startX;
      let newY = this.startY;
      switch (pivot.type) {
        case 'tl':
          newX = pivot.x;
          newY = pivot.y;
          break;
        case 'tr':
          newX = pivot.x - baseW * nextScaleX;
          newY = pivot.y;
          break;
        case 'bl':
          newX = pivot.x;
          newY = pivot.y - baseH * nextScaleY;
          break;
        case 'br':
          newX = pivot.x - baseW * nextScaleX;
          newY = pivot.y - baseH * nextScaleY;
          break;
      }

      console.debug('[ImagePool] resize delta', {
        id: entry.id,
        dx,
        dy,
        scaleX: nextScaleX,
        scaleY: nextScaleY,
        handle: this.resizePos,
        pivot,
        newX,
        newY,
        zoom,
      });

      updateEntryPartial(entry.id, {
        // 旧互換: scale は代表値（平均）を入れておく
        scale: (nextScaleX + nextScaleY) / 2,
        x: newX,
        y: newY,
        transform: {
          x: newX,
          y: newY,
          scaleX: nextScaleX,
          scaleY: nextScaleY,
        },
      });
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.pointerActive) return;
    this.pointerActive = false;
    this.mode = undefined;
    this.resizePos = undefined;
    try {
      this.svgRoot.releasePointerCapture(e.pointerId);
    } catch {}
    console.debug('[ImagePool] pointer end');
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
}

export default ImageEntryInteract;
