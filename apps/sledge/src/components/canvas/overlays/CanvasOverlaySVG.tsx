import { RGBAToHex, TileIndex } from '@sledge/anvil';
import { mask_to_path } from '@sledge/wasm';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, For, JSX, onMount, Show } from 'solid-js';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { getSelectionOffset } from '~/features/selection/SelectionOperator';
import {
  getActiveToolCategoryId,
  getCurrentPresetConfig,
  getPresetOf,
  getToolCategory,
  isToolAllowedInCurrentLayer,
} from '~/features/tools/ToolController';
import { LassoSelectionPresetConfig, TOOL_CATEGORIES } from '~/features/tools/Tools';
import { interactStore, logStore, toolStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore, layerListStore } from '~/stores/ProjectStores';
import { PathCmdList } from '~/types/PathCommand';
import { eventBus, Events } from '~/utils/EventBus';

import rawAreaPattern from '@assets/patterns/SelectionAreaPattern.svg?raw';
import { ShapeMask } from '@sledge/anvil';
import { Circle } from '~/features/tools/behaviors/draw/pen/shape/Circle';
import { Square } from '~/features/tools/behaviors/draw/pen/shape/Square';

import { color } from '@sledge/theme';
import { createTimer } from '@solid-primitives/timer';
import { getAnvil } from '~/features/layer/anvil/AnvilManager';
import { LassoDisplayMode, LassoSelection } from '~/features/tools/behaviors/selection/lasso/LassoSelection';
import '~/styles/selection_animations.css';

// raw SVG 文字列から最初の <path .../> だけを抽出（self-closing想定）。失敗時は全体を返す。
const extractFirstPath = (svg: string) => {
  const m = svg.match(/<path[\s\S]*?>/i); // self-closing or standard 最短
  return m ? m[0] : svg;
};
const areaPatternPath = extractFirstPath(rawAreaPattern);

function getDrawnPixelMask(size: number, shape: 'circle' | 'square'): ShapeMask {
  switch (shape) {
    case 'circle':
      return new Circle(size).createMask();
    case 'square':
      return new Square(size).createMask();
  }
}

