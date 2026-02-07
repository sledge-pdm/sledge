import { CircleKernel, SquareKernel } from '@sledge-pdm/frasco';
import { Component, createEffect, createSignal, For, JSX, onCleanup, onMount, Show } from 'solid-js';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager, SelectionUpdateType } from '~/features/selection/SelectionManager';
import {
  getActiveToolCategoryId,
  getCurrentPresetConfig,
  getPresetOf,
  getToolCategory,
  isToolAllowedInCurrentLayer,
} from '~/features/tools/ToolController';
import { LassoSelectionPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import { previewMaskManager, PreviewShape } from '~/features/tools/behaviors/draw/PreviewMaskManager';
import { interactStore, logStore, toolStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { PathCmdList } from '~/types/PathCommand';
import { eventBus, Events } from '~/utils/EventBus';
import { mask_to_path } from '~/utils/wasm';

import rawAreaPattern from '~/patterns/SelectionAreaPattern.svg?raw';

import { RGBAToHex } from '@sledge-pdm/core';
import { color } from '@sledge-pdm/ui';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { LassoDisplayMode, LassoSelection } from '~/features/tools/behaviors/selection/lasso/LassoSelection';
import { projectStore } from '~/stores/RuntimeProjectStore';
import '~/styles/selection_animations.css';

// raw SVG 文字列から最初の <path .../> だけを抽出（self-closing想定）。失敗時は全体を返す。
const extractFirstPath = (svg: string) => {
  const m = svg.match(/<path[\s\S]*?>/i); // self-closing or standard 最短
  return m ? m[0] : svg;
};
const areaPatternPath = extractFirstPath(rawAreaPattern);

const CanvasOverlaySVG: Component = () => {
  // 論理キャンバスサイズ (ズーム非適用)
  const logicalWidth = () => projectStore.canvas.size.width;
  const logicalHeight = () => projectStore.canvas.size.height;

  const [penOutlinePath, setPenOutlinePath] = createSignal('');
  let cachedLocalPath: PathCmdList | undefined;
  let cachedPreview: PreviewShape | undefined;
  const borderDash = 6;
  const [selectionPath, setSelectionPath] = createSignal<PathCmdList>(new PathCmdList([]));
  const [floatingAreaPath, setFloatingAreaPath] = createSignal<PathCmdList>(new PathCmdList([]));
  const [selectionChanged, setSelectionChanged] = createSignal(false);
  const [floatingAreaChanged, setFloatingAreaChanged] = createSignal(false);
  const [_, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS(() => {
      if (selectionChanged()) {
        updateSelectionOutline();
        setSelectionChanged(false);
      }
      if (floatingAreaChanged()) {
        updateFloatingAreaOutline();
        setFloatingAreaChanged(false);
      }
    }, 60)
  );

  const [lassoDisplayMode, setLassoDisplayMode] = createSignal<LassoDisplayMode>('fill');
  const [lassoFillMode, setLassoFillMode] = createSignal<'nonzero' | 'evenodd'>('nonzero');
  const [lassoOutlinePath, setLassoOutlinePath] = createSignal('');

  const [patternOffset, setPatternOffset] = createSignal(0);
  const updatePatternOffset = () => {
    setPatternOffset((prev) => (prev + 0.3) % 16);
  };

  const onSelectionUpdate = (e: { type: SelectionUpdateType }) => {
    updateSelectionOutline();
  };
  const updateSelectionOutline = () => {
    const { width, height } = projectStore.canvas.size;
    const mask = selectionManager.getSelection()?.getMask();
    const offset = selectionManager.getOffset();
    if (!mask) {
      setSelectionPath(new PathCmdList([]));
      return;
    }
    const pathString = mask_to_path(mask, width, height, offset.x, offset.y);
    setSelectionPath(PathCmdList.parse(pathString));
  };

  const onFloatingAreaUpdate = () => {
    updateFloatingAreaOutline();
  };
  const updateFloatingAreaOutline = () => {
    const { width, height } = projectStore.canvas.size;
    const mask = floatingMoveManager.getFloatingArea()?.getMask();
    const offset = floatingMoveManager.getOffset() ?? { x: 0, y: 0 };
    if (!mask) {
      setFloatingAreaPath(new PathCmdList([]));
      return;
    }
    const pathString = mask_to_path(mask, width, height, offset.x, offset.y);
    setFloatingAreaPath(PathCmdList.parse(pathString));
  };

  const handleLassoUpdate = ((e: Events['selection:updateLassoOutline']) => {
    if (toolStore.activeToolCategory === TOOL_CATEGORIES.LASSO_SELECTION) {
      const lassoTool = getToolCategory(TOOL_CATEGORIES.LASSO_SELECTION).behavior as LassoSelection;
      const preset = getPresetOf(
        TOOL_CATEGORIES.LASSO_SELECTION,
        toolStore.tools.lassoSelection.presets?.selected ?? 'default'
      ) as LassoSelectionPresetConfig;
      const displayMode = lassoTool.getDisplayMode(preset);
      const lassoFillMode = preset.fillMode;
      setLassoFillMode(lassoFillMode ?? 'nonzero');
      setLassoDisplayMode(displayMode);
      if (displayMode === 'fill') return;
      const path = lassoTool.getPath();
      setLassoOutlinePath(path.toString());
    }
  }) as (e: Events['selection:updateLassoOutline']) => void;

  let selectionUnsubscribe: () => void | undefined;
  let floatingMoveUnsubscribe: () => void | undefined;
  let updatePatternInterval: NodeJS.Timeout | undefined;

  onMount(() => {
    startRenderLoop();
    selectionUnsubscribe = selectionManager.subscribe(onSelectionUpdate);
    floatingMoveUnsubscribe = floatingMoveManager.subscribe(onFloatingAreaUpdate);
    eventBus.on('selection:updateLassoOutline', handleLassoUpdate);
    setSelectionChanged(true);

    updatePatternInterval = setInterval(updatePatternOffset, 30);
  });

  onCleanup(() => {
    selectionUnsubscribe?.();
    floatingMoveUnsubscribe?.();
    eventBus.off('selection:updateLassoOutline', handleLassoUpdate);
    stopRenderLoop();
    clearInterval(updatePatternInterval);
  });

  createEffect(() => {
    const tool = getActiveToolCategoryId();
    const preset = getCurrentPresetConfig(tool) as any;
    const size: number = preset?.size ?? 1;
    const shape: 'circle' | 'square' = preset?.shape ?? 'square';

    const kernel = shape === 'square' ? new SquareKernel() : new CircleKernel();
    cachedPreview = previewMaskManager.get(kernel, { size, color: [0, 0, 0, 255], opacity: 1 });
    if (!cachedPreview) {
      cachedLocalPath = undefined;
      return;
    }
    cachedLocalPath = PathCmdList.parse(cachedPreview.svgPath);
  });

  // Pen outline (logical coordinates)
  createEffect(() => {
    const tool = getActiveToolCategoryId();
    const mouse = interactStore.lastPointerOnCanvas;
    if (
      (tool === TOOL_CATEGORIES.PEN || tool === TOOL_CATEGORIES.ERASER) &&
      mouse &&
      cachedLocalPath &&
      cachedPreview &&
      isToolAllowedInCurrentLayer()
    ) {
      const { x: cx, y: cy } = cachedPreview.bitmaskShape.prePositionTransform(mouse);
      const ox = cx + cachedPreview.bitmaskShape.offsetX;
      const oy = cy + cachedPreview.bitmaskShape.offsetY;
      setPenOutlinePath(cachedLocalPath.toStringTranslated(interactStore.zoom, ox, oy));
    } else {
      setPenOutlinePath('');
    }
  });

  // Wrapper: pan だけ (zoom は座標へ直接反映し stroke を不変に保つ)
  const panWrapperStyle = (): JSX.CSSProperties => ({
    position: 'absolute',
    top: '0px',
    left: '0px',
    transform: `translate3d(${interactStore.offsetOrigin.x + interactStore.offset.x}px, ${interactStore.offsetOrigin.y + interactStore.offset.y}px, 0px)`,
    'transform-origin': '0 0',
    'pointer-events': 'none',
    'z-index': 'var(--zindex-canvas-overlay)',
    'will-change': 'transform',
  });

  // rotate + flip (中心基準)  ※ zoom は含まない
  const rotateFlipStyle = (): JSX.CSSProperties => {
    const w = logicalWidth() * interactStore.zoom; // サイズはズーム反映
    const h = logicalHeight() * interactStore.zoom;
    const cx = w / 2;
    const cy = h / 2;
    const sx = interactStore.horizontalFlipped ? -1 : 1;
    const sy = interactStore.verticalFlipped ? -1 : 1;
    const rot = interactStore.rotation;
    return {
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: `${w}px`,
      height: `${h}px`,
      transform: `translate3d(${cx}px, ${cy}px, 0px) rotate(${rot}deg) scale3d(${sx}, ${sy}, 1) translate3d(${-cx}px, ${-cy}px, 0px)`,
      'transform-origin': '0 0',
      'pointer-events': 'none',
      'will-change': 'transform',
    };
  };

  return (
    <>
      <div style={panWrapperStyle()}>
        <div style={rotateFlipStyle()}>
          <svg
            // viewBox は論理座標系、width/height はズーム反映済レイアウト (座標は内部で拡大済)
            viewBox={`0 0 ${logicalWidth() * interactStore.zoom} ${logicalHeight() * interactStore.zoom}`}
            xmlns='http://www.w3.org/2000/svg'
            style={
              {
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: `${logicalWidth() * interactStore.zoom}px`,
                height: `${logicalHeight() * interactStore.zoom}px`,
                overflow: 'visible',
                pointerEvents: 'none',
                'shape-rendering': 'auto',
              } as JSX.CSSProperties
            }
          >
            <defs>
              <pattern
                id='area-pattern-animate'
                x={patternOffset()}
                y={patternOffset()}
                width='32'
                height='32'
                patternUnits='userSpaceOnUse'
                patternContentUnits='userSpaceOnUse'
              >
                {/* Background rectangle placed before the stripe path so it appears behind */}
                <rect x={0} y={0} width='32' height='32' fill={color.selectionFill} />
                <g innerHTML={areaPatternPath} />
              </pattern>
            </defs>
            <defs>
              <pattern id='area-pattern' x={0} y={0} width='32' height='32' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
                <rect x={0} y={0} width='32' height='32' fill={color.selectionFill} />
                <g innerHTML={areaPatternPath} />
              </pattern>
            </defs>

            <path
              d={lassoOutlinePath()}
              fill={lassoDisplayMode() === 'outline' ? '#00000050' : 'none'}
              fill-rule={lassoFillMode()}
              clip-rule='evenodd'
              stroke={lassoDisplayMode() === 'outline' ? color.selectionBorder : 'red'}
              stroke-width={1}
              vector-effect='non-scaling-stroke'
              pointer-events='none'
              stroke-dasharray={lassoDisplayMode() === 'outline' ? `${borderDash} ${borderDash}` : undefined}
              class={lassoDisplayMode() === 'outline' ? 'marching-ants-animation' : undefined}
              transform={`scale(${interactStore.zoom})`}
            />

            {/* Canvas border (debug) */}
            <rect
              width={logicalWidth() * interactStore.zoom}
              height={logicalHeight() * interactStore.zoom}
              fill='none'
              stroke={color.canvasBorder}
              stroke-width={1}
              vector-effect='non-scaling-stroke'
              pointer-events='none'
            />

            {/* Debug points */}
            <For each={logStore.canvasDebugPoints}>
              {(p) => (
                <circle
                  r={3}
                  cx={p.x * interactStore.zoom}
                  cy={p.y * interactStore.zoom}
                  fill={`#${RGBAToHex(p.color)}`}
                  stroke='none'
                  vector-effect='non-scaling-stroke'
                  pointer-events='none'
                />
              )}
            </For>

            {/* ペン形状と選択範囲はリサイズ中は表示しない */}
            <Show when={interactStore.isCanvasSizeFrameMode === false}>
              {/* Pen hover preview */}
              <Show when={interactStore.isPointerOnStrokeDetectArea && globalConfig.editor.showPointedPixel && penOutlinePath()}>
                <path
                  d={penOutlinePath()}
                  fill='none'
                  stroke={color.border}
                  stroke-width={1}
                  vector-effect='non-scaling-stroke'
                  pointer-events='none'
                />
              </Show>

              {/* Selection outline */}
              <path
                id='selection-outline'
                d={selectionPath().toString(interactStore.zoom)}
                fill='url(#area-pattern-animate)'
                fill-rule='evenodd'
                clip-rule='evenodd'
                stroke={color.selectionBorder}
                stroke-width='1'
                vector-effect='non-scaling-stroke'
                pointer-events='none'
                stroke-dasharray={`${borderDash} ${borderDash}`}
                class='marching-ants-animation'
              />

              {/* Floating Area outline */}
              <path
                id='floating-area-outline'
                d={floatingAreaPath().toString(interactStore.zoom)}
                fill='url(#area-pattern-animate)'
                fill-rule='evenodd'
                clip-rule='evenodd'
                stroke={'#FF0000'}
                stroke-width='1'
                vector-effect='non-scaling-stroke'
                pointer-events='none'
                stroke-dasharray={`${borderDash} ${borderDash}`}
                class='marching-ants-animation'
              />
            </Show>
          </svg>
        </div>
      </div>
    </>
  );
};

export default CanvasOverlaySVG;
