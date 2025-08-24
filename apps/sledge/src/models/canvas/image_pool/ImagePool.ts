export type ImagePoolEntry = {
  id: string;
  originalPath: string; // ユーザーが選択した元のファイルパス
  resourcePath: string; // Tauri リソースフォルダ内のコピー先 URL
  fileName: string; // 表示用のファイル名（ベース名）
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
};
