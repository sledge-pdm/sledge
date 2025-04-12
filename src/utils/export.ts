import { layerStore } from "~/stores/Store";

export function exportActiveLayerUpscaled(scale = 10) {
  const layerId = layerStore.activeLayerId;
  if (!layerId) return;

  const originalCanvas = document.getElementById(
    `canvas-${layerId}`,
  ) as HTMLCanvasElement;
  if (!originalCanvas) {
    alert("対象のレイヤーが見つかりません。");
    return;
  }

  const w = originalCanvas.width;
  const h = originalCanvas.height;

  // オフスクリーンキャンバスを作る
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = w * scale;
  exportCanvas.height = h * scale;

  const ctx = exportCanvas.getContext("2d");
  if (!ctx) {
    alert("Canvasコンテキスト取得に失敗しました。");
    return;
  }

  // ピクセル補間を無効化
  ctx.imageSmoothingEnabled = false;

  // 元のキャンバスをscale倍に引き伸ばして描画（補完なし）
  ctx.drawImage(originalCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

  // エクスポート処理
  exportCanvas.toBlob((blob) => {
    if (!blob) {
      alert("エクスポートに失敗しました。");
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layerId}_x${scale}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}
