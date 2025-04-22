import { PixelDiff } from '~/models/layer_image/HistoryManager'
import { Vec2 } from '~/models/types/Vector'
import { colorMatch, RGBAColor } from '~/utils/colorUtils'
import { Fill, FillProps } from './FillTool'
import TileLayerImageAgent from '~/models/layer_image/agents/TileLayerImageAgent'
import Tile, { TileIndex } from '~/models/layer_image/Tile'

interface FillPassProps {
  index: TileIndex
}

interface PixelFillResult {
  filledPositions: Vec2[]
  next: FillPassProps[]
}

export class TileFloodFill implements Fill {
  fill({ agent, color, position }: FillProps) {
    if (!(agent instanceof TileLayerImageAgent)) {
      throw 'Agent for this layer is not a TileLayerImageAgent!'
      return
    }
    const tileAgent = agent as TileLayerImageAgent

    const targetColor = tileAgent.getPixel(position)
    const tileUniformMatches = (p: TileIndex): boolean => {
      const tile = tileAgent.getTile(p)
      if (tile.isUniform && tile.uniformColor !== undefined) {
        return colorMatch(tile.uniformColor, targetColor)
      }
      return false
    }

    console.log(color)
    console.log(targetColor)

    if (colorMatch(targetColor, color)) return false
    console.log('fill started.')

    const tileScanStart = Date.now()

    const pxDiffs: PixelDiff[] = []

    const tileRowCount = tileAgent.getTileRowCount()
    const tileColumnCount = tileAgent.getTileColumnCount()

    const initialTileIndex = tileAgent.getTileIndex(position)
    const tileQueue: TileIndex[] = [initialTileIndex]
    const tilesFilled: TileIndex[] = []
    const tilesVisited = new Uint8Array(tileRowCount * tileColumnCount)
    const flatten = (ti: TileIndex) => ti.row * tileColumnCount + ti.column

    // Tile-Level Fill
    let tileQueueCount = 0
    let tileVisitCount = 0
    while (tileQueue.length > 0) {
      tileQueueCount++
      const ti = tileQueue.pop()!

      if (!agent.isTileInBounds(ti)) continue

      const i = flatten(ti)
      if (tilesVisited[i]) continue
      tilesVisited[i] = 1
      tileVisitCount++

      if (tileUniformMatches(ti)) {
        tilesFilled.push(ti)

        const topTi = { row: ti.row - 1, column: ti.column }
        const bottomTi = { row: ti.row + 1, column: ti.column }
        const leftTi = { row: ti.row, column: ti.column - 1 }
        const rightTi = { row: ti.row, column: ti.column + 1 }

        tileQueue.push(topTi)
        tileQueue.push(bottomTi)
        tileQueue.push(leftTi)
        tileQueue.push(rightTi)
      }
    }

    const tileScanEnd = Date.now()
    console.log(
      'tile scan finished. ' +
        (tileScanEnd - tileScanStart) +
        'ms. visited ' +
        tileVisitCount +
        'tiles'
    )

    // ここまでで、edgePixelsには「タイルでは塗れなかったが、塗れそうな限界の境界(Tile-Levelによる塗りつぶしの"ちょうど"外側)の座標が入っている
    // それらをもとに、Pixel-Level Fillを行う
    // また、タイルが1回も塗られなかった場合は初期位置からPixel-Level Fillを始める
    const edgePixels =
      tilesFilled.length > 0 ?
        this.collectEdgePixels(tileAgent, tilesFilled)
      : [position]

    // Pixel-Level Fill
    const matches = (p: Vec2) => colorMatch(tileAgent.getPixel(p), targetColor)
    const scanStart = Date.now()
    const queue: Vec2[] = edgePixels
    const pxFilled: Vec2[] = []
    const visited = new Uint8Array(agent.getWidth() * agent.getHeight()) // 0:未訪問, 1:訪問済
    const index = (p: Vec2) => p.y * agent.getWidth() + p.x
    let queueCount = 0
    let visitCount = 0
    while (queue.length > 0) {
      queueCount++
      const c = queue.pop()!
      if (!agent.isInBounds(c)) continue

      const i = index(c)
      if (visited[i]) continue
      visited[i] = 1
      visitCount++

      if (matches(c)) {
        pxFilled.push(c)
        queue.push({ x: c.x + 1, y: c.y })
        queue.push({ x: c.x - 1, y: c.y })
        queue.push({ x: c.x, y: c.y + 1 })
        queue.push({ x: c.x, y: c.y - 1 })
      }
    }

    const scanEnd = Date.now()
    console.log('pixel scan finished. ' + (scanEnd - scanStart) + 'ms.')

    const writeStart = Date.now()
    // Tile-Level Fillの結果を書き込み
    for (const ti of tilesFilled) {
      tileAgent.fillWholeTile(ti, color, true)
    }
    // Pixel-Level Fillの結果を書き込み
    for (const p of pxFilled) {
      const diff = agent.setPixel(p, color, false, false)
      if (diff !== undefined) pxDiffs.push(diff)
    }

    const writeEnd = Date.now()
    console.log('write finished. ' + (writeEnd - writeStart) + 'ms.')

    if (pxDiffs.length > 0) agent.addDiffs(pxDiffs)
  }

  collectEdgePixels(agent: TileLayerImageAgent, filled: TileIndex[]): Vec2[] {
    const TILE_SIZE = agent.TILE_SIZE
    const edge: Vec2[] = []
    const filledSet = new Set<string>(filled.map((t) => `${t.row},${t.column}`))

    for (const ti of filled) {
      const { row, column } = ti
      const offset = agent.getTile(ti).getOffset()

      // 各方向に隣接する未塗タイルがある場合、その境界ピクセルをedgeとして追加
      const directions = [
        { dr: -1, dc: 0, dx: 0, dy: -1, range: TILE_SIZE, axis: 'x' }, // top
        { dr: 1, dc: 0, dx: 0, dy: TILE_SIZE, range: TILE_SIZE, axis: 'x' }, // bottom
        { dr: 0, dc: -1, dx: -1, dy: 0, range: TILE_SIZE, axis: 'y' }, // left
        { dr: 0, dc: 1, dx: TILE_SIZE, dy: 0, range: TILE_SIZE, axis: 'y' }, // right
      ]

      for (const { dr, dc, dx, dy, range, axis } of directions) {
        const ni = `${row + dr},${column + dc}`
        if (filledSet.has(ni)) continue

        for (let i = 0; i < range; i++) {
          const x = axis === 'x' ? offset.x + i : offset.x + dx
          const y = axis === 'y' ? offset.y + i : offset.y + dy
          edge.push({ x, y })
        }
      }
    }

    return edge
  }
}
