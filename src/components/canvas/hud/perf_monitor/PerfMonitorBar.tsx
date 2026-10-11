import { css } from '@acab/ecsstatic';
import { SparkLine } from '@sledge-pdm/ui';
import { Component, createEffect, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { globalConfig } from '~/stores/GlobalStores';
import usePerfMonitor from './UsePerfMonitor';

const root = css`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  width: 100%;
  pointer-events: all;
  overflow-y: visible;
  z-index: var(--zindex-canvas-overlay);
`;

const container = css`
  position: relative;
  display: flex;
  flex-direction: row;
  /*justify-content: end;*/
  width: auto;
  height: 100%;
  padding: 4px;
  margin: 4px;
  align-items: center;
  border: 1px solid var(--color-border-secondary);
`;

const item = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const text = css`
  color: var(--color-on-background-secondary);
  min-width: 52px;
`;
const labelText = css`
  font-family: ZFB03B;
  color: var(--color-on-background-secondary);
`;
const infoText = css`
  font-family: ZFB09;
  /*color: var(--color-accent); */
`;

const background = css`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--color-background);
  opacity: 0.75;
  z-index: -1;
`;

const toMiB = (bytes?: number): string => {
  if (bytes !== undefined) return (bytes / 1024 / 1024).toFixed(1);
  else return '-';
};

const PerfMonitorBar: Component = () => {
  const { jsMemory } = usePerfMonitor();

  const [sparkLineStore, setSparkLineStore] = createStore<{ jsHeap: number[] }>({
    jsHeap: [],
  });

  createEffect(() => {
    const jsMiB = (jsMemory()?.usedJSHeapSize ?? 0) / 1024 / 1024;
    setSparkLineStore((prev) => {
      return {
        jsHeap: [...prev.jsHeap, jsMiB].slice(-14),
      };
    });
  });

  const rootEl = document.querySelector(':root');
  const accentHex = rootEl ? getComputedStyle(rootEl).getPropertyValue('--color-accent').trim() : '#FF0000';

  return (
    <Show when={globalConfig.debug.showPerformanceMonitor}>
      <div class={root}>
        <div class={container}>
          <div class={item}>
            <SparkLine length={14} height={24} lengthMult={4} color={accentHex} values={sparkLineStore.jsHeap} min={0} />
            <p class={text}>
              <span class={labelText}>JS Heap</span>
              <br />
              <span class={infoText}>{toMiB(jsMemory().usedJSHeapSize)}</span> MB
            </p>
          </div>
          <div class={background} />
        </div>
      </div>
    </Show>
  );
};

export default PerfMonitorBar;
