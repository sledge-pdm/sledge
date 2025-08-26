import { vars } from '@sledge/theme';
import { mask_to_path } from '@sledge/wasm';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { Component, createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { getActiveToolCategoryId, getCurrentPresetConfig, isToolAllowedInCurrentLayer } from '~/controllers/tool/ToolController';
import { Consts } from '~/models/Consts';
import { interactStore, logStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import '~/styles/misc/marching_ants.css';
import { getDrawnPixelMask } from '~/tools/draw/pen/PenDraw';
import { TOOL_CATEGORIES } from '~/tools/Tools';
import { PathCmdList } from '~/types/PathCommand';
import { RGBAToHex } from '~/utils/ColorUtils';
import { eventBus, Events } from '~/utils/EventBus';

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CanvasOverlaySVG: Component = (props) => {
  const borderWidth = () => canvasStore.canvas.width * interactStore.zoom;
  const borderHeight = () => canvasStore.canvas.height * interactStore.zoom;

  const [areaPenWrite, setAreaPenWrite] = createSignal<Area>();
  const [penOutlinePath, setPenOutlinePath] = createSignal<string>('');
  // ローカル座標系 (mask 原点) の PathCmdList をキャッシュ
  let cachedLocalPath: PathCmdList | undefined;
  let cachedKey: string | undefined; // toolId + size + shape
  const borderDash = 6;

  const [selectionChanged, setSelectionChanged] = createSignal<boolean>(false);
  const [pathCmdList, setPathCmdList] = createSignal<PathCmdList>(new PathCmdList([]));
  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (selectionChanged()) {
        updateOutline();
        setSelectionChanged(false);
      }
    }, Number(globalConfig.performance.targetFPS))
  );

  const updateOutline = () => {
    const { width, height } = canvasStore.canvas;
    const offset = selectionManager.getMoveOffset();

    // 合成されたマスクを取得
    const combinedMask = selectionManager.getCombinedMask();

    // wasmでSVGパス文字列を生成
    const pathString = mask_to_path(combinedMask, width, height, offset.x, offset.y);

    // パス文字列をPathCmdListに変換
    const pathCmds = PathCmdList.parse(pathString);
    setPathCmdList(pathCmds);
  };

  const onSelectionChangedHandler = (e: Events['selection:areaChanged']) => {
    setSelectionChanged(true);
  };
  const onSelectionMovedHandler = (e: Events['selection:moved']) => {
    setSelectionChanged(true);
  };

  const [selectionState, setSelectionState] = createSignal(selectionManager.getState());
  const onSelectionStateChangedHandler = (e: Events['selection:stateChanged']) => {
    setSelectionChanged(true);
    if (import.meta.env.DEV) console.log('Selection state changed:', e.newState);
    setSelectionState(e.newState);
  };

  const tempKeyMove = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        selectionManager.move({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        selectionManager.move({ x: 1, y: 0 });
        break;
      case 'ArrowUp':
        selectionManager.move({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        selectionManager.move({ x: 0, y: 1 });
        break;
    }
  };

  onMount(() => {
    startRenderLoop();
    eventBus.on('selection:areaChanged', onSelectionChangedHandler);
    eventBus.on('selection:moved', onSelectionMovedHandler);
    eventBus.on('selection:stateChanged', onSelectionStateChangedHandler);
    window.addEventListener('keydown', tempKeyMove);
    setSelectionChanged(true);
  });
  onCleanup(() => {
    eventBus.off('selection:areaChanged', onSelectionChangedHandler);
    eventBus.off('selection:moved', onSelectionMovedHandler);
    eventBus.off('selection:stateChanged', onSelectionStateChangedHandler);
    window.removeEventListener('keydown', tempKeyMove);
    stopRenderLoop();
  });

  // 1) ローカルパス生成（size/shape 依存）
  createEffect(() => {
    const active = getActiveToolCategoryId();
    if (active !== TOOL_CATEGORIES.PEN && active !== TOOL_CATEGORIES.ERASER) {
      cachedLocalPath = undefined;
      cachedKey = undefined;
      return;
    }
    const preset = getCurrentPresetConfig(active) as any;
    const size: number = preset?.size ?? 1;
    const shape: 'circle' | 'square' = preset?.shape ?? 'square';
    const key = `${active}-${size}-${shape}`;
    if (cachedKey === key && cachedLocalPath) return; // 変更なし

    const { mask, width, height } = getDrawnPixelMask(size, shape);
    const pathLocal = mask_to_path(mask, width, height, 0.0, 0.0);
    cachedLocalPath = PathCmdList.parse(pathLocal);
    cachedKey = key;
  });

  // 2) マウス移動に応じた平行移動だけ適用
  createEffect(() => {
    const active = getActiveToolCategoryId();
    const mouse = interactStore.lastMouseOnCanvas;
    if ((active === TOOL_CATEGORIES.PEN || active === TOOL_CATEGORIES.ERASER) && mouse && cachedLocalPath && isToolAllowedInCurrentLayer()) {
      const preset = getCurrentPresetConfig(active) as any;
      const size: number = preset?.size ?? 1;
      const shape: 'circle' | 'square' = preset?.shape ?? 'square';

      // マスクの原点 (左上) へ移すためのオフセットを再計算
      const { offsetX, offsetY } = getDrawnPixelMask(size, shape);

      const isEven = size % 2 === 0;
      const centerX = isEven ? Math.round(mouse.x) : Math.floor(mouse.x);
      const centerY = isEven ? Math.round(mouse.y) : Math.floor(mouse.y);
      const originX = centerX + offsetX;
      const originY = centerY + offsetY;

      setPenOutlinePath(cachedLocalPath.toStringTranslated(interactStore.zoom, originX, originY));
    } else {
      setPenOutlinePath('');
    }
  });

  return (
    <>
      <svg
        viewBox={`0 0 ${borderWidth()} ${borderHeight()}`}
        xmlns='http://www.w3.org/2000/svg'
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          'pointer-events': 'none',
          'shape-rendering': 'auto',
          overflow: 'visible',
          'z-index': Consts.zIndex.canvasOverlay,
        }}
      >
        <defs>
          <pattern id='tex45borderPattern' x='0' y='0' width='8' height='8' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
            <image href='/icons/misc/tex_45border.png' x='0' y='0' width='8' height='8' style={{ 'image-rendering': 'pixelated' }} />
          </pattern>
          <pattern id='tex45borderPattern-svg' width='8' height='8' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
            <svg width='8' height='8' viewBox='0 0 8 8'>
              <path
                d='M 0 8 L 1 8 L 1 6 L 3 6 L 3 4 L 5 4 L 5 2 L 7 2 L 7 0 L 8 0 L 8 1 L 6 1 L 6 3 L 4 3 L 4 5 L 2 5 L 2 7 L 0 7 L 0 8 Z M 4 8 L 5 8 L 5 6 L 7 6 L 7 4 L 8 4 L 8 5 L 6 5 L 6 7 L 4 7 L 4 8 Z M 1 2 L 3 2 L 3 0 L 4 0 L 4 1 L 2 1 L 2 3 L 0 3 L 0 4 L 1 4 L 1 2 Z'
                fill={vars.color.selectionBorderFill}
              />
            </svg>
          </pattern>

          <pattern id='tex45borderPattern8x2' x='0' y='0' width='16' height='16' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
            <image href='/icons/misc/tex_45border.png' x='0' y='0' width='16' height='16' style={{ 'image-rendering': 'pixelated' }} />
          </pattern>
          <pattern id='tex45borderPattern8x2-svg' width='16' height='16' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
            <svg width='16' height='16' viewBox='0 0 8 8'>
              <path
                d='M 0 8 L 1 8 L 1 6 L 3 6 L 3 4 L 5 4 L 5 2 L 7 2 L 7 0 L 8 0 L 8 1 L 6 1 L 6 3 L 4 3 L 4 5 L 2 5 L 2 7 L 0 7 L 0 8 Z M 4 8 L 5 8 L 5 6 L 7 6 L 7 4 L 8 4 L 8 5 L 6 5 L 6 7 L 4 7 L 4 8 Z M 1 2 L 3 2 L 3 0 L 4 0 L 4 1 L 2 1 L 2 3 L 0 3 L 0 4 L 1 4 L 1 2 Z'
                fill={vars.color.selectionBorderFill}
              />
            </svg>
          </pattern>

          <pattern id='tex45borderPattern16' x='0' y='0' width='16' height='16' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
            <image href='/icons/misc/tex_45border_16.png' x='0' y='0' width='16' height='16' style={{ 'image-rendering': 'pixelated' }} />
          </pattern>
          <pattern id='tex45borderPattern16-svg' width='16' height='16' patternUnits='userSpaceOnUse' patternContentUnits='userSpaceOnUse'>
            <svg width='16' height='16' viewBox='0 0 16 16'>
              <path
                d='M 5 10 L 7 10 L 7 8 L 9 8 L 9 6 L 11 6 L 11 4 L 13 4 L 13 2 L 15 2 L 15 0 L 16 0 L 16 1 L 14 1 L 14 3 L 12 3 L 12 5 L 10 5 L 10 7 L 8 7 L 8 9 L 6 9 L 6 11 L 4 11 L 4 13 L 2 13 L 2 15 L 0 15 L 0 16 L 1 16 L 1 14 L 3 14 L 3 12 L 5 12 L 5 10 Z M 13 10 L 15 10 L 15 8 L 16 8 L 16 9 L 14 9 L 14 11 L 12 11 L 12 13 L 10 13 L 10 15 L 8 15 L 8 16 L 9 16 L 9 14 L 11 14 L 11 12 L 13 12 L 13 10 Z M 0 7 L 2 7 L 2 5 L 4 5 L 4 3 L 6 3 L 6 1 L 8 1 L 8 0 L 7 0 L 7 2 L 5 2 L 5 4 L 3 4 L 3 6 L 1 6 L 1 8 L 0 8 L 0 7 Z'
                fill={vars.color.selectionBorderFill}
              />
            </svg>
          </pattern>
        </defs>

        {/* border rect */}
        <rect width={borderWidth()} height={borderHeight()} fill='none' stroke='black' stroke-width={0.2} pointer-events='none' />

        {/* pen hover preview (exact outline) */}
        <Show when={penOutlinePath() && globalConfig.editor.showPointedPixel && interactStore.isMouseOnCanvas && !interactStore.isPenOut}>
          <path d={penOutlinePath()} fill='none' stroke={vars.color.border} stroke-width={1} pointer-events='none' />
        </Show>

        <For each={logStore.canvasDebugPoints}>
          {(point) => {
            return (
              <circle
                r={4}
                cx={point.x * interactStore.zoom}
                cy={point.y * interactStore.zoom}
                fill={`#${RGBAToHex(point.color)}`}
                stroke='none'
                pointer-events='none'
              />
            );
          }}
        </For>

        <path
          id='selection-outline'
          d={pathCmdList().toString(interactStore.zoom)}
          fill='url(#tex45borderPattern8x2-svg)'
          fill-rule='evenodd'
          clip-rule='evenodd'
          stroke={selectionState() === 'move_layer' ? '#FF0000' : vars.color.selectionBorder}
          stroke-width='1'
          stroke-dasharray={`${borderDash} ${borderDash}`}
          pointer-events='none'
          class='marching-ants-animation'
        />
      </svg>
    </>
  );
};

export default CanvasOverlaySVG;
