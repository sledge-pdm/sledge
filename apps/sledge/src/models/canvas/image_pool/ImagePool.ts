/**
 * ImagePoolEntry
 *
 * モデル刷新方針:
 * - base: 元画像の自然サイズ（不変）
 * - transform: 表示上の位置とスケール（X/Y独立）
 *
 * 既存コード互換のため、旧プロパティ（x, y, scale, width, height）は当面残します。
 * 今後は base/transform を正とし、旧プロパティは段階的に撤去します。
 */
export type ImagePoolEntry = {
  id: string;
  originalPath: string; // ユーザーが選択した元のファイルパス
  resourcePath: string; // Tauri リソースフォルダ内のコピー先 URL
  fileName: string; // 表示用のファイル名（ベース名）

  /**
   * 新: 元画像の自然サイズ（px）
   */
  base?: { width: number; height: number };

  /**
   * 新: 表示上の位置とスケール。transform-origin は (0,0) 前提。
   */
  transform?: { x: number; y: number; scaleX: number; scaleY: number };

  /**
   * 旧: 表示用の位置とスケール、サイズ（px）。段階的撤去予定。
   * width/height は base の値に相当し、scale は等倍拡縮を想定。
   */
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;

  opacity: number;
  visible: boolean;
};
