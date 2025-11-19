import { css } from '@acab/ecsstatic';
import { Component, createEffect, createSignal, For, onCleanup, onMount } from 'solid-js';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import { logSystemWarn } from '~/features/log/service';
import { calculateRulerMarks, RectSnapshot, RulerCalculationContext, RulerCalculationResult, RulerMark } from './RulerCalculator';

const rulerRoot = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: var(--zindex-canvas-overlay);
  pointer-events: none;
`;

const vertRulerContainer = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 100%;
  /* background-color: var(--color-surface); */
  /* border-right: 1px solid var(--color-border); */
  z-index: var(--zindex-canvas-overlay);
  overflow: hidden;
`;

const horzRulerContainer = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 16px;
  /* background-color: var(--color-surface); */
  /* border-bottom: 1px solid var(--color-border); */
  z-index: var(--zindex-canvas-overlay);
  overflow: hidden;
`;

const intersectionContainer = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  background-color: var(--color-surface);
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  z-index: var(--zindex-canvas-overlay);
`;

const rulerMark = css`
  position: absolute;
  pointer-events: none;
  backdrop-filter: invert(75%);
`;

const majorMarkHorizontal = css`
  height: 6px;
  width: 1px;
  bottom: 0;
`;

const minorMarkHorizontal = css`
  height: 3px;
  width: 1px;
  bottom: 0;
`;

const majorMarkVertical = css`
  width: 6px;
  height: 1px;
  right: 0;
`;

const minorMarkVertical = css`
  width: 3px;
  height: 1px;
  right: 0;
`;

// 内向きメモリ用のスタイル
const majorMarkHorizontalInward = css`
  height: 6px;
  width: 1px;
  top: 0;
`;

const minorMarkHorizontalInward = css`
  height: 3px;
  width: 1px;
  top: 0;
`;

const majorMarkVerticalInward = css`
  width: 6px;
  height: 1px;
  left: 0;
`;

const minorMarkVerticalInward = css`
  width: 3px;
  height: 1px;
  left: 0;
`;

const rulerLabel = css`
  position: absolute;
  font-size: 8px;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  background-color: var(--color-background);
  padding: 0px 3px;
  text-align: center;
  vertical-align: middle;
  opacity: 0.75;
`;

const horizontalLabel = css`
  bottom: 0;
  transform: translateX(-50%);
  transform-origin: center center;
  line-height: 1;
`;

const verticalLabel = css`
  right: 0;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: center center;
  line-height: 1;
`;

// 内向きラベル用のスタイル
const horizontalLabelInward = css`
  transform: translateX(1px) translateY(-1px);
  transform-origin: center center;
  line-height: 1;
`;

const verticalLabelInward = css`
  transform: rotate(90deg) translateX(-7px);
  transform-origin: left bottom;
  line-height: 1;
`;

const toSnapshot = (rect: DOMRectReadOnly): RectSnapshot => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
});

const createRectSignal = (elementId: string) => {
  const [rect, setRect] = createSignal<RectSnapshot | null>(null);

  const attach = () => {
    const element = document.getElementById(elementId) as HTMLElement | null;
    if (!element) return false;

    const updateRect = () => setRect(toSnapshot(element.getBoundingClientRect()));
    const resizeHandler = () => updateRect();
    const scrollHandler = () => updateRect();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateRect) : null;
    observer?.observe(element);

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('scroll', scrollHandler, true);
    updateRect();

    onCleanup(() => {
      observer?.disconnect();
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('scroll', scrollHandler, true);
    });

    return true;
  };

  onMount(() => {
    if (attach()) return;

    let rafId: number | null = null;
    const retry = () => {
      if (attach()) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        return;
      }
      rafId = requestAnimationFrame(retry);
    };
    rafId = requestAnimationFrame(retry);
    onCleanup(() => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    });
  });

  return rect;
};

const emptyResult = (): RulerCalculationResult => ({
  horizontalMarks: [],
  verticalMarks: [],
  startCanvasX: 0,
  startCanvasY: 0,
  endCanvasX: 0,
  endCanvasY: 0,
});

