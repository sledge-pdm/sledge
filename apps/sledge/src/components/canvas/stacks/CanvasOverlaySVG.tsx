import { mask_to_path } from '@sledge/wasm';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, For, JSX, onCleanup, onMount, Show } from 'solid-js';
import { RGBAToHex } from '~/features/color';
import { floatingMoveManager } from '~/features/selection/FloatingMoveManager';
import { selectionManager } from '~/features/selection/SelectionAreaManager';
import { getSelectionOffset } from '~/features/selection/SelectionOperator';
import { getActiveToolCategoryId, getCurrentPresetConfig, isToolAllowedInCurrentLayer } from '~/features/tools/ToolController';
import { TOOL_CATEGORIES } from '~/features/tools/Tools';
import { interactStore, logStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import { PathCmdList } from '~/types/PathCommand';
import { eventBus } from '~/utils/EventBus';

import rawPattern45border16 from '@assets/patterns/45border16.svg?raw';
import rawPattern45border8 from '@assets/patterns/45border8.svg?raw';
import { ShapeMask } from '@sledge/anvil';
import { Circle } from '~/features/tools/draw/pen/shape/Circle';
import { Square } from '~/features/tools/draw/pen/shape/Square';

import { color } from '@sledge/theme';
import './marching_ants.css';

// raw SVG 文字列から最初の <path .../> だけを抽出（self-closing想定）。失敗時は全体を返す。
const extractFirstPath = (svg: string) => {
  const m = svg.match(/<path[\s\S]*?>/i); // self-closing or standard 最短
  return m ? m[0] : svg;
};
const pattern45border16Path = extractFirstPath(rawPattern45border16);
const pattern45border8Path = extractFirstPath(rawPattern45border8);

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

  const [_, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS(() => {
      if (selectionChanged()) {
        updateSelectionOutline();
        setSelectionChanged(false);
      }
    }, Number(globalConfig.performance.targetFPS))
  );

  const updateSelectionOutline = () => {
    const { width, height } = canvasStore.canvas;
    const offset = getSelectionOffset();
    const mask = selectionManager.getCombinedMask();
    const pathString = mask_to_path(mask, width, height, offset.x, offset.y);
    setPathCmdList(PathCmdList.parse(pathString));
  };

  // Events
  onMount(() => {
    startRenderLoop();
    eventBus.on('selection:maskChanged', () => setSelectionChanged(true));
    eventBus.on('selection:offsetChanged', () => setSelectionChanged(true));
    eventBus.on('selection:stateChanged', () => setSelectionChanged(true));
    eventBus.on('floatingMove:moved', () => setMoveState(floatingMoveManager.getState()));
    eventBus.on('floatingMove:stateChanged', () => setMoveState(floatingMoveManager.getState()));
    setSelectionChanged(true);
  });
  onCleanup(() => {
    eventBus.off('selection:maskChanged');
    eventBus.off('selection:offsetChanged');
    eventBus.off('selection:stateChanged');
    eventBus.off('floatingMove:moved');
    eventBus.off('floatingMove:stateChanged');
    stopRenderLoop();
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

  return (
    <>
      <svg viewBox={`0 0 0 0`} xmlns='http://www.w3.org/2000/svg'></svg>

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
              <pattern id='45border8-svg' width='8' height='8' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
                <g innerHTML={pattern45border8Path} />
              </pattern>
              <pattern id='45border16-svg' width='16' height='16' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
                <g innerHTML={pattern45border16Path} />
              </pattern>
            </defs>
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

            {/* Pen hover preview */}
            <Show when={penOutlinePath() && globalConfig.editor.showPointedPixel && interactStore.isMouseOnCanvas && !interactStore.isPenOut}>
              <path
                d={penOutlinePath()}
                fill='none'
                stroke={color.border}
                stroke-width={1}
                vector-effect='non-scaling-stroke'
                pointer-events='none'
              />
            </Show>

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

            {/* Selection outline */}
            <path
              id='selection-outline'
              d={pathCmdList().toString(interactStore.zoom)}
              fill='url(#45border16-svg)'
              fill-rule='evenodd'
              clip-rule='evenodd'
              stroke={moveState() === 'layer' ? '#FF0000' : color.selectionBorder}
              stroke-width='1'
              vector-effect='non-scaling-stroke'
              stroke-dasharray={`${borderDash} ${borderDash}`}
              pointer-events='none'
              class='marching-ants-animation'
            />
          </svg>
        </div>
      </div>
    </>
  );
};

export default CanvasOverlaySVG;
