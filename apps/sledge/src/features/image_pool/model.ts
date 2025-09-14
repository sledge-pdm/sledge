export type ImagePoolEntry = {
  id: string;
  originalPath: string; // ユーザーが選択した元のファイルパス
  resourcePath: string; // Tauri リソースフォルダ内のコピー先 URL
  fileName: string; // 表示用のファイル名（ベース名）

  /**
   * 元画像の自然サイズ（px）
   */
  base: { width: number; height: number };

  /**
   * 表示上の位置とスケール。transform-origin は (0,0) 前提。
   */
  transform: { x: number; y: number; scaleX: number; scaleY: number };

  /**
   * 透過度 / 表示
   */
  opacity: number;
  visible: boolean;
};
