import { putShape, putShapeLine } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
import { RGBAColor, transparent } from '~/features/color';
import { activeLayer } from '~/features/layer';
import { getBufferPointer, getWidth } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { getPresetOf } from '~/features/tool/ToolController';
import { ShapeStore } from '~/tools/draw/pen/ShapeStore';
import { AnvilToolContext, ToolArgs, ToolBehavior, ToolResult } from '~/tools/ToolBehavior';
import { TOOL_CATEGORIES, ToolCategoryId } from '~/tools/Tools';

export class PenTool implements ToolBehavior {
  allowRightClick = true;
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  startTime: number | undefined = undefined;
  isShift: boolean = false;
  isCtrl: boolean = false;
  private lastPreviewDiff: Array<{ x: number; y: number; before: RGBAColor; after: RGBAColor }> = [];

  startPosition: Vec2 | undefined = undefined;
  startPointerPosition: Vec2 | undefined = undefined;

  shapeStore = new ShapeStore();

  // key=x,y
  diffsWhileStroke: Map<string, { x: number; y: number; before: RGBAColor; after: RGBAColor }> = new Map();

  strokeBoundBox: { minX: number; minY: number; maxX: number; maxY: number } | undefined = undefined;
  diffMode: 'pixels' | 'partial' = 'pixels';

  addStrokeDiffs(diffs: { x: number; y: number; before: RGBAColor; after: RGBAColor }[]) {
    diffs?.forEach((d) => {
      const k = `${d.x},${d.y}`;
      // すでにある場合はそのbeforeを持ってくる
      const pastDiff = this.diffsWhileStroke.get(k);
      if (pastDiff) d.before = pastDiff.before;

      this.diffsWhileStroke.set(k, d);

      // bounding box 更新
      if (!this.strokeBoundBox) {
        this.strokeBoundBox = { minX: d.x, minY: d.y, maxX: d.x, maxY: d.y };
      } else {
        if (d.x < this.strokeBoundBox.minX) this.strokeBoundBox.minX = d.x;
        if (d.y < this.strokeBoundBox.minY) this.strokeBoundBox.minY = d.y;
        if (d.x > this.strokeBoundBox.maxX) this.strokeBoundBox.maxX = d.x;
        if (d.y > this.strokeBoundBox.maxY) this.strokeBoundBox.maxY = d.y;
      }
    });

    // diffMode 切替判定（閾値 10000 ピクセル）: 既に partial の場合は何もしない
    if (this.diffMode === 'pixels') {
      const count = this.diffsWhileStroke.size;
      if (count >= 10000) {
        this.diffMode = 'partial';
      }
    }
  }

  centerPosition(rawPos: Vec2, size: number): Vec2 {
    const even = size % 2 === 0;
    const cx = even ? Math.round(rawPos.x) : Math.floor(rawPos.x);
    const cy = even ? Math.round(rawPos.y) : Math.floor(rawPos.y);
    return { x: cx, y: cy };
  }

  onStart(ctx: AnvilToolContext, args: ToolArgs) {
    // 前回の状態が残っている場合はクリーンアップ
    if (this.lastPreviewDiff.length > 0) {
      console.warn('PenTool: Cleaning up previous preview state');
      this.undoLastLineDiff(args.layerId);
    }

    this.startTime = Date.now();
    this.isShift = args.event?.shiftKey ?? false;
    this.isCtrl = args.event?.ctrlKey ?? false;
    this.startPosition = args.position;
    if (args.event)
      this.startPointerPosition = {
        x: args.event.clientX,
        y: args.event.clientY,
      };

    this.lastPreviewDiff = [];
    this.diffsWhileStroke = new Map();
    this.strokeBoundBox = undefined;
    this.diffMode = 'pixels';

    // バッチモード開始 (stroke 全体をまとめる). レイヤが変わる可能性はほぼ無い前提で開始。
    const layer = activeLayer();
    const anvil = layer ? getAnvilOf(layer.id) : undefined;
    anvil?.beginBatch();

    if (!this.isShift) {
      return this.draw(ctx, args, args.color);
    } else {
      return this.drawLine(false, ctx, args, args.color);
    }
  }

  // onRawUpdate(ctx: AnvilToolContext, args: ToolArgs) {
  //   console.log(args);
  //   return this.draw(ctx, args, args.color);
  // }

