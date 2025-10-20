import { Vec2 } from '@sledge/core';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { CanvasPos, CoordinateTransform, WindowPos } from '~/types/CoordinateTypes';

/**
 * 統一座標変換システム
 * 目的: 全ての座標変換を単一のDOMMatrixで処理し、複雑性を削減
 */
export class UnifiedCoordinateTransform implements CoordinateTransform {
  private cachedMatrix: DOMMatrix | null = null;
  private cachedInverse: DOMMatrix | null = null;
  private lastComputedHash = '';

  // getBoundingClientRectの統合キャッシュ
  private canvasAreaRectCache: DOMRect | null = null;
  private canvasAreaRectCacheTime = 0;
  private readonly RECT_CACHE_DURATION = 100; // 100ms

  /**
   * 現在の状態から変換行列を計算
   * パン・ズーム・回転・反転を全て含む
   */
  private computeTransformMatrix(): DOMMatrix {
    const { zoom, offset, offsetOrigin, rotation, horizontalFlipped, verticalFlipped } = interactStore;
    const { width, height } = canvasStore.canvas;

    // 現在の状態をハッシュ化してキャッシュ有効性を判定
    const currentHash = `${zoom}_${offset.x}_${offset.y}_${offsetOrigin.x}_${offsetOrigin.y}_${rotation}_${horizontalFlipped}_${verticalFlipped}_${width}_${height}`;

    if (this.cachedMatrix && this.lastComputedHash === currentHash) {
      return this.cachedMatrix;
    }

    // DOMMatrix fallback check
    const Matrix = globalThis.DOMMatrix ?? (globalThis as any).WebKitCSSMatrix;
    if (!Matrix) {
      console.warn('DOMMatrix not available, using identity matrix');
      return new DOMMatrix();
    }

    // 変換行列を構築: Canvas → Window
    // 1. キャンバス中心を原点に移動
    // 2. 回転・反転を適用
    // 3. キャンバス中心を元に戻す
    // 4. パン・ズームを適用

    const cx = width / 2;
    const cy = height / 2;
    const sx = horizontalFlipped ? -1 : 1;
    const sy = verticalFlipped ? -1 : 1;
    const totalOffsetX = offsetOrigin.x + offset.x;
    const totalOffsetY = offsetOrigin.y + offset.y;

    const matrix = new Matrix()
      // 最終的なパン・ズーム変換
      .translate(totalOffsetX, totalOffsetY)
      .scale(zoom)
      // キャンバス中心を原点に変換
      .translate(cx, cy)
      // 回転・反転を適用
      .rotate(rotation)
      .scale(sx, sy)
      // キャンバス中心を元に戻す
      .translate(-cx, -cy);

    this.cachedMatrix = matrix;
    this.cachedInverse = null; // 逆行列をリセット
    this.lastComputedHash = currentHash;

    return matrix;
  }

  /**
   * 逆変換行列を取得
   */
  private computeInverseMatrix(): DOMMatrix {
    if (this.cachedInverse) {
      return this.cachedInverse;
    }

    this.cachedInverse = this.computeTransformMatrix().inverse();
    return this.cachedInverse;
  }

  // NoZoom変換用のキャッシュ
  private cachedNoZoomMatrix: DOMMatrix | null = null;
  private cachedNoZoomInverse: DOMMatrix | null = null;
  private lastNoZoomHash = '';

  /**
   * NoZoom変換行列を計算（回転・反転・パンのみ）
   */
  private computeNoZoomMatrix(): DOMMatrix {
    const { offset, offsetOrigin, rotation, horizontalFlipped, verticalFlipped } = interactStore;
    const { width, height } = canvasStore.canvas;

    const currentHash = `nozoom_${offset.x}_${offset.y}_${offsetOrigin.x}_${offsetOrigin.y}_${rotation}_${horizontalFlipped}_${verticalFlipped}_${width}_${height}`;

    if (this.cachedNoZoomMatrix && this.lastNoZoomHash === currentHash) {
      return this.cachedNoZoomMatrix;
    }

    const Matrix = globalThis.DOMMatrix ?? (globalThis as any).WebKitCSSMatrix;
    if (!Matrix) {
      return new DOMMatrix();
    }

    const cx = width / 2;
    const cy = height / 2;
    const sx = horizontalFlipped ? -1 : 1;
    const sy = verticalFlipped ? -1 : 1;
    const totalOffsetX = offsetOrigin.x + offset.x;
    const totalOffsetY = offsetOrigin.y + offset.y;

    const matrix = new Matrix().translate(totalOffsetX, totalOffsetY).translate(cx, cy).rotate(rotation).scale(sx, sy).translate(-cx, -cy);

    this.cachedNoZoomMatrix = matrix;
    this.cachedNoZoomInverse = null;
    this.lastNoZoomHash = currentHash;

    return matrix;
  }

  private computeNoZoomInverseMatrix(): DOMMatrix {
    if (this.cachedNoZoomInverse) {
      return this.cachedNoZoomInverse;
    }

    this.cachedNoZoomInverse = this.computeNoZoomMatrix().inverse();
    return this.cachedNoZoomInverse;
  }
  private applyMatrix(matrix: DOMMatrix, pos: { x: number; y: number }): { x: number; y: number } {
    const result = matrix.transformPoint(new DOMPoint(pos.x, pos.y));
    return { x: result.x, y: result.y };
  }

  /**
   * キャッシュされたcanvas-area要素のBoundingClientRectを取得
   * 統合キャッシュにより重複呼び出しを防止
   */
  private getCachedCanvasAreaRect(): DOMRect | null {
    const now = Date.now();
    if (!this.canvasAreaRectCache || now - this.canvasAreaRectCacheTime > this.RECT_CACHE_DURATION) {
      const canvasAreaElement = document.getElementById('canvas-area');
      if (canvasAreaElement) {
        this.canvasAreaRectCache = canvasAreaElement.getBoundingClientRect();
        this.canvasAreaRectCacheTime = now;
      } else {
        this.canvasAreaRectCache = null;
      }
    }
    return this.canvasAreaRectCache;
  }

