import { css } from '@acab/ecsstatic';
import { Component, createMemo, For } from 'solid-js';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import { calculateRulerMarks, RulerMark } from './RulerCalculator';

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

const Ruler: Component = () => {
  // キャンバス状態の変更を監視してマークを再計算
  const rulerData = createMemo(() => {
    // interactStoreとcanvasStoreの変更を明示的に監視
    const zoom = interactStore.zoom;
    const offset = interactStore.offset;
    const offsetOrigin = interactStore.offsetOrigin;
    const rotation = interactStore.rotation;
    const horizontalFlipped = interactStore.horizontalFlipped;
    const verticalFlipped = interactStore.verticalFlipped;
    const canvasWidth = canvasStore.canvas.width;
    const canvasHeight = canvasStore.canvas.height;
    // globalConfigの変更も監視（rulerMarkDirectionの変更で再描画）
    const rulerMarkDirection = globalConfig.editor.rulerMarkDirection;

    try {
      return calculateRulerMarks();
    } catch (error) {
      console.warn('Failed to calculate ruler marks:', error);
      return {
        horizontalMarks: [],
        verticalMarks: [],
        startCanvasX: 0,
        startCanvasY: 0,
        endCanvasX: 0,
        endCanvasY: 0,
      };
    }
  });

  return (
    <div class={rulerRoot} data-ruler-container>
      <HorizontalRuler marks={rulerData().horizontalMarks} />
      <VerticalRuler marks={rulerData().verticalMarks} />
      {/* <div class={intersectionContainer} /> */}
    </div>
  );
};

export default Ruler;
