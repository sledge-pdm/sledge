import { safeInvoke } from '~/utils/tauriUtils'
import { ToolArgs } from '../ToolBase'
import { colorMatch, getPixel, isInBounds } from './FillTool'
import { decodeImageData, encodeImageData, setPixel } from '~/utils/ImageUtils'

function legacyFloodFillJS({ image, position, lastPosition, color }: ToolArgs) {
  const targetColor = getPixel(image, position.x, position.y)
  const matches = (p: [number, number]) =>
    colorMatch(getPixel(image, p[0], p[1]), targetColor)

  const startTimeLegacy = Date.now()
  const queueLegacy: [number, number][] = [[position.x, position.y]]
  const filledLegacy: [number, number][] = []
  const visitedLegacy = new Set<string>()

  while (queueLegacy.length > 0) {
    const [cx, cy] = queueLegacy.pop()!
    const key = `${cx},${cy}`
    if (visitedLegacy.has(key) || !isInBounds(image, cx, cy)) continue
    visitedLegacy.add(key)
    if (matches([cx, cy])) {
      filledLegacy.push([cx, cy])
      queueLegacy.push([cx + 1, cy])
      queueLegacy.push([cx - 1, cy])
      queueLegacy.push([cx, cy + 1])
      queueLegacy.push([cx, cy - 1])
    }
  }
  const endTimeLegacy = Date.now()
  console.log('legacy: ' + (endTimeLegacy - startTimeLegacy))

  // バッファに一括反映
  for (const [px, py] of filledLegacy) {
    setPixel(image, px, py, color[0], color[1], color[2], color[3])
  }
}

function legacyBase64Rust({ image, position, lastPosition, color }: ToolArgs) {
  const targetColor = getPixel(image, position.x, position.y)
  const matches = (p: [number, number]) =>
    colorMatch(getPixel(image, p[0], p[1]), targetColor)
  ;(async () => {
    const startTime = Date.now()
    const result = await safeInvoke('flood_fill', {
      encoded: encodeImageData(image),
      width: image.width,
      height: image.height,
      x: position.x,
      y: position.y,
      newColor: color,
    })

    // 結果を ImageData に復元
    const resultImage = decodeImageData(
      result as string,
      image.width,
      image.height
    )
    // image = resultImage
    const endTime = Date.now()
    console.log('rust(old, base64): ' + (endTime - startTime))
  })()
}

function legacyByteBufRust({ image, position, lastPosition, color }: ToolArgs) {
  const targetColor = getPixel(image, position.x, position.y)
  const matches = (p: [number, number]) =>
    colorMatch(getPixel(image, p[0], p[1]), targetColor)
  ;(async () => {
    const startTime = Date.now()
    const result = await safeInvoke('flood_fill_raw', {
      image: Array.from(image.data),
      width: image.width,
      height: image.height,
      x: position.x,
      y: position.y,
      newColor: color,
    })

    // 結果（Uint8Array）を ImageData に復元
    const resultImage = new ImageData(
      new Uint8ClampedArray(result as number[]),
      image.width,
      image.height
    )
    // image = resultImage
    const endTime = Date.now()
    console.log('rust(raw, ByteBuf): ' + (endTime - startTime))
  })()
}
