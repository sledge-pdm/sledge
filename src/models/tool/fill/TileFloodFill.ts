import { Fill, FillProps } from './FillTool';
import { PixelDiff } from '~/models/layer_image/HistoryManager';
import TileLayerImageAgent from '~/models/layer_image/agents/TileLayerImageAgent';
import { TileIndex } from '~/types/Tile';
import { Vec2 } from '~/types/Vector';
import { colorMatch } from '~/utils/colorUtils';

interface FillPassProps {
  index: TileIndex;
}

export class TileFloodFill implements Fill {
  fill({ agent, color, position }: FillProps) {
    if (!(agent instanceof TileLayerImageAgent)) throw 'Agent is not a TileLayerImageAgent';
    const tileAgent = agent as TileLayerImageAgent;

    const targetColor = tileAgent.getPixel(position);
    if (colorMatch(targetColor, color)) return false;

    const tileRowCount = tileAgent.getTileRowCount();
    const tileColumnCount = tileAgent.getTileColumnCount();
    const flatten = (ti: TileIndex) => ti.row * tileColumnCount + ti.column;
    const tileUniformMatches = (ti: TileIndex) => {
      const tile = tileAgent.getTile(ti);
      return tile.isUniform && tile.uniformColor && colorMatch(tile.uniformColor, targetColor);
    };

    const visitedTiles = new Uint8Array(tileRowCount * tileColumnCount);
    const tilesFilled: TileIndex[] = [];
    const tileQueue: TileIndex[] = [tileAgent.getTileIndex(position)];

    const pxDiffs: PixelDiff[] = [];
    const visitedPx = new Uint8Array(agent.getWidth() * agent.getHeight());

    // First tile flood pass
    let tileFillCount = 0;
    while (tileQueue.length > 0) {
      const ti = tileQueue.pop()!;
      if (!tileAgent.isTileInBounds(ti)) continue;
      const i = flatten(ti);
      if (visitedTiles[i]) continue;
      visitedTiles[i] = 1;
      if (!tileUniformMatches(ti)) continue;

      tilesFilled.push(ti);
      tileFillCount++;
      tileQueue.push({ row: ti.row - 1, column: ti.column });
      tileQueue.push({ row: ti.row + 1, column: ti.column });
      tileQueue.push({ row: ti.row, column: ti.column - 1 });
      tileQueue.push({ row: ti.row, column: ti.column + 1 });
    }
    for (const ti of tilesFilled) {
      const offset = tileAgent.getTile(ti).getOffset();
      for (let dy = 0; dy < tileAgent.TILE_SIZE; dy++) {
        for (let dx = 0; dx < tileAgent.TILE_SIZE; dx++) {
          const x = offset.x + dx;
          const y = offset.y + dy;
          const i = y * agent.getWidth() + x;
          visitedPx[i] = 1;
        }
      }
    }
    console.log(`initial tile fill finished: ${tileFillCount} tiles`);

    const edgePixels = tilesFilled.length > 0 ? this.collectEdgePixels(tileAgent, tilesFilled) : [position];

    const pixelQueue: Vec2[] = edgePixels;
    const pixelsFilled: Vec2[] = [];
    const pxIndex = (p: Vec2) => p.y * agent.getWidth() + p.x;

    let pixelFillCount = 0;
    while (pixelQueue.length > 0) {
      const p = pixelQueue.pop()!;
      if (!agent.isInBounds(p)) continue;
      const idx = pxIndex(p);
      if (visitedPx[idx]) continue;
      visitedPx[idx] = 1;

      const tileIndex = tileAgent.getTileIndex(p);
      const tileIdxFlat = flatten(tileIndex);
      const tilesFilledInReEntry: TileIndex[] = [];
      if (!visitedTiles[tileIdxFlat] && tileUniformMatches(tileIndex)) {
        const reentryQueue: TileIndex[] = [tileIndex];
        let reentryCount = 0;
        while (reentryQueue.length > 0) {
          const ti = reentryQueue.pop()!;
          if (!tileAgent.isTileInBounds(ti)) continue;
          const i = flatten(ti);
          if (visitedTiles[i]) continue;
          visitedTiles[i] = 1;
          if (!tileUniformMatches(ti)) continue;
          tilesFilled.push(ti);
          tilesFilledInReEntry.push(ti);
          reentryCount++;
          reentryQueue.push({ row: ti.row - 1, column: ti.column });
          reentryQueue.push({ row: ti.row + 1, column: ti.column });
          reentryQueue.push({ row: ti.row, column: ti.column - 1 });
          reentryQueue.push({ row: ti.row, column: ti.column + 1 });
        }
        // ↓ 前はこれがなかった ↓
        const newEdges = this.collectEdgePixels(tileAgent, tilesFilledInReEntry);
        for (const edge of newEdges) {
          pixelQueue.push(edge);
        }
        for (const ti of tilesFilled) {
          const offset = tileAgent.getTile(ti).getOffset();
          for (let dy = 0; dy < tileAgent.TILE_SIZE; dy++) {
            for (let dx = 0; dx < tileAgent.TILE_SIZE; dx++) {
              const x = offset.x + dx;
              const y = offset.y + dy;
              const i = y * agent.getWidth() + x;
              visitedPx[i] = 1;
            }
          }
        }
        console.log(`tile reentry fill: ${reentryCount} tiles`);
        continue;
      }

      if (!colorMatch(tileAgent.getPixel(p), targetColor)) continue;
      pixelsFilled.push(p);
      pixelFillCount++;
      pixelQueue.push({ x: p.x + 1, y: p.y });
      pixelQueue.push({ x: p.x - 1, y: p.y });
      pixelQueue.push({ x: p.x, y: p.y + 1 });
      pixelQueue.push({ x: p.x, y: p.y - 1 });
    }
    console.log(`pixel fill finished: ${pixelFillCount} pixels`);

    for (const ti of tilesFilled) tileAgent.fillWholeTile(ti, color, true);
    for (const p of pixelsFilled) {
      const diff = tileAgent.setPixel(p, color, false, false);
      if (diff) pxDiffs.push(diff);
    }

    if (pxDiffs.length > 0) tileAgent.addDiffs(pxDiffs);
  }

  collectEdgePixels(agent: TileLayerImageAgent, filled: TileIndex[]): Vec2[] {
    const edge: Vec2[] = [];
    const TILE_SIZE = agent.TILE_SIZE;
    const filledSet = new Set(filled.map((t) => `${t.row},${t.column}`));

    for (const ti of filled) {
      const offset = agent.getTile(ti).getOffset();
      const neighbors = [
        { dr: -1, dc: 0, dx: 0, dy: -1, axis: 'x' },
        { dr: 1, dc: 0, dx: 0, dy: TILE_SIZE, axis: 'x' },
        { dr: 0, dc: -1, dx: -1, dy: 0, axis: 'y' },
        { dr: 0, dc: 1, dx: TILE_SIZE, dy: 0, axis: 'y' },
      ];

      for (const { dr, dc, dx, dy, axis } of neighbors) {
        const ni = `${ti.row + dr},${ti.column + dc}`;
        if (filledSet.has(ni)) continue;
        for (let i = 0; i < TILE_SIZE; i++) {
          const x = axis === 'x' ? offset.x + i : offset.x + dx;
          const y = axis === 'y' ? offset.y + i : offset.y + dy;
          edge.push({ x, y });
        }
      }
    }
    return edge;
  }
}
