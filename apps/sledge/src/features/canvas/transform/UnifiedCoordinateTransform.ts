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

  /**
   * DOMMatrixのtransformPointヘルパー
   */
  private applyMatrix(matrix: DOMMatrix, pos: { x: number; y: number }): { x: number; y: number } {
    const result = matrix.transformPoint(new DOMPoint(pos.x, pos.y));
    return { x: result.x, y: result.y };
  }

  /**
   * ページの絶対座標をcanvas-area相対座標に変換
   * タイトルバーや左側セクションのオフセットを考慮
   */
  private pageToCanvasAreaCoords(pagePos: { x: number; y: number }): { x: number; y: number } {
    const canvasAreaElement = document.getElementById('canvas-area');
    if (!canvasAreaElement) {
      console.warn('canvas-area element not found, using page coordinates directly');
      return pagePos;
    }

    const rect = canvasAreaElement.getBoundingClientRect();
    return {
      x: pagePos.x - rect.left,
      y: pagePos.y - rect.top,
    };
  }

  /**
   * canvas-area相対座標をページの絶対座標に変換
   */
  private canvasAreaToPageCoords(areaPos: { x: number; y: number }): { x: number; y: number } {
    const canvasAreaElement = document.getElementById('canvas-area');
    if (!canvasAreaElement) {
      console.warn('canvas-area element not found, using area coordinates directly');
      return areaPos;
    }

    const rect = canvasAreaElement.getBoundingClientRect();
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
    // ズーム除外版: 回転・反転・パンのみ適用
    const { offset, offsetOrigin, rotation, horizontalFlipped, verticalFlipped } = interactStore;
    const { width, height } = canvasStore.canvas;

    const Matrix = globalThis.DOMMatrix ?? (globalThis as any).WebKitCSSMatrix;
    if (!Matrix) {
      return WindowPos.from(pos);
    }

    const cx = width / 2;
    const cy = height / 2;
    const sx = horizontalFlipped ? -1 : 1;
    const sy = verticalFlipped ? -1 : 1;
    const totalOffsetX = offsetOrigin.x + offset.x;
    const totalOffsetY = offsetOrigin.y + offset.y;

    // 回転・反転のみの行列
    const rotationMatrix = new Matrix().translate(cx, cy).rotate(rotation).scale(sx, sy).translate(-cx, -cy);

    // 回転・反転を適用
    const rotated = this.applyMatrix(rotationMatrix, pos);

    // パンのみ適用（ズーム除外）
    const areaResult = {
      x: totalOffsetX + rotated.x,
      y: totalOffsetY + rotated.y,
    };

    // canvas-area相対座標からページ絶対座標に変換
    const pageCoords = this.canvasAreaToPageCoords(areaResult);
    return WindowPos.from(pageCoords);
  }

  windowToCanvasNoZoom(pos: WindowPos): CanvasPos {
    // canvasToWindowNoZoomの逆変換
    const { offset, offsetOrigin, rotation, horizontalFlipped, verticalFlipped } = interactStore;
    const { width, height } = canvasStore.canvas;

    const Matrix = globalThis.DOMMatrix ?? (globalThis as any).WebKitCSSMatrix;
    if (!Matrix) {
      return CanvasPos.from(pos);
    }

    // ページ絶対座標をcanvas-area相対座標に変換
    const areaCoords = this.pageToCanvasAreaCoords(pos);

    const totalOffsetX = offsetOrigin.x + offset.x;
    const totalOffsetY = offsetOrigin.y + offset.y;

    // パンを戻す
    const afterPan = {
      x: areaCoords.x - totalOffsetX,
      y: areaCoords.y - totalOffsetY,
    };

    // 回転・反転の逆行列
    const cx = width / 2;
    const cy = height / 2;
    const sx = horizontalFlipped ? -1 : 1;
    const sy = verticalFlipped ? -1 : 1;

    const inverseRotationMatrix = new Matrix()
      .translate(cx, cy)
      .scale(1 / sx, 1 / sy)
      .rotate(-rotation)
      .translate(-cx, -cy);

    const result = this.applyMatrix(inverseRotationMatrix, afterPan);
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
