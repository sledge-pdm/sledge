import { Accessor, createSignal, onCleanup, onMount } from 'solid-js';
import { globalConfig } from '~/stores/GlobalStores';

const usePerfMonitor = (): {
  jsMemory: Accessor<any>;
} => {
  const [jsMemInfo, setJsMemInfo] = createSignal<any>({});

  let memFetchInFlight = false;
  const callback = async () => {
    // 監視がオフ・ウィンドウ非フォーカス時はスキップ
    if (!globalConfig.debug.showPerformanceMonitor || memFetchInFlight || !document.hasFocus()) return;
    memFetchInFlight = true;
    try {
      // JS heap は即時取得
      try {
        setJsMemInfo((performance as any).memory);
      } catch {}
    } finally {
      memFetchInFlight = false;
    }
  };

  let intervalId: NodeJS.Timeout | undefined;
  let startTimerId: number | undefined;

  onMount(() => {
    startTimerId = window.setTimeout(() => {
      intervalId = setInterval(callback, 250);
    }, 100);
  });

  onCleanup(() => {
    if (startTimerId) clearTimeout(startTimerId);
    if (intervalId) clearInterval(intervalId);
  });

  return { jsMemory: jsMemInfo };
};

export default usePerfMonitor;