  onMove(ctx: AnvilToolContext, args: ToolArgs) {
    if (!this.isShift) {
      return this.draw(ctx, args, args.color);
    } else {
      return this.drawLine(false, ctx, args, args.color);
    }
  }

  protected categoryId: ToolCategoryId = TOOL_CATEGORIES.PEN;

  private SNAP_ANGLE = Math.PI / 12;

  private snapToAngle(current: Vec2, start: Vec2): Vec2 {
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const angle = Math.atan2(dy, dx);

    // 45度単位でスナップ
    const snapAngle = Math.round(angle / this.SNAP_ANGLE) * this.SNAP_ANGLE;
    const distance = Math.hypot(dx, dy);

    // console.log(`current=(${current.x}, ${current.y}), start=(${start.x}, ${start.y})`);
    // console.log(`position snapped to (${start.x + Math.cos(snapAngle) * distance}, ${start.y + Math.sin(snapAngle) * distance})`);

    return {
      x: Math.round(start.x + Math.cos(snapAngle) * distance),
      y: Math.round(start.y + Math.sin(snapAngle) * distance),
    };
  }

  draw(ctx: AnvilToolContext, { position, lastPosition, presetName, event, rawPosition, rawLastPosition }: ToolArgs, color: RGBAColor): ToolResult {
    if (!presetName) return { shouldUpdate: false, shouldRegisterToHistory: false };

    if (event?.buttons === 2) {
      color = transparent;
    }

    const preset = getPresetOf(this.categoryId, presetName) as any;
    const size = preset?.size ?? 1;
    const shape = (preset?.shape ?? 'square') as 'square' | 'circle'; // デフォルトは正方形

    const layer = activeLayer();
    const anvil = layer ? getAnvilOf(layer.id) : undefined;
    if (!anvil) return { shouldUpdate: false, shouldRegisterToHistory: false };
    const cp = this.centerPosition(rawPosition, size);

    const diffs = putShape({ anvil, posX: cp.x, posY: cp.y, shape: this.shapeStore.get(shape, size)!, color, manualDiff: true });
    if (diffs) this.addStrokeDiffs(diffs);

    if (rawLastPosition !== undefined) {
      const fromCp = this.centerPosition(rawLastPosition, size);
      const diffs = putShapeLine({
        anvil,
        posX: cp.x,
        posY: cp.y,
        fromPosX: fromCp.x,
        fromPosY: fromCp.y,
        shape: this.shapeStore.get(shape, size)!,
        color,
        manualDiff: true,
      });
      if (diffs) this.addStrokeDiffs(diffs);
    }

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  private undoLastLineDiff(layerId: string) {
    // 前回のプレビューが残っていた場合はundo
    if (this.lastPreviewDiff.length === 0) return;
    try {
      const target = getBufferPointer(layerId);
      const tw = getWidth(layerId);
      if (!target || !tw) return;

      for (const diff of this.lastPreviewDiff) {
        // apply 'before' color; skipExistingDiffCheck=true to ensure applying
        // ctx.setPixel(diff.x, diff.y, diff.before);
        const idx = (diff.x + diff.y * tw) * 4;
        target[idx] = diff.before[0];
        target[idx + 1] = diff.before[1];
        target[idx + 2] = diff.before[2];
        target[idx + 3] = diff.before[3];
      }
    } catch (error) {
      console.error('Failed to undo line preview:', error);
    } finally {
      this.lastPreviewDiff = [];
    }
  }

  // 始点からの直線を描画
  drawLine(commit: boolean, ctx: AnvilToolContext, { layerId, position, presetName, event, rawPosition }: ToolArgs, color: RGBAColor): ToolResult {
    if (!presetName || !this.startPosition) return { shouldUpdate: false, shouldRegisterToHistory: false };

    if (event?.buttons === 2) {
      color = transparent;
    }

    this.undoLastLineDiff(layerId);

    // ctrl+shiftの場合は角度固定
    const targetPosition = this.isCtrl && this.startPosition ? this.snapToAngle(position, this.startPosition) : position;

    const preset = getPresetOf(this.categoryId, presetName) as any;
    const size = preset?.size ?? 1;
    const shape = (preset?.shape ?? 'square') as 'square' | 'circle'; // デフォルトは正方形

    const layer = activeLayer();
    const anvil = layer ? getAnvilOf(layer.id) : undefined;
    if (!anvil) return { shouldUpdate: false, shouldRegisterToHistory: false };

    const fromCp = this.centerPosition(this.startPosition, size);
    const cp = this.centerPosition(rawPosition, size);
    const diffs = putShapeLine({
      anvil,
      posX: cp.x,
      posY: cp.y,
      fromPosX: fromCp.x,
      fromPosY: fromCp.y,
      shape: this.shapeStore.get(shape, size)!,
      color,
      manualDiff: true,
    });
    if (diffs) {
      if (commit) {
        this.addStrokeDiffs(diffs);
      } else {
        this.lastPreviewDiff = diffs;
      }
    }

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(ctx: AnvilToolContext, args: ToolArgs) {
    let { event, color, layerId } = args;
    if (event?.buttons === 2) {
      color = transparent;
    }
    if (this.isShift) {
      // 直線を確定
      this.drawLine(true, ctx, args, color);
    }
    const resultText = `${this.categoryId} stroke done.`;

    this.isShift = false;
    this.isCtrl = false;
    this.startPosition = undefined;
    this.lastPreviewDiff = [];

    // diff をまとめて登録
    const anvil = getAnvilOf(layerId);
    if (anvil) {
      if (this.diffMode === 'pixels') {
        // small change = pixels diff
        anvil.addPixelDiffs(Array.from(this.diffsWhileStroke.values()));
        anvil.endBatch();
      } else {
        // big change = partial buffer diff
        if (this.strokeBoundBox) {
          const bbox = this.strokeBoundBox;
          const w = bbox.maxX - bbox.minX + 1;
          const h = bbox.maxY - bbox.minY + 1;
          const before = new Uint8ClampedArray(w * h * 4);
          const after = new Uint8ClampedArray(w * h * 4);
          // Layer全体バッファ取得
          const layerBuffer = getBufferPointer(layerId);
          const layerWidth = getWidth(layerId);
          if (layerBuffer && layerWidth) {
            // まず after を現バッファから丸ごとコピー
            for (let yy = 0; yy < h; yy++) {
              const srcRowStart = (bbox.minX + (bbox.minY + yy) * layerWidth) * 4;
              const dstRowStart = yy * w * 4;
              after.set(layerBuffer.subarray(srcRowStart, srcRowStart + w * 4), dstRowStart);
            }
            // 未変更領域は after と同一なので最初にコピーしてから変更ピクセルの before を上書き
            before.set(after);
            for (const diff of this.diffsWhileStroke.values()) {
              const lx = diff.x - bbox.minX;
              const ly = diff.y - bbox.minY;
              const di = (lx + ly * w) * 4;
              before[di] = diff.before[0];
              before[di + 1] = diff.before[1];
              before[di + 2] = diff.before[2];
              before[di + 3] = diff.before[3];
            }
            anvil.addPartialDiff({ x: bbox.minX, y: bbox.minY, width: w, height: h }, before, after);
            anvil.endBatch();
          } else {
            // フォールバック: pixel diff に戻す
            anvil.addPixelDiffs(Array.from(this.diffsWhileStroke.values()));
            anvil.endBatch();
          }
        } else {
          // bbox が無い場合フォールバック
          anvil.addPixelDiffs(Array.from(this.diffsWhileStroke.values()));
          anvil.endBatch();
        }
      }
    }
    this.strokeBoundBox = undefined;
    this.diffMode = 'pixels';
    this.diffsWhileStroke = new Map();

    return {
      result: resultText,
      shouldUpdate: true,
      shouldRegisterToHistory: true,
    };
  }

  onCancel(ctx: AnvilToolContext, args: ToolArgs) {
    if (this.isShift) {
      this.undoLastLineDiff(args.layerId);
    }

    this.isShift = false;
    this.isCtrl = false;
    this.startPosition = undefined;
    // this.originalBuffer = undefined;
    this.startTime = undefined;

    this.lastPreviewDiff = [];

    // diff 破棄 & バッチ終了(変更はプレビューのみなので endBatch 前に discard されているような構造)
    const anvil = getAnvilOf(args.layerId);
    anvil?.endBatch();
    this.strokeBoundBox = undefined;
    this.diffMode = 'pixels';
    this.diffsWhileStroke = new Map();

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