const CanvasOverlaySVG: Component = () => {
  // 論理キャンバスサイズ (ズーム非適用)
  const logicalWidth = () => canvasStore.canvas.width;
  const logicalHeight = () => canvasStore.canvas.height;

  const [penOutlinePath, setPenOutlinePath] = createSignal('');
  let cachedLocalPath: PathCmdList | undefined;
  let cachedKey: string | undefined;
  const borderDash = 6;
  const [selectionChanged, setSelectionChanged] = createSignal(false);
  const [pathCmdList, setPathCmdList] = createSignal<PathCmdList>(new PathCmdList([]));
  const [moveState, setMoveState] = createSignal(floatingMoveManager.getState());

  const [lassoDisplayMode, setLassoDisplayMode] = createSignal<LassoDisplayMode>('fill');
  const [lassoFillMode, setLassoFillMode] = createSignal<'nonzero' | 'evenodd'>('nonzero');
  const [lassoOutlinePath, setLassoOutlinePath] = createSignal('');

  const [_, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS(() => {
      if (selectionChanged()) {
        updateSelectionOutline();
        setSelectionChanged(false);
      }
    }, 60)
  );

  const updateSelectionOutline = () => {
    const { width, height } = canvasStore.canvas;
    const offset = getSelectionOffset();
    const mask = selectionManager.getCombinedMask();
    const pathString = mask_to_path(mask, width, height, offset.x, offset.y);
    setPathCmdList(PathCmdList.parse(pathString));
  };

  const [patternOffset, setPatternOffset] = createSignal(0);
  const updatePatternOffset = () => {
    setPatternOffset((prev) => (prev + 0.3) % 16);
  };

  // Memoize handleUpdate to keep a stable reference
  const handlePathUpdate = ((e: Events['selection:updateSelectionPath']) => {
    setMoveState(floatingMoveManager.getState());
    if (e.immediate) {
      updateSelectionOutline();
    } else {
      setSelectionChanged(true);
    }
  }) as (e: Events['selection:updateSelectionPath']) => void;

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

  // Events
  onMount(() => {
    startRenderLoop();
    eventBus.on('selection:updateSelectionPath', handlePathUpdate);
    eventBus.on('selection:updateLassoOutline', handleLassoUpdate);
    setSelectionChanged(true);

    const updatePatternInterval = setInterval(updatePatternOffset, 30);

    return () => {
      eventBus.off('selection:updateSelectionPath', handlePathUpdate);
      eventBus.off('selection:updateLassoOutline', handleLassoUpdate);
      stopRenderLoop();
      clearInterval(updatePatternInterval);
    };
  });

  // Cache local pen shape path
  createEffect(() => {
    const tool = getActiveToolCategoryId();
    if (tool !== TOOL_CATEGORIES.PEN && tool !== TOOL_CATEGORIES.ERASER) {
      cachedLocalPath = undefined;
      cachedKey = undefined;
      return;
    }
    const preset = getCurrentPresetConfig(tool) as any;
    const size: number = preset?.size ?? 1;
    const shape: 'circle' | 'square' = preset?.shape ?? 'square';
    const key = `${tool}-${size}-${shape}`;
    if (key === cachedKey && cachedLocalPath) return;
    const { mask, width, height } = getDrawnPixelMask(size, shape);
    const localPath = mask_to_path(mask, width, height, 0, 0);
    cachedLocalPath = PathCmdList.parse(localPath);
    cachedKey = key;
  });

  // Pen outline (logical coordinates)
  createEffect(() => {
    const tool = getActiveToolCategoryId();
    const mouse = interactStore.lastMouseOnCanvas;
    if ((tool === TOOL_CATEGORIES.PEN || tool === TOOL_CATEGORIES.ERASER) && mouse && cachedLocalPath && isToolAllowedInCurrentLayer()) {
      const preset = getCurrentPresetConfig(tool) as any;
      const size: number = preset?.size ?? 1;
      const shape: 'circle' | 'square' = preset?.shape ?? 'square';
      const { offsetX, offsetY } = getDrawnPixelMask(size, shape);
      const even = size % 2 === 0;
      const cx = even ? Math.round(mouse.x) : Math.floor(mouse.x);
      const cy = even ? Math.round(mouse.y) : Math.floor(mouse.y);
      const ox = cx + offsetX;
      const oy = cy + offsetY;
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
    transform: `translate(${interactStore.offsetOrigin.x + interactStore.offset.x}px, ${interactStore.offsetOrigin.y + interactStore.offset.y}px)`,
    'transform-origin': '0 0',
    'pointer-events': 'none',
    'z-index': 'var(--zindex-canvas-overlay)',
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
      transform: `translate(${cx}px, ${cy}px) rotate(${rot}deg) scale(${sx}, ${sy}) translate(${-cx}px, ${-cy}px)`,
      'transform-origin': '0 0',
      'pointer-events': 'none',
    };
  };

  const [dirtyTiles, setDirtyTiles] = createSignal<TileIndex[]>();
  const [tileSize, setTileSize] = createSignal(32);
  onMount(() => {
    createTimer(
      () => {
        try {
          const activeAnvil = getAnvil(layerListStore.activeLayerId);
          const tileSize = activeAnvil.getTileSize();
          setTileSize(tileSize);
          // JS TilesController
          setDirtyTiles(activeAnvil.getDirtyTiles());
        } catch (e) {
          // ignore when anvil not ready
        }
      },
      50,
      setInterval
    );
  });

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
            <For each={dirtyTiles()}>
              {(tile) => {
                return (
                  <rect
                    fill={'#ff000080'}
                    x={tile.col * tileSize()}
                    y={tile.row * tileSize()}
                    width={tileSize()}
                    height={tileSize()}
                    style={{
                      position: 'absolute',
                      'z-index': 1011000,
                    }}
                    transform={`scale(${interactStore.zoom})`}
                  />
                );
              }}
            </For>
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
              <Show when={penOutlinePath() && globalConfig.editor.showPointedPixel && interactStore.isMouseOnCanvas}>
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
                d={pathCmdList().toString(interactStore.zoom)}
                fill='url(#area-pattern-animate)'
                fill-rule='evenodd'
                clip-rule='evenodd'
                stroke={moveState() === 'layer' ? '#FF0000' : color.selectionBorder}
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