const HorizontalRuler: Component<{ marks: RulerMark[] }> = (props) => {
  const isInward = () => globalConfig.editor.rulerMarkDirection === 'inward';

  return (
    <div class={horzRulerContainer}>
      <For each={props.marks}>
        {(mark) => (
          <>
            <div
              class={`${rulerMark} ${
                mark.isMajor
                  ? isInward()
                    ? majorMarkHorizontalInward
                    : majorMarkHorizontal
                  : isInward()
                    ? minorMarkHorizontalInward
                    : minorMarkHorizontal
              }`}
              style={{ left: `${mark.position}px` }}
            />
            {mark.isMajor && mark.label && (
              <div
                class={`${rulerLabel} ${isInward() ? horizontalLabelInward : horizontalLabel}`}
                style={{
                  left: `${mark.position}px`,
                  ...(isInward() ? {} : { bottom: '6px' }),
                }}
              >
                {mark.label}
              </div>
            )}
          </>
        )}
      </For>
    </div>
  );
};

const VerticalRuler: Component<{ marks: RulerMark[] }> = (props) => {
  const isInward = () => globalConfig.editor.rulerMarkDirection === 'inward';

  return (
    <div class={vertRulerContainer}>
      <For each={props.marks}>
        {(mark) => (
          <>
            <div
              class={`${rulerMark} ${
                mark.isMajor ? (isInward() ? majorMarkVerticalInward : majorMarkVertical) : isInward() ? minorMarkVerticalInward : minorMarkVertical
              }`}
              style={{ top: `${mark.position}px` }}
            />
            {mark.isMajor && mark.label && (
              <div
                class={`${rulerLabel} ${isInward() ? verticalLabelInward : verticalLabel}`}
                style={{
                  top: `${mark.position}px`,
                  ...(isInward() ? {} : { right: '6px' }),
                }}
              >
                {mark.label}
              </div>
            )}
          </>
        )}
      </For>
    </div>
  );
};

const rotationIndicator = css`
  position: absolute;
  top: 0;
  left: 16px;
  height: 16px;
  padding: 0 8px;
  background-color: var(--color-warning);
  color: var(--color-on-warning);
  font-size: 10px;
  line-height: 16px;
  white-space: nowrap;
  border-radius: 0 0 4px 0;
  opacity: 0.8;
  z-index: calc(var(--zindex-canvas-overlay) + 1);
`;

const Ruler: Component = () => {
  const canvasAreaRect = createRectSignal('canvas-area');
  const sectionsBetweenRect = createRectSignal('sections-between-area');

  const [rulerData, setRulerData] = createSignal<RulerCalculationResult>(emptyResult());

  let pendingContext: RulerCalculationContext | null = null;
  let rafId: number | null = null;

  const scheduleCalculation = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (!pendingContext) return;
      try {
        setRulerData(calculateRulerMarks(pendingContext));
      } catch (error) {
        logSystemWarn('Failed to calculate ruler marks.', { label: 'Ruler', details: [error] });
        setRulerData(emptyResult());
      }
    });
  };

  createEffect(() => {
    pendingContext = {
      zoom: interactStore.zoom,
      offsetX: interactStore.offset.x,
      offsetY: interactStore.offset.y,
      offsetOriginX: interactStore.offsetOrigin.x,
      offsetOriginY: interactStore.offsetOrigin.y,
      horizontalFlipped: interactStore.horizontalFlipped,
      verticalFlipped: interactStore.verticalFlipped,
      canvasWidth: canvasStore.canvas.width,
      canvasHeight: canvasStore.canvas.height,
      sectionsRect: sectionsBetweenRect(),
      canvasAreaRect: canvasAreaRect(),
    };
    scheduleCalculation();
  });

  onCleanup(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  });

  const isRotated = () => Math.abs(interactStore.rotation) > 0.1;

  return (
    <div class={rulerRoot} data-ruler-container>
      <HorizontalRuler marks={rulerData().horizontalMarks} />
      <VerticalRuler marks={rulerData().verticalMarks} />
    </div>
  );
};

export default Ruler;
