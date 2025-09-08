import { Vec2 } from '@sledge/core';
import { RGBAColor } from '~/features/color';

export interface TileIndex {
  row: number;
  column: number;
}

export default class Tile {
  // 前回の描画更新から変更があったか（canvas更新用）
  public isDirty: boolean;

  // このタイルが単色（すべて同一RGBA）なら true
  public isUniform = false;
  // 単色時のカラーキャッシュ
  public uniformColor: RGBAColor | undefined = undefined;

  constructor(
    public readonly row: number,
    public readonly column: number,
    public readonly size: number
  ) {
    this.isDirty = false;
  }

  public getIndex(): TileIndex {
    return { row: this.row, column: this.column };
  }

  toString(): string {
    return `Tile[${this.row},${this.column}]`;
  }

  public getOffset(): Vec2 {
    return {
      x: this.column * this.size,
      y: this.row * this.size,
    };
  }

  public isInBounds(positionInTile: Vec2) {
    return positionInTile.x >= 0 && positionInTile.x < this.size && positionInTile.y >= 0 && positionInTile.y < this.size;
  }
}
