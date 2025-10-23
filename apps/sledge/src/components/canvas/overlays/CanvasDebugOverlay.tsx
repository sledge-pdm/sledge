import { css } from '@acab/ecsstatic';
import { SparkLine } from '@sledge/ui';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { DebugLogger } from '~/features/log/service';
import { globalConfig } from '~/stores/GlobalStores';

const canvasDebugOverlayTopLeft = css`
  display: flex;
  flex-direction: column;
  position: absolute;
  left: var(--spacing-sm);
  top: var(--spacing-sm);
  pointer-events: none;
  z-index: var(--zindex-canvas-overlay);
`;

const canvasDebugOverlayBottomLeft = css`
  display: flex;
  flex-direction: row;
  position: absolute;
  left: var(--spacing-sm);
  bottom: var(--spacing-sm);
  align-items: end;
  gap: var(--spacing-md);
  pointer-events: none;
  z-index: var(--zindex-canvas-overlay);
`;

const jsHeapContainer = css`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const CanvasDebugOverlay: Component = (props) => {
  const LOG_LABEL = 'CanvasDebugOverlay';
  const logger = new DebugLogger(LOG_LABEL, false);

  const toMiB = (bytes?: number): string => {
    if (bytes !== undefined) return (bytes / 1024 / 1024).toFixed(1);
    else return '-';
  };

  const [jsMemInfo, setJsMemInfo] = createSignal<any>({});
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
      logger.debugLog(`update memory info start.`);
      // JS heap は即時取得
      try {
        setJsMemInfo((performance as any).memory);
      } catch {}
      setSparkLineStore((prev) => {
        const jsMiB = (jsMemInfo()?.usedJSHeapSize ?? 0) / 1024 / 1024;
        return {
          jsHeap: [...prev.jsHeap, jsMiB].slice(-30),
        };
      });

      logger.debugLog(`update memory info done.`);
    } finally {
      memFetchInFlight = false;
    }
  };

  onMount(() => {
    let intervalId: NodeJS.Timeout | undefined;
    const startTimerId = window.setTimeout(() => {
      intervalId = setInterval(callback, 500);
    }, 100);

    return () => {
      if (startTimerId) clearTimeout(startTimerId);
      if (intervalId) clearInterval(intervalId);
    };
  });

  return (
    <>
      <Show when={globalConfig.debug.showPerformanceMonitor}>
        <div class={canvasDebugOverlayBottomLeft}>
          <div class={jsHeapContainer}>
            <p>
              JS Heap
              <br />
              {toMiB(jsMemInfo().usedJSHeapSize)} / {toMiB(jsMemInfo().totalJSHeapSize)} MiB
            </p>

            <SparkLine length={30} height={60} lengthMult={4} color='#f44336' values={sparkLineStore.jsHeap} min={0} />
          </div>
        </div>
      </Show>
    </>
  );
};

export default CanvasDebugOverlay;
