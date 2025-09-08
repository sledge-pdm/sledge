import { beforeEach, describe, expect, it, vi } from 'vitest';
import TileManager from '~/controllers/layer/image/managers/TileManager';
import type { RGBAColor } from '~/features/color';

function makeBuffer(w: number, h: number, color: RGBAColor = [0, 0, 0, 0]) {
  const buf = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    buf[p] = color[0];
    buf[p + 1] = color[1];
    buf[p + 2] = color[2];
    buf[p + 3] = color[3];
  }
  return buf;
}

describe('TileManager', () => {
  const W = 40,
    H = 36; // タイルサイズは32なので2x2タイル領域
  let buffer: Uint8ClampedArray;
  const getPixel = (pos: { x: number; y: number }): RGBAColor => {
    const i = (pos.y * W + pos.x) * 4;
    return [buffer[i], buffer[i + 1], buffer[i + 2], buffer[i + 3]];
  };
  const setData = (i: number, v: number) => {
    buffer[i] = v;
  };
  const addTileDiff = vi.fn();

  beforeEach(() => {
    buffer = makeBuffer(W, H, [1, 2, 3, 4]);
    addTileDiff.mockClear();
  });

  it('initializes tiles and computes indices correctly', () => {
    const tm = new TileManager(W, H, getPixel, setData, addTileDiff);
    expect(tm.getTileRowCount()).toBe(Math.ceil(H / 32));
    expect(tm.getTileColumnCount()).toBe(Math.ceil(W / 32));
    expect(tm.getTileIndex({ x: 0, y: 0 })).toEqual({ row: 0, column: 0 });
    expect(tm.getTileIndex({ x: 33, y: 0 })).toEqual({ row: 0, column: 1 });
    expect(tm.getTileIndex({ x: 0, y: 33 })).toEqual({ row: 1, column: 0 });
  });

  it('fillWholeTile writes within bounds and marks tile uniform/dirty', () => {
    const tm = new TileManager(W, H, getPixel, setData, addTileDiff);
    const idx = { row: 0, column: 0 };
    const color: RGBAColor = [9, 8, 7, 6];
    tm.fillWholeTile(idx, color, true);

    // 左上32x32だけが塗られている
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const p = (y * W + x) * 4;
        expect([buffer[p], buffer[p + 1], buffer[p + 2], buffer[p + 3]]).toEqual(color);
      }
    }
    // 境界外（同じ行、32以降）は元の色のまま
    const p = (0 * W + 33) * 4;
    expect([buffer[p], buffer[p + 1], buffer[p + 2], buffer[p + 3]]).toEqual([1, 2, 3, 4]);

    const tile = tm.getTile(idx);
    expect(tile.isDirty).toBe(true);
    expect(tile.isUniform).toBe(true);
    expect(tile.uniformColor).toEqual(color);
    expect(addTileDiff).toHaveBeenCalledTimes(1);
  });

  it('skip fill if tile already uniform with same color', () => {
    const tm = new TileManager(W, H, getPixel, setData, addTileDiff);
    const idx = { row: 0, column: 0 };
    const color: RGBAColor = [1, 2, 3, 4];
    // 初期スキャンで uniformColor = [1,2,3,4] のはず
    tm.fillWholeTile(idx, color, true);
    // 変化なし
    expect(addTileDiff).not.toHaveBeenCalled();
  });
});
