import { Anvil, PixelPatchData, ShapeMask, packedU32ToRgba, putShape, putShapeLine } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
import { Consts } from '~/Consts';
import { RGBAColor, transparent } from '~/features/color';
import { activeLayer, findLayerById } from '~/features/layer';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { LineChunk } from '~/features/tools/behaviors/draw/pen/LineChunk';
import { ShapeStore } from '~/features/tools/behaviors/draw/pen/ShapeStore';
import { StrokeChunk } from '~/features/tools/behaviors/draw/pen/StrokeChunk';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { getPresetOf, updateToolPresetConfig } from '~/features/tools/ToolController';
import { DEFAULT_PRESET, PenPresetConfig, TOOL_CATEGORIES, ToolCategoryId } from '~/features/tools/Tools';

type StrokeContext = {
  layerId: string;
  anvil: Anvil;
  dotMagnification: number;
  size: number;
  shape: 'square' | 'circle';
  shapeMask: ShapeMask;
};

export class PenTool implements ToolBehavior {
  allowRightClick = true;
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  isShift: boolean = false;
  isCtrl: boolean = false;

  startPosition: Vec2 | undefined = undefined;
  startScaledPosition: Vec2 | undefined = undefined;

  shapeStore = new ShapeStore();

  lineChunk = new LineChunk();
  strokeChunk = new StrokeChunk();
  private strokeContext: StrokeContext | undefined = undefined;
  private pixelAccumulator: Map<string, PixelPatchData> | undefined = undefined;

  private resolveStrokeContext(layerId: string, presetName: string, preset?: PenPresetConfig): StrokeContext | undefined {
    const anvil = getAnvil(layerId);

    const layer = findLayerById(layerId) ?? activeLayer();
    const dotMagnification = layer?.dotMagnification ?? 1;
    const resolvedPreset = preset ?? (getPresetOf(this.categoryId, presetName) as PenPresetConfig | undefined);
    const size = resolvedPreset?.size ?? 1;
    const shape = (resolvedPreset?.shape ?? 'square') as 'square' | 'circle';
    const shapeMask = this.shapeStore.get(shape, size);
    if (!shapeMask) return undefined;

    this.strokeContext = { layerId, anvil, dotMagnification, size, shape, shapeMask };
    return this.strokeContext;
  }

  private getStrokeContext(layerId: string, presetName: string, preset?: PenPresetConfig): StrokeContext | undefined {
    if (this.strokeContext && this.strokeContext.layerId === layerId) {
      return this.strokeContext;
    }
    return this.resolveStrokeContext(layerId, presetName, preset);
  }

  private ensurePixelAccumulator(): Map<string, PixelPatchData> {
    if (!this.pixelAccumulator) {
      this.pixelAccumulator = new Map();
    }
    return this.pixelAccumulator;
  }

  centerPosition(scaledPos: Vec2 | undefined, rawPos: Vec2 | undefined, size: number, dotMagnification: number): Vec2 {
    const scale = dotMagnification || 1;
    if (size % 2 === 0 && rawPos) {
      return {
        x: Math.round(rawPos.x / scale),
        y: Math.round(rawPos.y / scale),
      };
    }
    if (scaledPos) {
      return scaledPos;
    }
    if (rawPos) {
      return {
        x: Math.floor(rawPos.x / scale),
        y: Math.floor(rawPos.y / scale),
      };
    }
    return { x: 0, y: 0 };
  }

  onStart(args: ToolArgs) {
    const presetName = args.presetName ?? DEFAULT_PRESET;
    // register to history if it's new size
    const preset = getPresetOf(TOOL_CATEGORIES.PEN, presetName) as PenPresetConfig;
    const history: number[] = preset.sizeHistory ?? [];
    if (preset.size && !history.includes(preset.size)) {
      const newHistory = [preset.size, ...history].slice(0, Consts.maxSizeHistoryLength);
      updateToolPresetConfig(TOOL_CATEGORIES.PEN, presetName, 'sizeHistory', newHistory);
    }

    // 前回の状態が残っている場合はクリーンアップ
    if (this.lineChunk.hasPreview()) {
      console.warn('PenTool: Cleaning up previous preview state');
      this.undoLastLineDiff();
    }

    this.isCtrl = args.event?.ctrlKey ?? false;
    this.startPosition = args.rawPosition;
    this.startScaledPosition = args.position;

    this.strokeChunk.clear();
    this.lineChunk.clear();
    this.pixelAccumulator = new Map();

    if (!this.resolveStrokeContext(args.layerId, presetName, preset)) {
      return { shouldUpdate: false, shouldRegisterToHistory: false };
    }

    if (args.event?.shiftKey) {
      this.isShift = true;
      return this.drawLine(false, args, args.color);
    } else {
      this.isShift = false;
      return this.draw(args, args.color);
    }
  }

