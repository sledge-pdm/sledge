import { flexCol } from '@sledge/core';
import { SparkLine } from '@sledge/ui';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { debugLog } from '~/controllers/log/LogController';
import { getCurrentSelection } from '~/controllers/selection/SelectionManager';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasDebugOverlayBottomLeft, canvasDebugOverlayTopLeft } from '~/styles/components/canvas/canvas_debug_overlay.css';
import { eventBus, Events } from '~/utils/EventBus';
import { safeInvoke } from '~/utils/TauriUtils';

interface TauriMemInfo {
  total_bytes: number;
  main_bytes: number;
  children_bytes: number;
}

const CanvasDebugOverlay: Component = (props) => {
  const LOG_LABEL = 'CanvasDebugOverlay';
  const toMiB = (bytes?: number): string => {
    if (bytes !== undefined) return (bytes / 1024 / 1024).toFixed(1) + ' MiB';
    else return '- MiB';
  };

  // const zoom = () => canvasStore.zoom;
  const lastMouseWindow = () => interactStore.lastMouseWindow;
  const lastMouseOnCanvas = () => interactStore.lastMouseOnCanvas;
  const [jsMemInfo, setJsMemInfo] = createSignal<any>({});
  const [processMemInfo, setProcessMemInfo] = createSignal<TauriMemInfo>();

  // for sparklines
  const [sparkLineStore, setSparkLineStore] = createStore<{ jsHeap: number[]; process: number[] }>({
    jsHeap: [],
    process: [],
  });

  let memFetchInFlight = false;
  const callback = async () => {
    // 監視がオフ・ウィンドウ非フォーカス時はスキップ
    if (!globalConfig.debug.showPerformanceMonitor || memFetchInFlight || !document.hasFocus()) return;
    memFetchInFlight = true;
    try {
      debugLog(LOG_LABEL, `update memory info start.`);
      // JS heap は即時取得
      try {
        setJsMemInfo((performance as any).memory);
      } catch {}

      // ネイティブ呼び出しはタイムアウト付きで最大300msだけ待つ
      const processInfo = await Promise.race<Promise<TauriMemInfo | undefined>>([
        safeInvoke<TauriMemInfo>('get_process_memory'),
        new Promise<TauriMemInfo | undefined>((resolve) => setTimeout(() => resolve(undefined), 300)),
      ]);
      if (processInfo) {
        setProcessMemInfo(processInfo);
      }
      // 非破壊更新 + 同一tick内での再読込を避けるためlocal値を使用
      setSparkLineStore((prev) => {
        const jsMiB = (jsMemInfo()?.usedJSHeapSize ?? 0) / 1024 / 1024;
        const totalBytes = processInfo?.total_bytes ?? 0;
        const procMiB = totalBytes / 1024 / 1024;
        return {
          jsHeap: [...prev.jsHeap, jsMiB].slice(-60),
          process: [...prev.process, procMiB].slice(-60),
        };
      });

      debugLog(LOG_LABEL, `update memory info done.`);
    } finally {
      memFetchInFlight = false;
    }
  };

  const [offsetX, setOffsetX] = createSignal(0);
  const [offsetY, setOffsetY] = createSignal(0);
  const [selectionWidth, setSelectionWidth] = createSignal(0);
  const [selectionHeight, setSelectionHeight] = createSignal(0);

  const onSelectionMoved = (e: Events['selection:moved']) => {
    setOffsetX(e.newOffset.x);
    setOffsetY(e.newOffset.y);
  };
  const onSelectionChanged = (e: Events['selection:areaChanged']) => {
    const box = getCurrentSelection().getBoundBox();
    if (box) {
      setSelectionWidth(box.right - box.left + 1);
      setSelectionHeight(box.bottom - box.top + 1);
    }
  };

  let disposeInterval: (() => void) | undefined;
  let startTimerId: number | undefined;
  onMount(() => {
    // 起動直後の描画・初期化と競合しないよう少し遅らせて開始
    startTimerId = window.setTimeout(() => {
      disposeInterval = makeTimer(callback, 1000, setInterval);
    }, 1500);
    eventBus.on('selection:areaChanged', onSelectionChanged);
    eventBus.on('selection:moved', onSelectionMoved);
  });

  onCleanup(() => {
    if (startTimerId) clearTimeout(startTimerId);
    disposeInterval?.();
    eventBus.off('selection:areaChanged', onSelectionChanged);
    eventBus.off('selection:moved', onSelectionMoved);
  });

  return (
    <>
      <Show when={globalConfig.debug.showCanvasDebugOverlay}>
        <div class={canvasDebugOverlayTopLeft}>
          <p>
            canvas. <br />
            ON WINDOW. ({lastMouseWindow().x}, {lastMouseWindow().y}) <br />
            ON CANVAS. ({Math.round(lastMouseOnCanvas().x)}, {Math.round(lastMouseOnCanvas().y)}) <br />
            offset:({Math.round(interactStore.offset.x)}, {Math.round(interactStore.offset.y)}) <br />
            selection offset:({offsetX()}, {offsetY()}) <br />
            selection size:({selectionWidth()}, {selectionHeight()}) <br />
          </p>
        </div>
      </Show>

      <Show when={globalConfig.debug.showPerformanceMonitor}>
        <div class={canvasDebugOverlayBottomLeft}>
          <div class={flexCol} style={{ gap: '1px' }}>
            <p>MAIN: {toMiB(processMemInfo()?.main_bytes)}</p>
            <p>CHILDREN: {toMiB(processMemInfo()?.children_bytes)}</p>
            <p>TOTAL: {toMiB(processMemInfo()?.total_bytes)}</p>

            <SparkLine length={60} height={60} lengthMult={2} color='#00ca00' values={sparkLineStore.process} min={0} />
          </div>
          <div class={flexCol} style={{ gap: '1px' }}>
            <p>
              JS Heap: {toMiB(jsMemInfo().usedJSHeapSize)} / {toMiB(jsMemInfo().totalJSHeapSize)}
            </p>

            <SparkLine length={60} height={60} lengthMult={2} color='#f44336' values={sparkLineStore.jsHeap} min={0} />
          </div>
        </div>
      </Show>
    </>
  );
};

export default CanvasDebugOverlay;
