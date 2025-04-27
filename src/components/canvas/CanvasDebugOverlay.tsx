import { Component, createSignal, Show } from 'solid-js';
import { canvasStore } from '~/stores/project/canvasStore';
import { activeLayer } from '~/stores/project/layerStore';
import { globalStore } from '~/stores/global/globalStore';
import {
  canvasDebugOverlayBottomLeft,
  canvasDebugOverlayTopLeft,
} from '~/styles/components/canvas/canvas_debug_overlay.css';
import { makeTimer } from '@solid-primitives/timer';
import { memoryInfo } from 'tauri-plugin-system-info-api';
import { safeInvoke } from '~/utils/tauriUtils';
import { PixelLineChart } from '../common/PixelLineChart';
import { flexCol } from '~/styles/snippets.css';

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
  const lastMouseWindow = () => canvasStore.lastMouseWindow;
  const lastMouseOnCanvas = () => canvasStore.lastMouseOnCanvas;
  const [jsMemInfo, setJsMemInfo] = createSignal<any>({});
  const [processMemInfo, setProcessMemInfo] = createSignal<TauriMemInfo>();
  const callback = async () => {
    setJsMemInfo((performance as any).memory);

    const processInfo = await safeInvoke<TauriMemInfo>('get_process_memory');
    if (processInfo) {
      setProcessMemInfo(processInfo);
      console.log(processInfo);
    }
    console.log(`MAIN: ${toMiB(processMemInfo()?.main_bytes)}
    CHILDREN: ${toMiB(processMemInfo()?.children_bytes)}
    TOTAL: ${toMiB(processMemInfo()?.total_bytes)}
    JS Heap: ${toMiB(jsMemInfo().usedJSHeapSize)} / ${toMiB(jsMemInfo().totalJSHeapSize)}`);
  };

  const disposeInterval = makeTimer(callback, 1000, setInterval);

  return (
    <>
      <div class={canvasDebugOverlayTopLeft}>
        <div class={flexCol}>
          <p>canvas.</p>
          <p>
            ON WINDOW. ({lastMouseWindow().x}, {lastMouseWindow().y})
          </p>
          <p>
            ON CANVAS. ({Math.round(lastMouseOnCanvas().x)},{' '}
            {Math.round(lastMouseOnCanvas().y)})
          </p>
          <p>
            offset:({Math.round(canvasStore.offset.x)},{' '}
            {Math.round(canvasStore.offset.y)})
          </p>
        </div>
      </div>

      <Show when={globalStore.showPerfMonitor}>
        <div class={canvasDebugOverlayBottomLeft}>
          <div class={flexCol}>
            <p>MAIN: {toMiB(processMemInfo()?.main_bytes)}</p>
            <p>CHILDREN: {toMiB(processMemInfo()?.children_bytes)}</p>
            <p>TOTAL: {toMiB(processMemInfo()?.total_bytes)}</p>
            <PixelLineChart
              width={160}
              height={60}
              color='#00ca00'
              suffix='MiB'
              fetchSample={async () => {
                const processInfo =
                  await safeInvoke<TauriMemInfo>('get_process_memory');
                return processInfo
                  ? processInfo.total_bytes / 1024 / 1024
                  : undefined;
              }}
              interval={500}
            />
          </div>
          <div class={flexCol}>
            <p>
              JS Heap: {toMiB(jsMemInfo().usedJSHeapSize)} /{' '}
              {toMiB(jsMemInfo().totalJSHeapSize)}
            </p>

            <PixelLineChart
              width={160}
              height={60}
              color='#f44336'
              suffix='MiB'
              fetchSample={async () =>
                (performance as any).memory.usedJSHeapSize / 1024 / 1024
              }
              interval={500}
            />
          </div>
        </div>
      </Show>
    </>
  );
};

export default CanvasDebugOverlay;
