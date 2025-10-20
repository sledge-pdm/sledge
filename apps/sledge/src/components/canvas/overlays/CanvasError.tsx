import { css } from '@acab/ecsstatic';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { eventBus, Events } from '~/utils/EventBus';

const errorLayout = css`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  pointer-events: all;
  background-color: #000000b0;
  /* backdrop-filter: blur(3px); */
  z-index: var(--zindex-canvas-error-overlay);
`;

const errorOverlayContent = css`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: end;
  width: 100%;
  height: 100%;
  gap: 16px;
  padding: 32px;
`;

const oops = css`
  font-family: ZFB21;
  font-size: 64px;
`;

const detail = css`
  font-size: 8px;
`;

const restartButton = css`
  white-space: nowrap;
  font-size: 16px;
  margin-top: 8px;
  padding: 5px 12px;
`;

const CanvasError: Component = () => {
  const [isPaused, setIsPaused] = createSignal(false);

  const handleRenderPaused = (e: Events['webgl:renderPaused']) => {
    setIsPaused(true);
  };

  onMount(() => {
    eventBus.on('webgl:renderPaused', handleRenderPaused);

    return () => {
      eventBus.off('webgl:renderPaused', handleRenderPaused);
    };
  });
  return (
    <Show when={isPaused()}>
      <div class={errorLayout}>
        <div class={errorOverlayContent}>
          <p class={oops}>OOPS!</p>
          <p class={detail}>Render Paused.</p>
          <button
            class={restartButton}
            onClick={() => {
              setIsPaused(false);
              eventBus.emit('webgl:requestResume', {});
            }}
          >
            Resume Rendering
          </button>
        </div>
      </div>
    </Show>
  );
};

export default CanvasError;
