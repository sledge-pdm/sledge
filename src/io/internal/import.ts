import { layerImageStore } from '~/stores/project/layerImageStore'
import { layerStore } from '~/stores/project/layerStore'

// 画像ファイルをキャンバスに焼き込む（補完なし・左上合わせ・切り捨て）
export function importImageToActiveLayer(file: File) {
  const layerId = layerStore.activeLayerId
  if (!layerId) return

  const imageData = layerImageStore[layerId]?.current
  if (!imageData) {
    alert('現在のレイヤーに描画できません。')
    return
  }

  const img = new Image()
  const reader = new FileReader()

  reader.onload = (e) => {
    img.onload = () => {
      const w = imageData.width
      const h = imageData.height

      // オフスクリーンCanvasで描画 → ImageData取得
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h) // 左上にそのまま描く（拡大/縮小なし）

      const importedData = ctx.getImageData(0, 0, w, h)
      // registerNewHistory(layerId, importedData);
    }
    img.src = e.target?.result as string
  }

  reader.readAsDataURL(file)
}
