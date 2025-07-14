import { vars } from '@sledge/theme';
import { mask_to_path } from '@sledge/wasm';
import createRAF, { targetFPS } from '@solid-primitives/raf';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { PathCmd, PathCmdList } from '~/controllers/selection/PathCommand';
import { selectionManager } from '~/controllers/selection/SelectionManager';
import { getCurrentTool } from '~/controllers/tool/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import { eventBus, Events } from '~/utils/EventBus';

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CanvasOverlaySVG: Component = (props) => {
  let outlineRef: SVGPathElement | undefined;

  const borderWidth = () => canvasStore.canvas.width * interactStore.zoom;
  const borderHeight = () => canvasStore.canvas.height * interactStore.zoom;

  const [areaPenWrite, setAreaPenWrite] = createSignal<Area>();
  const borderDash = 6;
  const [borderOffset, setBorderOffset] = createSignal<number>(0);
  const disposeInterval = makeTimer(
    () => {
      setBorderOffset((borderOffset() + 1) % (borderDash * 2));
    },
    100,
    setInterval
  );

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

  const isFilled = (idx: number): number => {
    const a = selectionManager.getSelectionMask().getMask()[idx];
    const previewMask = selectionManager.getPreviewMask();
    if (!previewMask) return a;
    const b = previewMask.getMask()[idx];
    return selectionManager.getCurrentMode() === 'subtract' ? a & (b ^ 1) : a | b;
  };

  const updateOutline = () => {
    const { width, height } = canvasStore.canvas;
    const offset = selectionManager.getMoveOffset();

    // 合成されたマスクを取得
    const combinedMask = selectionManager.getCombinedMask();

    // wasmでSVGパス文字列を生成
    const pathString = mask_to_path(combinedMask, width, height, offset.x, offset.y);

    // パス文字列をPathCmdListに変換
    const pathCmds = new PathCmdList();
    if (pathString.trim()) {
      // 簡易的なパース（将来的にはより堅牢にする）
      const commands = pathString.split(/(?=[MLZ])/);
      commands.forEach((cmd) => {
        const trimmed = cmd.trim();
        if (!trimmed) return;

        const parts = trimmed.split(/\s+/);
        const command = parts[0];

        if (command === 'M' || command === 'L') {
          const x = parseFloat(parts[1]);
          const y = parseFloat(parts[2]);
          pathCmds.add(new PathCmd(command, x, y));
        } else if (command === 'Z') {
          pathCmds.add(new PathCmd(command));
        }
      });
    }

    setPathCmdList(pathCmds);
  };

  const onSelectionChangedHandler = (e: Events['selection:changed']) => {
    setSelectionChanged(true);
  };
  const onSelectionMovedHandler = (e: Events['selection:moved']) => {
    setSelectionChanged(true);
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
    eventBus.on('selection:changed', onSelectionChangedHandler);
    eventBus.on('selection:moved', onSelectionMovedHandler);
    window.addEventListener('keydown', tempKeyMove);
    setSelectionChanged(true);
  });
  onCleanup(() => {
    eventBus.off('selection:changed', onSelectionChangedHandler);
    eventBus.off('selection:moved', onSelectionMovedHandler);
    disposeInterval();
    window.removeEventListener('keydown', tempKeyMove);
    stopRenderLoop();
  });

  createEffect(() => {
    const currentTool = getCurrentTool();
    const toolSize = currentTool.size ?? 0;
    const half = Math.floor(toolSize / 2);
    let x = Math.floor(interactStore.lastMouseOnCanvas.x) - half;
    let y = Math.floor(interactStore.lastMouseOnCanvas.y) - half;
    let size = 1 + half * 2; // -half ~ half

    x *= interactStore.zoom;
    y *= interactStore.zoom;
    size *= interactStore.zoom;

    setAreaPenWrite({
      x,
      y,
      width: size,
      height: size,
    });
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
          'z-index': 450,
        }}
      >
        {/* border rect */}
        <rect width={borderWidth()} height={borderHeight()} fill='none' stroke='black' stroke-width={1} pointer-events='none' />

        {/* pen hover preview */}
        <Show when={globalConfig.editor.showPointedPixel}>
          <rect
            width={areaPenWrite()?.width}
            height={areaPenWrite()?.height}
            x={areaPenWrite()?.x}
            y={areaPenWrite()?.y}
            fill='none'
            stroke={vars.color.border}
            stroke-width={1}
            pointer-events='none'
          />
        </Show>

        <path
          ref={(el) => (outlineRef = el)}
          d={pathCmdList().toString(interactStore.zoom)}
          fill='none'
          stroke={vars.color.border}
          stroke-width='1'
          stroke-dasharray={`${borderDash} ${borderDash}`}
          stroke-dashoffset={borderOffset()}
          pointer-events='none'
        />
      </svg>
    </>
  );
};

export default CanvasOverlaySVG;
