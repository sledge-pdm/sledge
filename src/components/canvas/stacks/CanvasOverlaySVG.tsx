import createRAF, { targetFPS } from '@solid-primitives/raf';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import Icon from '~/components/common/Icon';
import { traceAllBoundaries } from '~/controllers/selection/OutlineExtructor';
import { BoundBox, selectionManager } from '~/controllers/selection/SelectionManager';
import { cancelSelection, deletePixelInSelection } from '~/controllers/selection/SelectionOperator';
import { getCurrentTool } from '~/controllers/tool/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { vars } from '~/styles/global.css';
import { flexRow } from '~/styles/snippets.css';
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
  const [committed, setCommitted] = createSignal<boolean>(true);
  const [pathD, setPathD] = createSignal<string>('');
  const [outlineBoundBox, setOutlineBoundBox] = createSignal<BoundBox>();
  const [fps, setFps] = createSignal(60);
  const [isRunning, startRenderLoop, stopRenderLoop] = createRAF(
    targetFPS((timeStamp) => {
      if (selectionChanged()) {
        updateOutline();
        setSelectionChanged(false);
        const box = selectionManager.getBoundBox(true);
        if (box) setOutlineBoundBox(box);
      }
    }, fps)
  );

  const updateOutline = () => {
    const { width, height } = canvasStore.canvas;
    const d = traceAllBoundaries(
      selectionManager.getSelectionMask().getMask(),
      selectionManager.getPreviewMask()?.getMask(),
      width,
      height,
      selectionManager.getMoveOffset(),
      interactStore.zoom
    );
    setPathD(d);
  };

  const onSelectionChangedHandler = (e: Events['selection:changed']) => {
    setSelectionChanged(true);
    setCommitted(e.commit);
  };
  const onSelectionMovedHandler = (e: Events['selection:moved']) => {
    setSelectionChanged(true);
    setCommitted(true);
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
  createEffect(() => {
    const z = interactStore.zoom;
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
    const half = Math.floor(getCurrentTool().size / 2);
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
          'z-index': 150,
        }}
      >
        {/* border rect */}
        <rect width={borderWidth()} height={borderHeight()} fill='none' stroke='black' stroke-width={1} pointer-events='none' />

        {/* pen hover preview */}
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

        <path
          ref={(el) => (outlineRef = el)}
          d={pathD()}
          fill='none'
          stroke={vars.color.border}
          stroke-width='1'
          stroke-dasharray={`${borderDash} ${borderDash}`}
          stroke-dashoffset={borderOffset()}
          pointer-events='none'
        />

        {/* 
      <For each={dirtyRects()}>
        {(dirtyRect) => {
          return (
            <rect
              width={dirtyRect.globalTileSize * activeLayer()?.dotMagnification * interactStore.zoom}
              height={dirtyRect.globalTileSize * activeLayer()?.dotMagnification * interactStore.zoom}
              x={dirtyRect.getOffset().x * activeLayer()?.dotMagnification * interactStore.zoom}
              y={dirtyRect.getOffset().y * activeLayer()?.dotMagnification * interactStore.zoom}
              fill={dirtyRect.isDirty ? '#ff000060' : '#00ffff60'}
              stroke='none'
              pointer-events='none'
            />
          );
        }}
      </For> */}
      </svg>

      <div
        style={{
          position: 'absolute',
          left: `${outlineBoundBox()?.left}px`,
          top: `${outlineBoundBox()?.bottom}px`,
          visibility: pathD() !== '' && committed() ? 'visible' : 'collapse',
          'transform-origin': '0 0',
          'image-rendering': 'auto',
          'pointer-events': 'all',
          'z-index': 1000,
          transform: `scale(${1 / interactStore.zoom})`,
        }}
      >
        <div
          class={flexRow}
          style={{
            'margin-top': '8px',
            'background-color': vars.color.surface,
            border: `1px solid ${vars.color.onBackground}`,
            'pointer-events': 'all',
          }}
        >
          <div
            style={{
              margin: '6px',
              'pointer-events': 'all',
              cursor: 'pointer',
            }}
            onClick={() => {
              cancelSelection();
            }}
          >
            <Icon src='/icons/misc/clear.png' color={vars.color.onBackground} base={16} scale={1} />
          </div>
          <div
            style={{
              margin: '6px',
              'pointer-events': 'all',
              cursor: 'pointer',
            }}
          >
            <Icon src='/icons/misc/duplicate.png' color={vars.color.onBackground} base={16} scale={1} />
          </div>
          <div
            style={{
              margin: '6px',
              'pointer-events': 'all',
              cursor: 'pointer',
            }}
            onClick={() => {
              deletePixelInSelection();
            }}
          >
            <Icon src='/icons/misc/garbage.png' color={vars.color.onBackground} base={16} scale={1} />
          </div>
        </div>
      </div>
    </>
  );
};

export default CanvasOverlaySVG;
