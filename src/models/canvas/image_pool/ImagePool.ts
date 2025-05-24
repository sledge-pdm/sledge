export type ImagePoolEntry = {
  id: string;
  originalPath: string; // ユーザーが選択した元のファイルパス
  resourcePath: string; // Tauri リソースフォルダ内のコピー先 URL
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
};
