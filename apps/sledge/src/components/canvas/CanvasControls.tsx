import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import { projectHistoryController } from '~/features/history';

import { css } from '@acab/ecsstatic';
import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Consts } from '~/Consts';
import { CanvasSizeHistoryAction } from '~/features/history/actions/CanvasSizeHistoryAction';
import { allLayers } from '~/features/layer';
import { getAnvilOf } from '~/features/layer/anvil/AnvilManager';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore, layerListStore, setCanvasStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
// no longer relying on layerHistory:changed; use projectHistoryController.onChange

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
  width: 8px;
  height: 8px;
  image-rendering: pixelated;
  shape-rendering: geometricPrecision;
  align-content: center;
  align-items: center;
  backdrop-filter: invert();
  scale: 2;
`;

const redoIcon = css`
  display: flex;
  flex-direction: column;
  width: 8px;
  height: 8px;
  image-rendering: pixelated;
  shape-rendering: geometricPrecision;
  align-content: center;
  align-items: center;
  backdrop-filter: invert();
  scale: 2;
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

const flexCol = css`
  display: flex;
  flex-direction: column;
`;

const flexRow = css`
  display: flex;
  flex-direction: row;
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

  const [isTempControlMenuOpen, setIsTempControlMenuOpen] = createSignal<boolean>(false);
  return (
    <>
      <div class={topRightNav}>
        <svg width='0' height='0'>
          <defs>
            <clipPath id='clipPath-undo'>
              <path
                d='M 2 5 L 3 5 L 3 4 L 1 4 L 1 3 L 0 3 L 0 2 L 1 2 L 1 1 L 3 1 L 3 0 L 2 0 L 2 2 L 7 2 L 7 8 L 1 8 L 1 7 L 8 7 L 8 3 L 2 3 L 2 5 Z'
                fill='black'
              />
            </clipPath>

            <clipPath id='clipPath-redo'>
              <path
                d='M 5 1 L 7 1 L 7 2 L 8 2 L 8 3 L 7 3 L 7 4 L 5 4 L 5 5 L 6 5 L 6 3 L 0 3 L 0 7 L 7 7 L 7 8 L 1 8 L 1 2 L 6 2 L 6 0 L 5 0 L 5 1 Z'
                fill='black'
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
        {/* <div class={topLeftNav}>
          <div class={flexCol}>
            <p style={{ color: vars.color.accent, 'font-size': '16px' }}>FRAME MODE.</p>
          </div>
        </div> */}

        <div class={bottomRightNav} style={{ 'z-index': Consts.zIndex.canvasOverlay }}>
          <div class={flexCol}>
            <div class={flexCol} style={{ padding: '12px' }}>
              <p style={{ 'font-size': '8px', color: 'white' }}>new canvas size.</p>
              <p style={{ 'font-size': '16px', color: 'white' }}>
                {interactStore.canvasSizeFrameSize.width} x {interactStore.canvasSizeFrameSize.height}
              </p>
            </div>
            <div class={flexRow}>
              <Item
                src='/icons/selection/commit_10.png'
                onClick={() => {
                  const targetW = interactStore.canvasSizeFrameSize.width;
                  const targetH = interactStore.canvasSizeFrameSize.height;
                  if (!targetW || !targetH) return;
                  const offset = interactStore.canvasSizeFrameOffset; // (startX, startY) フレーム左上（旧キャンバス座標）
                  const oldSize = { ...canvasStore.canvas };
                  const newSize = { width: targetW, height: targetH };
                  if (oldSize.width === newSize.width && oldSize.height === newSize.height && offset.x === 0 && offset.y === 0) {
                    setInteractStore('isCanvasSizeFrameMode', false);
                    return; // no-op
                  }

                  // CanvasSizeHistoryAction uses the "current" canvas size and buffer as an old state, so must be called before resizing buffers.
                  const act = new CanvasSizeHistoryAction(oldSize, newSize, { from: 'CanvasControls.frameCommit' });
                  act.registerBefore();

                  setCanvasStore('canvas', newSize);
                  eventBus.emit('canvas:sizeChanged', { newSize });

                  const startX = offset.x;
                  const startY = offset.y;
                  for (const l of allLayers()) {
                    const anvil = getAnvilOf(l.id)!;
                    anvil.resizeWithOffset(newSize, {
                      srcOrigin: { x: startX, y: startY },
                      destOrigin: { x: 0, y: 0 },
                    });
                    eventBus.emit('webgl:requestUpdate', { onlyDirty: false, context: 'CanvasControls.frameCommit' });
                    eventBus.emit('preview:requestUpdate', { layerId: l.id });
                  }

                  act.registerAfter();

                  projectHistoryController.addAction(act);
                  setInteractStore('isCanvasSizeFrameMode', false);
                  setInteractStore('canvasSizeFrameOffset', { x: 0, y: 0 });
                  setInteractStore('canvasSizeFrameSize', { width: 0, height: 0 });
                }}
                label='commit.'
                title='commit.'
              />
              <Divider />
              <Item
                src='/icons/selection/cancel_10.png'
                onClick={() => {
                  setInteractStore('isCanvasSizeFrameMode', false);
                }}
                label='cancel.'
                title='cancel.'
              />
            </div>
          </div>
        </div>
      </Show>
    </>
  );
};

interface ItemProps {
  src: string;
  label?: string;
  title?: string;
  onClick?: () => void;
}

const Item: Component<ItemProps> = (props) => {
  const [hover, setHover] = createSignal(false);
  return (
    <div
      class={flexRow}
      style={{
        padding: '8px',
        gap: '8px',
        'align-items': 'center',
        cursor: 'pointer',
        'pointer-events': 'all',
        'z-index': Consts.zIndex.canvasOverlay,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={props.onClick}
      title={props.title}
    >
      <Icon src={props.src} color={hover() ? vars.color.enabled : 'white'} base={10} />
      <Show when={props.label}>
        <p style={{ color: hover() ? vars.color.enabled : 'white' }}>{props.label}</p>
      </Show>
    </div>
  );
};
const Divider: Component = () => {
  return (
    <div
      style={{
        width: '1px',
        'margin-top': '4px',
        'margin-bottom': '4px',
        'box-sizing': 'content-box',
        'background-color': '#ffffff80',
      }}
    />
  );
};

export default CanvasControls;
