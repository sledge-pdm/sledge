import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { getCurrentSelection } from '~/controllers/selection/SelectionManager';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasDebugOverlayBottomLeft, canvasDebugOverlayTopLeft } from '~/styles/components/canvas/canvas_debug_overlay.css';
import { flexCol } from '~/styles/snippets.css';
import { eventBus, Events } from '~/utils/EventBus';
import { safeInvoke } from '~/utils/TauriUtils';
import { PixelLineChart } from '../common/PixelLineChart';

interface TauriMemInfo {
  total_bytes: number;
  main_bytes: number;
  children_bytes: number;
}

const CanvasDebugOverlay: Component = (props) => {
  const toMiB = (bytes?: number): string => {
    if (bytes !== undefined) return (bytes / 1024 / 1024).toFixed(1) + ' MiB';
    else return '- MiB';
  };

  // const zoom = () => canvasStore.zoom;
  const lastMouseWindow = () => interactStore.lastMouseWindow;
  const lastMouseOnCanvas = () => interactStore.lastMouseOnCanvas;
  const [jsMemInfo, setJsMemInfo] = createSignal<any>({});
  const [processMemInfo, setProcessMemInfo] = createSignal<TauriMemInfo>();
  const callback = async () => {
    setJsMemInfo((performance as any).memory);

    const processInfo = await safeInvoke<TauriMemInfo>('get_process_memory');
    if (processInfo) {
      setProcessMemInfo(processInfo);
      // console.log(processInfo);
    }
    // console.log(`MAIN: ${toMiB(processMemInfo()?.main_bytes)}
    // CHILDREN: ${toMiB(processMemInfo()?.children_bytes)}
    // TOTAL: ${toMiB(processMemInfo()?.total_bytes)}
    // JS Heap: ${toMiB(jsMemInfo().usedJSHeapSize)} / ${toMiB(jsMemInfo().totalJSHeapSize)}`);
  };

  const disposeInterval = makeTimer(callback, 5000, setInterval);

  const [offsetX, setOffsetX] = createSignal(0);
  const [offsetY, setOffsetY] = createSignal(0);
  const [selectionWidth, setSelectionWidth] = createSignal(0);
  const [selectionHeight, setSelectionHeight] = createSignal(0);

  const onSelectionMoved = (e: Events['selection:moved']) => {
    setOffsetX(e.newOffset.x);
    setOffsetY(e.newOffset.y);
  };
  const onSelectionChanged = (e: Events['selection:changed']) => {
    const box = getCurrentSelection().getBoundBox();
    if (box) {
      setSelectionWidth(box.right - box.left + 1);
      setSelectionHeight(box.bottom - box.top + 1);
    }
  };

  onMount(() => {
    eventBus.on('selection:changed', onSelectionChanged);
    eventBus.on('selection:moved', onSelectionMoved);
  });

  onCleanup(() => {
    eventBus.on('selection:changed', onSelectionChanged);
    eventBus.off('selection:moved', onSelectionMoved);
    disposeInterval();
  });

  return (
    <>
      <div class={canvasDebugOverlayTopLeft}>
        <div class={flexCol}>
          <p>canvas.</p>
          <p>
            ON WINDOW. ({lastMouseWindow().x}, {lastMouseWindow().y})
          </p>
          <p>
            ON CANVAS. ({Math.round(lastMouseOnCanvas().x)}, {Math.round(lastMouseOnCanvas().y)})
          </p>
          <p>
            offset:({Math.round(interactStore.offset.x)}, {Math.round(interactStore.offset.y)})
          </p>
          <p>
            selection offset:({offsetX()}, {offsetY()})
          </p>
          <p>
            selection size:({selectionWidth()}, {selectionHeight()})
          </p>
        </div>
      </div>

      <Show when={globalConfig.debug.showPerfMonitor}>
        <div class={canvasDebugOverlayBottomLeft}>
          <div class={flexCol} style={{ gap: '1px' }}>
            <p>MAIN: {toMiB(processMemInfo()?.main_bytes)}</p>
            <p>CHILDREN: {toMiB(processMemInfo()?.children_bytes)}</p>
            <p>TOTAL: {toMiB(processMemInfo()?.total_bytes)}</p>
            <PixelLineChart
              width={120}
              height={60}
              color='#00ca00'
              suffix='MiB'
              fetchSample={async () => {
                const processInfo = await safeInvoke<TauriMemInfo>('get_process_memory');
                return processInfo ? processInfo.total_bytes / 1024 / 1024 : undefined;
              }}
              interval={1000}
            />
          </div>
          <div class={flexCol} style={{ gap: '1px' }}>
            <p>
              JS Heap: {toMiB(jsMemInfo().usedJSHeapSize)} / {toMiB(jsMemInfo().totalJSHeapSize)}
            </p>

            <PixelLineChart
              width={120}
              height={60}
              color='#f44336'
              suffix='MiB'
              fetchSample={async () => (performance as any).memory.usedJSHeapSize / 1024 / 1024}
              interval={1000}
            />
          </div>
        </div>
      </Show>
    </>
  );
};

export default CanvasDebugOverlay;
