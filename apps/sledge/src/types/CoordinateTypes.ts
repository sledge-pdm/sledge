/**
 * 座標システム型定義
 * 目的: WindowPosとCanvasPosを明確に分離し、型安全性を向上させる
 */

/**
 * ウィンドウ座標（画面上の物理ピクセル座標）
 * - ブラウザのclientX/clientYなどの値
 * - DOM要素のgetBoundingClientRect()で取得される座標
 * - オーバーレイUIの配置に使用
 */
export interface WindowPos {
  readonly x: number;
  readonly y: number;
  readonly __brand: 'WindowPos';
}

/**
 * キャンバス座標（論理ピクセル座標）
 * - キャンバス上の実際の描画座標
 * - 回転・拡大・反転等の変換前の座標
 * - 描画処理やピクセル操作に使用
 */
export interface CanvasPos {
  readonly x: number;
  readonly y: number;
  readonly __brand: 'CanvasPos';
}

/**
 * 座標型のヘルパー関数
 */
export const WindowPos = {
  create: (x: number, y: number): WindowPos => ({ x, y, __brand: 'WindowPos' }),
  from: (pos: { x: number; y: number }): WindowPos => ({ x: pos.x, y: pos.y, __brand: 'WindowPos' }),
  toVec2: (pos: WindowPos) => ({ x: pos.x, y: pos.y }),
};

export const CanvasPos = {
  create: (x: number, y: number): CanvasPos => ({ x, y, __brand: 'CanvasPos' }),
  from: (pos: { x: number; y: number }): CanvasPos => ({ x: pos.x, y: pos.y, __brand: 'CanvasPos' }),
  toVec2: (pos: CanvasPos) => ({ x: pos.x, y: pos.y }),
};

/**
 * 座標変換のインターフェース
 */
export interface CoordinateTransform {
  /** キャンバス座標 → ウィンドウ座標（描画用・canvas-area相対） */
  canvasToWindow(pos: CanvasPos): WindowPos;

  /** ウィンドウ座標 → キャンバス座標（描画用・canvas-area相対） */
  windowToCanvas(pos: WindowPos): CanvasPos;

  /** キャンバス座標 → ウィンドウ座標（オーバーレイ用・ページ絶対座標） */
  canvasToWindowForOverlay(pos: CanvasPos): WindowPos;

  /** ウィンドウ座標 → キャンバス座標（オーバーレイ用・ページ絶対座標） */
  windowToCanvasForOverlay(pos: WindowPos): CanvasPos;

  /** キャンバス座標 → ウィンドウ座標（ズーム除外） */
  canvasToWindowNoZoom(pos: CanvasPos): WindowPos;

  /** ウィンドウ座標 → キャンバス座標（ズーム除外） */
  windowToCanvasNoZoom(pos: WindowPos): CanvasPos;

  /** 現在の変換行列を取得 */
  getTransformMatrix(): DOMMatrix;

  /** 変換行列の逆行列を取得 */
  getInverseMatrix(): DOMMatrix;
}
