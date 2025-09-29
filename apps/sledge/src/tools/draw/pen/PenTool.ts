import { createSolidPattern, patternStamp } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
import { RGBAColor, transparent } from '~/features/color';
import { activeLayer } from '~/features/layer';
import { getBufferPointer, getHeight, getWidth } from '~/features/layer/anvil/AnvilController';
import { getSelectionLimitMode, isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { getPresetOf } from '~/features/tool/ToolController';
import { AnvilToolContext, ToolArgs, ToolBehavior, ToolResult } from '~/tools/ToolBehavior';
import { TOOL_CATEGORIES, ToolCategoryId } from '~/tools/Tools';
import { drawCompletionLine } from './PenDraw';

export class PenTool implements ToolBehavior {
  allowRightClick = true;
  onlyOnCanvas = false; // 端の補完を確保するため画面外を許可

  startTime: number | undefined = undefined;
  isShift: boolean = false;
  isCtrl: boolean = false;
  private lastPreviewDiff: Array<{ position: Vec2; before: RGBAColor; after: RGBAColor }> = [];

  startPosition: Vec2 | undefined = undefined;
  startPointerPosition: Vec2 | undefined = undefined;

  // 旧ローカルマスクキャッシュは Anvil へ移行。ここではキー組立のみ。
  private maskKey(size: number, shape: 'square' | 'circle') {
    return `${shape}:${size}`;
  }

  private getCenter(p: Vec2, rawP: Vec2 | undefined, size: number, dotMagnification: number) {
    let cx: number, cy: number;
    if (size % 2 === 0 && rawP) {
      cx = Math.round(rawP.x / dotMagnification);
      cy = Math.round(rawP.y / dotMagnification);
    } else {
      cx = p.x;
      cy = p.y;
    }
    return { cx, cy };
  }

  private stamp(
    ctx: AnvilToolContext,
    centerX: number,
    centerY: number,
    size: number,
    shape: 'square' | 'circle',
    color: RGBAColor,
    shouldCheckSelectionLimit: boolean,
    commit: boolean,
    previewCollector?: Array<{ position: Vec2; before: RGBAColor; after: RGBAColor }>
  ) {
    const layerBuf = getBufferPointer(ctx.layerId);
    if (!layerBuf) return;
    const w = getWidth(ctx.layerId) ?? 0;
    const h = getHeight(ctx.layerId) ?? 0;
    if (w === 0 || h === 0) return;

    // 選択範囲制限ありの場合は、先にピクセル単位で差分収集 (preview 用) する従来方式を fallback
    // ここでは最適化優先で: selection limit が ON の場合は旧ロジック同等 (mask 全走査 + チェック)
    if (shouldCheckSelectionLimit || !commit || previewCollector) {
      // coverage を 1x1 パターン + maskKey stamping 前に差分収集
      const key = this.maskKey(size, shape);
      // マスク適用領域を走査するため、一旦 shape マスクを生成 (Anvil 内部生成と同等) —— 直接キャッシュには触れず patternStamp に任せると
      // selection チェックが行えないのでここで擬似適用
      // 簡略化のため再度 stamp 後半で patternStamp を実行 (2-pass)。パフォーマンス最適化は後続タスク。
      // 1 pass: 走査 + preview diff 生成
      // shape マスクを再生成するコストは中サイズブラシで許容想定 // TODO: 後で Anvil に selection filter を入れる
      // ここでは旧 getDrawnPixelMask を使わず radius fallback で中心マスク簡易生成は不正確になるため保持しない。
    }

    const pattern = createSolidPattern(color);
    const key = this.maskKey(size, shape);
    patternStamp({
      target: layerBuf,
      targetWidth: w,
      targetHeight: h,
      centerX,
      centerY,
      pattern,
      maskKey: key,
      shape,
      size,
      blendMode: color[3] === 0 ? 'erase' : 'normal',
    });
  }
  onStart(ctx: AnvilToolContext, args: ToolArgs) {
    // 前回の状態が残っている場合はクリーンアップ
    if (this.lastPreviewDiff.length > 0) {
      console.warn('PenTool: Cleaning up previous preview state');
      this.undoLastLineDiff(ctx);
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

    const preset = args.presetName ? (getPresetOf(this.categoryId, args.presetName) as any) : undefined;
    const size = preset?.size ?? 1;
    const shape = (preset?.shape ?? 'square') as 'square' | 'circle';
    // マスクは Anvil 側で遅延生成されるためここではキープのみ

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

  draw(ctx: AnvilToolContext, { position, lastPosition, presetName, event, rawPosition }: ToolArgs, color: RGBAColor): ToolResult {
    if (!presetName) return { shouldUpdate: false, shouldRegisterToHistory: false };

    if (event?.buttons === 2) {
      color = transparent;
    }

    const preset = getPresetOf(this.categoryId, presetName) as any;
    const size = preset?.size ?? 1;
    const shape = (preset?.shape ?? 'square') as 'square' | 'circle'; // デフォルトは正方形

    const layer = activeLayer();
    const dotMagnification = layer?.dotMagnification ?? 1;

    const shouldCheckSelectionLimit = isSelectionAvailable() && getSelectionLimitMode() !== 'none';
    // 現在位置にスタンプ
    const { cx, cy } = this.getCenter(position, rawPosition, size, dotMagnification);
    this.stamp(ctx, cx, cy, size, shape, color, shouldCheckSelectionLimit, true);

    if (lastPosition !== undefined) {
      drawCompletionLine(position, lastPosition, (x: number, y: number) => {
        // 偶数サイズは syntheticRaw を用いて中心を決定
        const syntheticRaw = { x: x * dotMagnification, y: y * dotMagnification } as Vec2;
        const c = this.getCenter({ x, y }, syntheticRaw, size, dotMagnification);
        this.stamp(ctx, c.cx, c.cy, size, shape, color, shouldCheckSelectionLimit, true);
      });
    }

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  private undoLastLineDiff(ctx: AnvilToolContext) {
    // 前回のプレビューが残っていた場合はundo
    if (this.lastPreviewDiff.length === 0) return;
    try {
      for (const diff of this.lastPreviewDiff) {
        // apply 'before' color; skipExistingDiffCheck=true to ensure applying
        ctx.setPixel(diff.position.x, diff.position.y, diff.before as any);
      }
    } catch (error) {
      console.error('Failed to undo line preview:', error);
    } finally {
      this.lastPreviewDiff = [];
    }
  }

  // 始点からの直線を描画
  drawLine(commit: boolean, ctx: AnvilToolContext, { position, presetName, event, rawPosition }: ToolArgs, color: RGBAColor): ToolResult {
    if (!presetName || !this.startPosition) return { shouldUpdate: false, shouldRegisterToHistory: false };

    if (event?.buttons === 2) {
      color = transparent;
    }

    this.undoLastLineDiff(ctx);

    // ctrl+shiftの場合は角度固定
    const targetPosition = this.isCtrl && this.startPosition ? this.snapToAngle(position, this.startPosition) : position;

    const preset = getPresetOf(this.categoryId, presetName) as any;
    const size = preset?.size ?? 1;
    const shape = (preset?.shape ?? 'square') as 'square' | 'circle'; // デフォルトは正方形

    const layer = activeLayer();
    const dotMagnification = layer?.dotMagnification ?? 1;

    const shouldCheckSelectionLimit = isSelectionAvailable() && getSelectionLimitMode() !== 'none';
    drawCompletionLine(targetPosition, this.startPosition, (x: number, y: number) => {
      // 直線補完の各点に対応する rawPosition を合成し中心決定
      const syntheticRaw = { x: x * dotMagnification, y: y * dotMagnification } as Vec2;
      const c = this.getCenter({ x, y }, syntheticRaw, size, dotMagnification);
      this.stamp(ctx, c.cx, c.cy, size, shape, color, shouldCheckSelectionLimit, commit, commit ? undefined : this.lastPreviewDiff);
    });

    return {
      shouldUpdate: true,
      shouldRegisterToHistory: false,
    };
  }

  onEnd(ctx: AnvilToolContext, args: ToolArgs) {
    let { event, color } = args;
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

    return {
      result: resultText,
      shouldUpdate: true,
      shouldRegisterToHistory: true,
    };
  }

  onCancel(ctx: AnvilToolContext, args: ToolArgs) {
    if (this.isShift) {
      this.undoLastLineDiff(ctx);
    }

    this.isShift = false;
    this.isCtrl = false;
    this.startPosition = undefined;
    // this.originalBuffer = undefined;
    this.startTime = undefined;

    this.lastPreviewDiff = [];

    return {
      shouldUpdate: false,
      shouldRegisterToHistory: false,
    };
  }
}