  onMove(args: ToolArgs) {
    if (!this.isShift) {
      return this.draw(args, args.color);
    } else {
      return this.drawLine(false, args, args.color);
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

  draw({ layerId, position, lastPosition, presetName, event, rawPosition, rawLastPosition }: ToolArgs, color: RGBAColor): ToolResult {
    const resolvedPresetName = presetName ?? DEFAULT_PRESET;
    if (event?.buttons === 2) {
      color = transparent;
    }

    const context = this.getStrokeContext(layerId, resolvedPresetName);
    if (!context) return { shouldUpdate: false, shouldRegisterToHistory: false };
    const pixelAcc = this.ensurePixelAccumulator();

    const cp = this.centerPosition(position, rawPosition, context.size, context.dotMagnification);

    const diffs = putShape({
      anvil: context.anvil,
      posX: cp.x,
      posY: cp.y,
      shape: context.shapeMask,
      color,
      manualDiff: true,
      pixelAcc,
    });
    if (diffs) this.strokeChunk.add(context.anvil.getWidth(), diffs);

    if (rawLastPosition !== undefined) {
      const fromCp = this.centerPosition(lastPosition, rawLastPosition, context.size, context.dotMagnification);
      const lineDiffs = putShapeLine({
        anvil: context.anvil,
        posX: cp.x,
        posY: cp.y,
        fromPosX: fromCp.x,
        fromPosY: fromCp.y,
        shape: context.shapeMask,
        color,
        manualDiff: true,
        pixelAcc,
      });
      if (lineDiffs) this.strokeChunk.add(context.anvil.getWidth(), lineDiffs);
    }

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  private undoLastLineDiff() {
    const fallbackLayer = activeLayer();
    const targetLayerId = this.strokeContext?.layerId ?? fallbackLayer?.id;
    if (!targetLayerId) return;

    const anvil = getAnvil(targetLayerId);
    this.lineChunk.restore(anvil);
  }

  // 始点からの直線を描画
  drawLine(commit: boolean, { layerId, position, presetName, event, rawPosition }: ToolArgs, color: RGBAColor): ToolResult {
    const resolvedPresetName = presetName ?? DEFAULT_PRESET;
    if (!this.startPosition) return { shouldUpdate: false, shouldRegisterToHistory: false };

    if (event?.buttons === 2) {
      color = transparent;
    }

    this.undoLastLineDiff();

    // ctrl+shiftの場合は角度で調整
    const targetPosition = this.isCtrl ? this.snapToAngle(rawPosition, this.startPosition) : rawPosition;

    const context = this.getStrokeContext(layerId, resolvedPresetName);
    if (!context) return { shouldUpdate: false, shouldRegisterToHistory: false };

    const dotMagnification = context.dotMagnification;
    const size = context.size;
    const scaledStart = this.startScaledPosition ?? {
      x: Math.floor(this.startPosition.x / dotMagnification),
      y: Math.floor(this.startPosition.y / dotMagnification),
    };
    const fromCp = this.centerPosition(scaledStart, this.startPosition, size, dotMagnification);
    const scaledTarget =
      targetPosition !== undefined
        ? {
            x: Math.floor(targetPosition.x / dotMagnification),
            y: Math.floor(targetPosition.y / dotMagnification),
          }
        : position;
    const cp = this.centerPosition(scaledTarget, targetPosition, size, dotMagnification);
    const diffs = putShapeLine({
      anvil: context.anvil,
      posX: cp.x,
      posY: cp.y,
      fromPosX: fromCp.x,
      fromPosY: fromCp.y,
      shape: context.shapeMask,
      color,
      manualDiff: true,
      pixelAcc: commit ? this.ensurePixelAccumulator() : undefined,
    });
    if (diffs) {
      if (commit) {
        this.strokeChunk.add(context.anvil.getWidth(), diffs);
      } else {
        this.lineChunk.capture(diffs);
      }
    }

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(args: ToolArgs) {
    let { event, color, layerId } = args;
    if (event?.buttons === 2) {
      color = transparent;
    }
    if (this.isShift) {
      // 直線を確定
      this.drawLine(true, args, color);
    }

    this.isShift = false;
    this.isCtrl = false;
    this.startPosition = undefined;
    this.startScaledPosition = undefined;
    this.lineChunk.clear();
    this.strokeContext = undefined;
    this.pixelAccumulator = undefined;

    const anvil = getAnvil(layerId);
    const bbox = this.strokeChunk.boundBox;
    if (bbox) {
      const w = bbox.maxX - bbox.minX + 1;
      const h = bbox.maxY - bbox.minY + 1;
      if (w <= 0 || h <= 0) {
        console.warn('Invalid bbox dimensions:', { w, h, bbox });
        this.strokeChunk.clear();
        return { shouldUpdate: true, shouldRegisterToHistory: true };
      }
      const swapBuffer = new Uint8ClampedArray(w * h * 4);
      // Layer全体バッファ取得
      const layerBuffer = anvil.getBufferPointer();
      const layerWidth = anvil.getWidth();
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
    this.strokeChunk.clear();

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: true,
    };
  }

  onCancel(args: ToolArgs) {
    if (this.isShift) {
      this.undoLastLineDiff();
    }

    this.isShift = false;
    this.isCtrl = false;
    this.startPosition = undefined;
    this.startScaledPosition = undefined;

    this.lineChunk.clear();
    this.strokeChunk.clear();
    this.strokeContext = undefined;
    this.pixelAccumulator = undefined;

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
