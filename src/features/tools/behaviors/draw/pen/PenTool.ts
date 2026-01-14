import { RGBA, transparent, Vec2 } from '@sledge-pdm/core';
import { CircleKernel, Grip, GripInstrument, GripKernel, GripPoint, MaskStrokeInstrument, SquareKernel } from '@sledge-pdm/frasco';
import { Consts } from '~/Consts';
import { LayerHistoryAction, projectHistoryController } from '~/features/history';
import { getLayer } from '~/features/layer/frasco/LayerManager';
import { ToolArgs, ToolBehavior, ToolResult } from '~/features/tools/behaviors/ToolBehavior';
import { getPresetOf, updateToolPresetConfig } from '~/features/tools/ToolController';
import { DEFAULT_PRESET, PenPresetConfig, TOOL_CATEGORIES, ToolCategoryId } from '~/features/tools/Tools';

export class PenTool implements ToolBehavior {
  allowRightClick = true;

  isShift: boolean = false;
  isCtrl: boolean = false;

  forceColor: RGBA | undefined = undefined;

  private grip = new Grip({ inputSpace: 'canvas' });
  private circleKernel = new CircleKernel();
  private squareKernel = new SquareKernel();

  private activeLayerId: string | undefined;
  private hasStroke = false;
  private startPosition: Vec2 | undefined = undefined;
  private startPositionRaw: Vec2 | undefined = undefined;

  onStart(args: ToolArgs): ToolResult {
    const presetName = args.presetName ?? DEFAULT_PRESET;
    // register to history if it's new size
    const preset = getPresetOf(this.categoryId, presetName) as PenPresetConfig | undefined;
    const history: number[] = preset?.sizeHistory ?? [];
    if (preset?.size && !history.includes(preset.size)) {
      const newHistory = [preset.size, ...history].slice(0, Consts.maxSizeHistoryLength);
      updateToolPresetConfig(this.categoryId, presetName, 'sizeHistory', newHistory);
    }

    this.isCtrl = args.event?.ctrlKey ?? false;
    this.isShift = args.event?.shiftKey ?? false;
    this.startPosition = args.position;
    this.startPositionRaw = args.rawPosition;
    this.activeLayerId = args.layerId;
    this.hasStroke = false;

    let layer;
    try {
      layer = getLayer(args.layerId);
    } catch {
      this.resetStrokeState();
      return { shouldUpdate: false };
    }
    const { kernel, instrument } = this.resolveShape(preset);
    const point = this.buildPoint(args, args.rawPosition, args.color);
    this.grip.start(layer, kernel, point, instrument);
    this.hasStroke = true;

    return { shouldUpdate: true };
  }

  onMove(args: ToolArgs): ToolResult {
    return this.handleDraw(args);
  }

  onRawMove(args: ToolArgs): ToolResult {
    return this.handleDraw(args);
  }

  handleDraw(args: ToolArgs): ToolResult {
    if (!this.activeLayerId) return { shouldUpdate: false };
    if (this.isShift) {
      return { shouldUpdate: false };
    }

    const point = this.buildPoint(args, args.rawPosition, args.color);
    try {
      this.grip.addPoint(point);
      this.hasStroke = true;
      return { shouldUpdate: true };
    } catch {
      return { shouldUpdate: false };
    }
  }

  protected categoryId: ToolCategoryId = TOOL_CATEGORIES.PEN;

  private SNAP_ANGLE = Math.PI / 12;

  private snapToAngle(current: Vec2, start: Vec2): Vec2 {
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    const angle = Math.atan2(dy, dx);

    // 45度刻みでスナップ
    const snapAngle = Math.round(angle / this.SNAP_ANGLE) * this.SNAP_ANGLE;
    const distance = Math.hypot(dx, dy);

    return {
      x: Math.round(start.x + Math.cos(snapAngle) * distance),
      y: Math.round(start.y + Math.sin(snapAngle) * distance),
    };
  }

  onEnd(args: ToolArgs): ToolResult {
    if (!this.activeLayerId) {
      this.resetStrokeState();
      return { shouldUpdate: false };
    }

    const endPosition =
      this.isShift && this.isCtrl && this.startPositionRaw ? this.snapToAngle(args.rawPosition, this.startPositionRaw) : args.rawPosition;
    const point = this.buildPoint(args, endPosition, args.color);
    try {
      this.grip.end(point);
    } catch {
      this.resetStrokeState();
      return { shouldUpdate: false };
    }

    this.resetStrokeState();

    projectHistoryController.addAction(
      new LayerHistoryAction({
        layerId: args.layerId,
        context: { tool: this.categoryId },
      })
    );

    return {
      shouldUpdate: true,
    };
  }

  onCancel(_args: ToolArgs): ToolResult {
    this.grip.cancel();
    this.resetStrokeState();

    return {
      shouldUpdate: false,
    };
  }

  private resolveShape(preset?: PenPresetConfig): {
    kernel: GripKernel;
    instrument: GripInstrument;
  } {
    const shape = (preset?.shape ?? 'circle') as 'circle' | 'square';
    const kernel = shape === 'square' ? this.squareKernel : this.circleKernel;
    const instrument = new MaskStrokeInstrument();

    return {
      kernel,
      instrument,
    };
  }

  private buildPoint(args: ToolArgs, position: Vec2, color: RGBA): GripPoint {
    const presetName = args.presetName ?? DEFAULT_PRESET;
    const preset = getPresetOf(this.categoryId, presetName) as PenPresetConfig | undefined;
    const size = preset?.size ?? 1;
    const finalColor = this.forceColor ?? (args.event?.buttons === 2 ? transparent : color);

    return {
      x: position.x,
      y: position.y,
      style: {
        color: finalColor,
        size,
        opacity: 1,
      },
    };
  }

  private resetStrokeState() {
    this.isShift = false;
    this.isCtrl = false;
    this.startPosition = undefined;
    this.activeLayerId = undefined;
    this.hasStroke = false;
  }
}
