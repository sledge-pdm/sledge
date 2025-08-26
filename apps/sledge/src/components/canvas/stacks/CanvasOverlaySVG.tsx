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
          fill='none'
          stroke={selectionState() === 'move_layer' ? '#FF0000' : vars.color.border}
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
