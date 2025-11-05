import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import { projectHistoryController } from '~/features/history';

import { css } from '@acab/ecsstatic';
import FrameResizeMenu from '~/components/canvas/overlays/resize_frame/FrameResizeMenu';
import { interactStore } from '~/stores/EditorStores';
import { layerListStore } from '~/stores/ProjectStores';

const topRightNav = css`
  display: flex;
  flex-direction: row;
  gap: 36px;
  padding: 36px;
  position: absolute;
  right: 0px;
  top: 0px;
`;

const undoRedoContainer = css`
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: center;
  padding: 12px;
  z-index: var(--zindex-canvas-overlay);
  pointer-events: auto;
`;

const undoIcon = css`
  display: flex;
  flex-direction: column;
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
  shape-rendering: crispEdges;
  align-content: center;
  align-items: center;
  backdrop-filter: invert();
`;

const redoIcon = css`
  display: flex;
  flex-direction: column;
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
  shape-rendering: crispEdges;
  align-content: center;
  align-items: center;
  backdrop-filter: invert();
`;

const bottomRightNav = css`
  display: flex;
  flex-direction: row;
  position: absolute;
  background-color: #000000a0;
  border: 1px solid var(--color-border);
  right: 8px;
  bottom: 8px;
`;

const CanvasControls: Component = () => {
  const [activeCanUndo, setActiveCanUndo] = createSignal(projectHistoryController.canUndo());
  const [activeCanRedo, setActiveCanRedo] = createSignal(projectHistoryController.canRedo());

  onMount(() => {
    const dispose = projectHistoryController.onChange((state) => {
      setActiveCanUndo(state.canUndo);
      setActiveCanRedo(state.canRedo);
    });
    return () => dispose();
  });

  createEffect(() => {
    layerListStore.activeLayerId;

    // keep effect to refresh when active layer changes, but values come from projectHistory
    setActiveCanUndo(projectHistoryController.canUndo());
    setActiveCanRedo(projectHistoryController.canRedo());
  });
  return (
    <>
      <div class={topRightNav}>
        <svg width='0' height='0'>
          <defs>
            <clipPath id='clipPath-undo'>
              <path
                d='M 2 5 L 3 5 L 3 4 L 1 4 L 1 3 L 0 3 L 0 2 L 1 2 L 1 1 L 3 1 L 3 0 L 2 0 L 2 2 L 7 2 L 7 8 L 1 8 L 1 7 L 8 7 L 8 3 L 2 3 L 2 5 Z'
                // d='M 20 50 L 30 50 L 30 40 L 10 40 L 10 30 L 0 30 L 0 20 L 10 20 L 10 10 L 30 10 L 30 0 L 20 0 L 20 20 L 70 20 L 70 80 L 10 80 L 10 70 L 80 70 L 80 30 L 20 30 L 20 50 Z'
                fill='black'
                transform='scale(2)'
              />
            </clipPath>

            <clipPath id='clipPath-redo'>
              <path
                d='M 5 1 L 7 1 L 7 2 L 8 2 L 8 3 L 7 3 L 7 4 L 5 4 L 5 5 L 6 5 L 6 3 L 0 3 L 0 7 L 7 7 L 7 8 L 1 8 L 1 2 L 6 2 L 6 0 L 5 0 L 5 1 Z'
                // d='M 50 10 L 70 10 L 70 20 L 80 20 L 80 30 L 70 30 L 70 40 L 50 40 L 50 50 L 60 50 L 60 30 L 0 30 L 0 70 L 70 70 L 70 80 L 10 80 L 10 20 L 60 20 L 60 0 L 50 0 L 50 10 Z'
                fill='black'
                transform='scale(2)'
              />
            </clipPath>
          </defs>
        </svg>
        <div
          class={undoRedoContainer}
          style={{
            cursor: activeCanUndo() ? 'pointer' : 'unset',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            projectHistoryController.undo();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
          }}
        >
          <div
            class={undoIcon}
            style={{
              'clip-path': 'url(#clipPath-undo)',
              opacity: activeCanUndo() ? '1.0' : '0.3',
            }}
          />
        </div>
        <div
          class={undoRedoContainer}
          style={{
            cursor: activeCanRedo() ? 'pointer' : 'unset',
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            projectHistoryController.redo();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
          }}
        >
          <div
            class={redoIcon}
            style={{
              'clip-path': 'url(#clipPath-redo)',
              opacity: activeCanRedo() ? '1.0' : '0.3',
            }}
          />
        </div>
      </div>
      <Show when={interactStore.isCanvasSizeFrameMode}>
        <div class={bottomRightNav} style={{ 'z-index': 'var(--zindex-canvas-overlay)' }}>
          <FrameResizeMenu />
        </div>
      </Show>
    </>
  );
};

export default CanvasControls;
