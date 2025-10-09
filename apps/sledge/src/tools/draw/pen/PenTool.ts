import { packedU32ToRgba, putShape, putShapeLine } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
import { PixelPatchData } from 'node_modules/@sledge/anvil/src/types/patch/pixel';
import { RGBAColor, transparent } from '~/features/color';
import { activeLayer } from '~/features/layer';
import { getBufferPointer, getWidth } from '~/features/layer/anvil/AnvilController';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { getPresetOf } from '~/features/tool/ToolController';
import { ShapeStore } from '~/tools/draw/pen/ShapeStore';
import { StrokeChunk } from '~/tools/draw/pen/StrokeChunk';
import { AnvilToolContext, ToolArgs, ToolBehavior, ToolResult } from '~/tools/ToolBehavior';
import { TOOL_CATEGORIES, ToolCategoryId } from '~/tools/Tools';

export class PenTool implements ToolBehavior {
  allowRightClick = true;
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  startTime: number | undefined = undefined;
  isShift: boolean = false;
  isCtrl: boolean = false;
  private lastPreviewDiff: Array<PixelPatchData> = [];

  startPosition: Vec2 | undefined = undefined;
  // startPointerPosition は使用されていないため削除

  shapeStore = new ShapeStore();
  strokeChunk = new StrokeChunk();

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
    this.startPosition = args.rawPosition;

    this.lastPreviewDiff = [];
    this.strokeChunk.clear();

    if (!this.isShift) {
      return this.draw(ctx, args, args.color);
    } else {
      return this.drawLine(false, ctx, args, args.color);
    }
  }

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
    if (diffs) this.strokeChunk.add(anvil.getWidth(), diffs);

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
      if (diffs) this.strokeChunk.add(anvil.getWidth(), diffs);
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
        target[idx] = diff.color[0];
        target[idx + 1] = diff.color[1];
        target[idx + 2] = diff.color[2];
        target[idx + 3] = diff.color[3];
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
    const targetPosition = this.isCtrl && this.startPosition ? this.snapToAngle(rawPosition, this.startPosition) : rawPosition;

    const preset = getPresetOf(this.categoryId, presetName) as any;
    const size = preset?.size ?? 1;
    const shape = (preset?.shape ?? 'square') as 'square' | 'circle'; // デフォルトは正方形

    const layer = activeLayer();
    const anvil = layer ? getAnvilOf(layer.id) : undefined;
    if (!anvil) return { shouldUpdate: false, shouldRegisterToHistory: false };

    const fromCp = this.centerPosition(this.startPosition, size);
    const cp = this.centerPosition(targetPosition, size);
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
        this.strokeChunk.add(anvil.getWidth(), diffs);
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
      const bbox = this.strokeChunk.boundBox;
      if (bbox) {
        const w = bbox.maxX - bbox.minX + 1;
        const h = bbox.maxY - bbox.minY + 1;
        if (w <= 0 || h <= 0) {
          console.warn('Invalid bbox dimensions:', { w, h, bbox });
          anvil.endBatch();
          this.strokeChunk.clear();
          return { result: resultText, shouldUpdate: true, shouldRegisterToHistory: true };
        }
        const swapBuffer = new Uint8ClampedArray(w * h * 4);
        // Layer全体バッファ取得
        const layerBuffer = getBufferPointer(layerId);
        const layerWidth = getWidth(layerId);
        if (layerBuffer && layerWidth) {
          // 現バッファから変更前の状態を取得・保存
          for (let yy = 0; yy < h; yy++) {
            const srcRowStart = (bbox.minX + (bbox.minY + yy) * layerWidth) * 4;
            const dstRowStart = yy * w * 4;
            swapBuffer.set(layerBuffer.subarray(srcRowStart, srcRowStart + w * 4), dstRowStart);
          }
          // ストロークによる変更を適用して「変更前の状態」を作成
          for (const [layerIdx, diff] of this.strokeChunk.diffs) {
            // layerIdx からピクセル座標を逆算
            const pixelIdx = layerIdx / 4;
            const x = pixelIdx % layerWidth;
            const y = Math.floor(pixelIdx / layerWidth);

            // bbox内でのローカル座標に変換
            const localX = x - bbox.minX;
            const localY = y - bbox.minY;
            const localIdx = (localX + localY * w) * 4;

            // packed RGBA32 を RGBA 成分に展開して swapBuffer に書き込み
            const [r, g, b, a] = packedU32ToRgba(diff.color);

            swapBuffer[localIdx] = r;
            swapBuffer[localIdx + 1] = g;
            swapBuffer[localIdx + 2] = b;
            swapBuffer[localIdx + 3] = a;
          }
          anvil.addPartialDiff({ x: bbox.minX, y: bbox.minY, width: w, height: h }, swapBuffer);
        }
      }
    }
    this.strokeChunk.clear();

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
    this.startTime = undefined;

    this.lastPreviewDiff = [];

    this.strokeChunk.clear();

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
