export type KeyConfigEntry = {
  key?: string; // 例: "z", "x", "ArrowUp"
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // MacのCommandキーなど
};
