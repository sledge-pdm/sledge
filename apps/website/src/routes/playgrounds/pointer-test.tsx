import { css } from '@acab/ecsstatic';
import { RouteSectionProps } from '@solidjs/router';
import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Portal } from 'solid-js/web';

const header = css`
  font-size: 16px;
  font-family: ZFB21;
  text-transform: uppercase;
  margin-top: 16px;
`;
const subHeader = css`
  font-size: 8px;
  font-family: ZFB21;
  text-transform: uppercase;
  margin-top: 8px;
`;

const infoHeader = css`
  font-size: 8px;
  font-family: ZFB21;
  text-transform: uppercase;
  margin-top: 16px;
  color: var(--color-accent);
`;
const infoContent = css`
  font-size: 8px;
  font-family: ZFB09;
  margin-top: 4px;
`;

const highlight = css`
  color: var(--color-active);
`;

const pointerArea = css`
  width: 400px;
  height: 400px;
  border: 2px solid var(--color-border-primary);
  background-color: #ffffff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 11000;
`;

const pointerEventNames = [
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointercancel',
  'pointerover',
  'pointerout',
  'pointerenter',
  'pointerleave',
  'pointerrawupdate',
  'gotpointercapture',
  'lostpointercapture',
] as const;

type PointerEventName = (typeof pointerEventNames)[number];
type PointerEventInfo = {
  event: PointerEvent | null;
  intervalMs: number | null;
  fps: number | null;
  recentCount: number;
};

const createInitialEventStore = () =>
  pointerEventNames.reduce(
    (acc, eventName) => ({
      ...acc,
      [eventName]: {
        event: null,
        intervalMs: null,
        fps: null,
        recentCount: 0,
      },
    }),
    {} as Record<PointerEventName, PointerEventInfo>
  );

const PlaygroundPointerTest: Component<RouteSectionProps> = (props) => {
  let areaRef: HTMLDivElement;
  const [windowMs, setWindowMs] = createSignal(1000);
  const [latestEventsStore, setLatestEventsStore] = createStore(createInitialEventStore());
  const eventTimeouts: Partial<Record<PointerEventName, number[]>> = {};
  const previousTimestamps: Partial<Record<PointerEventName, number>> = {};

  const handlePointerEvent = (eventName: PointerEventName, event: PointerEvent) => {
    const previousTimestamp = previousTimestamps[eventName];
    previousTimestamps[eventName] = event.timeStamp;

    let intervalMs: number | null = null;
    if (typeof previousTimestamp === 'number') {
      intervalMs = event.timeStamp - previousTimestamp;
    }

    setLatestEventsStore(eventName, (prev) => ({
      ...prev,
      event,
      intervalMs,
      fps: null,
      recentCount: prev.recentCount + 1,
    }));

    const timeoutId = window.setTimeout(() => {
      setLatestEventsStore(eventName, 'recentCount', (count) => Math.max(0, count - 1));
      const timeouts = eventTimeouts[eventName];
      if (timeouts) {
        eventTimeouts[eventName] = timeouts.filter((id) => id !== timeoutId);
      }
    }, windowMs());

    const timeouts = eventTimeouts[eventName] ?? [];
    eventTimeouts[eventName] = [...timeouts, timeoutId];
  };

  onMount(() => {
    const handlers = pointerEventNames.map((eventName) => {
      const handler = (event: PointerEvent) => handlePointerEvent(eventName, event);
      areaRef.addEventListener(eventName, handler as EventListener);
      return { eventName, handler };
    });

    onCleanup(() => {
      handlers.forEach(({ eventName, handler }) => {
        areaRef.removeEventListener(eventName, handler as EventListener);
      });
      Object.values(eventTimeouts).forEach((timeouts) => {
        timeouts?.forEach((timeoutId) => clearTimeout(timeoutId));
      });
    });
  });

  return (
    <div>
      <a href='/playground'>back to playground home</a>
      <p class={header}>Pointer Test</p>
      <p class={subHeader}>test your pointers.</p>
      <p class={infoContent}>
        window (ms): <input type='number' min='0' step='100' value={windowMs()} onInput={(e) => setWindowMs(Number(e.currentTarget.value) || 0)} />
      </p>

      <For each={pointerEventNames}>
        {(eventType) => {
          const info = latestEventsStore[eventType];

          return (
            <>
              <p class={infoHeader}>{eventType}</p>
              <p class={infoContent}>type: {info.event?.pointerType ?? '---'}</p>
              <p class={infoContent}>
                position: <span class={highlight}>{info.event?.clientX.toFixed(1)}</span>,{' '}
                <span class={highlight}>{info.event?.clientY.toFixed(1)}</span>
              </p>
              <p class={infoContent}>
                interval: <span class={highlight}>{info.intervalMs?.toFixed(2)}</span> ms
              </p>
              <p class={infoContent}>
                last {(windowMs() / 1000).toFixed(1)}s count: <span class={highlight}>{info.recentCount}</span>
              </p>
            </>
          );
        }}
      </For>

      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div ref={(ref) => (areaRef = ref)} id='area' class={pointerArea} />
      </Portal>
    </div>
  );
};

export default PlaygroundPointerTest;