  /**
   * ページの絶対座標をcanvas-area相対座標に変換
   * タイトルバーや左側セクションのオフセットを考慮
   */
  private pageToCanvasAreaCoords(pagePos: { x: number; y: number }): { x: number; y: number } {
    const rect = this.getCachedCanvasAreaRect();
    if (!rect) {
      console.warn('canvas-area element not found, using page coordinates directly');
      return pagePos;
    }

    return {
      x: pagePos.x - rect.left,
      y: pagePos.y - rect.top,
    };
  }

  /**
   * canvas-area相対座標をページの絶対座標に変換
   */
  private canvasAreaToPageCoords(areaPos: { x: number; y: number }): { x: number; y: number } {
    const rect = this.getCachedCanvasAreaRect();
    if (!rect) {
      console.warn('canvas-area element not found, using area coordinates directly');
      return areaPos;
    }

    return {
      x: areaPos.x + rect.left,
      y: areaPos.y + rect.top,
    };
  }

  // CoordinateTransformインターフェースの実装

  /**
   * キャンバス座標 → ウィンドウ座標（描画用・canvas-area相対）
   * ペンやインタラクション処理で使用
   */
  canvasToWindow(pos: CanvasPos): WindowPos {
    const result = this.applyMatrix(this.computeTransformMatrix(), pos);
    // canvas-area相対座標からページ絶対座標に変換
    const pageCoords = this.canvasAreaToPageCoords(result);
    return WindowPos.from(pageCoords);
  }

  /**
   * ウィンドウ座標 → キャンバス座標（描画用・canvas-area相対）
   * ペンやインタラクション処理で使用
   */
  windowToCanvas(pos: WindowPos): CanvasPos {
    // ページ絶対座標をcanvas-area相対座標に変換
    const areaCoords = this.pageToCanvasAreaCoords(pos);
    const result = this.applyMatrix(this.computeInverseMatrix(), areaCoords);
    return CanvasPos.from(result);
  }

  /**
   * ページ座標からcanvas-area相対座標を取得（デバッグ用）
   * getBoundingClientRectのキャッシュを活用
   */
  getCanvasAreaCoords(pagePos: { x: number; y: number }): { x: number; y: number } {
    return this.pageToCanvasAreaCoords(pagePos);
  }

  /**
   * 要素のgetBoundingClientRectをキャッシュ付きで取得
   * 統合キャッシュシステムを活用して性能向上
   */
  getBoundingClientRect(element: Element): DOMRect {
    // 既存のcanvas-areaキャッシュを活用
    if (element.id === 'canvas-area') {
      const rect = this.getCachedCanvasAreaRect();
      if (rect) {
        return new DOMRect(rect.left, rect.top, rect.width, rect.height);
      }
    }
    
    // 他の要素は直接取得（将来的にキャッシュ拡張可能）
    return element.getBoundingClientRect();
  }

  /**
   * キャンバス座標 → ウィンドウ座標（オーバーレイ用・ページ絶対座標）
   * 選択範囲メニューやその他のオーバーレイで使用
   */
  canvasToWindowForOverlay(pos: CanvasPos): WindowPos {
    const result = this.applyMatrix(this.computeTransformMatrix(), pos);
    // オーバーレイはページ絶対座標のままで配置される
    return WindowPos.from(result);
  }

  /**
   * ウィンドウ座標 → キャンバス座標（オーバーレイ用・ページ絶対座標）
   * 選択範囲メニューやその他のオーバーレイで使用
   */
  windowToCanvasForOverlay(pos: WindowPos): CanvasPos {
    const result = this.applyMatrix(this.computeInverseMatrix(), pos);
    return CanvasPos.from(result);
  }

  canvasToWindowNoZoom(pos: CanvasPos): WindowPos {
    const result = this.applyMatrix(this.computeNoZoomMatrix(), pos);
    const pageCoords = this.canvasAreaToPageCoords(result);
    return WindowPos.from(pageCoords);
  }

  windowToCanvasNoZoom(pos: WindowPos): CanvasPos {
    const areaCoords = this.pageToCanvasAreaCoords(pos);
    const result = this.applyMatrix(this.computeNoZoomInverseMatrix(), areaCoords);
    return CanvasPos.from(result);
  }

  getTransformMatrix(): DOMMatrix {
    return this.computeTransformMatrix();
  }

  getInverseMatrix(): DOMMatrix {
    return this.computeInverseMatrix();
  }

  /**
   * キャッシュをクリア（状態が大幅に変更された場合に使用）
   */
  public clearCache(): void {
    this.cachedMatrix = null;
    this.cachedInverse = null;
    this.lastComputedHash = '';
    this.canvasAreaRectCache = null; // getBoundingClientRectキャッシュもクリア
    this.cachedNoZoomMatrix = null; // NoZoomキャッシュもクリア
    this.cachedNoZoomInverse = null;
    this.lastNoZoomHash = '';
  }

  /**
   * Vec2との互換性のための便利関数
   */
  public canvasToWindowVec2(pos: Vec2): Vec2 {
    return WindowPos.toVec2(this.canvasToWindow(CanvasPos.from(pos)));
  }

  public windowToCanvasVec2(pos: Vec2): Vec2 {
    return CanvasPos.toVec2(this.windowToCanvas(WindowPos.from(pos)));
  }
}

// シングルトンインスタンス
export const coordinateTransform = new UnifiedCoordinateTransform();
