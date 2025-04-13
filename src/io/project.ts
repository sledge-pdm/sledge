// src/io/project.ts
import { save } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import { canvasStore } from "~/stores/canvasStore";
import { imageStore } from "~/stores/imageStore";
import { layerStore } from "~/stores/layerStore";
import { encodeImageData } from "~/utils/ImageUtils";

export const parseCurrentProject = (): string => {
  return JSON.stringify({
    canvas: canvasStore.canvas,
    images: Object.fromEntries(
      Object.entries(imageStore).map(([id, state]) => [
        id,
        { current: encodeImageData(state.current) },
      ]),
    ),
    layer: {
      layers: layerStore.layers.map((layer) => ({
        ...layer,
        dsl: layer.dsl.build(),
      })),
      activeLayerId: layerStore.activeLayerId,
    },
  });
};

export async function importProjectJson(json: string) {
  const data = JSON.parse(json);
  // TODO: データを canvasStore / imageStore / layerStore に復元する処理
  // decodeImageData(data.images[id].current, width, height) を使う
}

export async function exportProjectJson() {
  const data = parseCurrentProject();

  // 1. %User%/Documents/sledge を作成
  try {
    await mkdir("sledge", { baseDir: BaseDirectory.Document, recursive: true });
  } catch (e) {
    console.warn("ディレクトリ作成スキップまたは失敗:", e);
  }

  // 2. 保存ダイアログを開く（.sledge拡張子）
  const selectedPath = await save({
    title: "Sledge プロジェクトを保存",
    defaultPath: "sledge/project.sledge",
    filters: [{ name: "Sledge Project", extensions: ["sledge"] }],
  });

  if (typeof selectedPath === "string") {
    // 3. 保存処理
    await writeTextFile(selectedPath, data);
    console.log("プロジェクト保存:", selectedPath);
  } else {
    console.log("保存キャンセルされました");
  }
}
