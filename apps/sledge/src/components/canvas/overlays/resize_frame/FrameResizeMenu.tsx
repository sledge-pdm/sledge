import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, createSignal, Show } from 'solid-js';
import { changeCanvasSize } from '~/features/canvas';
import { interactStore, setInteractStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';

const frameContainer = css`
  display: flex;
  flex-direction: column;
`;

const frameSizeInfo = css`
  display: flex;
  flex-direction: column;
  padding: 12px;
`;

const frameActions = css`
  display: flex;
  flex-direction: row;
`;

const FrameResizeMenu: Component = () => {
  return (
    <div class={frameContainer}>
      <div class={frameSizeInfo}>
        <p style={{ 'font-size': '8px', color: 'white' }}>new canvas size.</p>
        <p style={{ 'font-size': '16px', color: 'white' }}>
          {interactStore.canvasSizeFrameSize.width} x {interactStore.canvasSizeFrameSize.height}
        </p>
      </div>
      <div class={frameActions}>
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
            const res = changeCanvasSize(newSize, offset, { x: 0, y: 0 }, false);
            console.log(res);
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
  );
};

const itemContainer = css`
  display: flex;
  flex-direction: row;
  padding: 8px;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  pointer-events: all;
  z-index: var(--zindex-canvas-overlay);
`;

const dividerStyle = css`
  width: 1px;
  margin-top: 4px;
  margin-bottom: 4px;
  box-sizing: content-box;
  background-color: #ffffff80;
`;

interface ItemProps {
  src: string;
  label?: string;
  title?: string;
  onClick?: () => void;
}

const Item: Component<ItemProps> = (props) => {
  const [hover, setHover] = createSignal(false);
  return (
    <div class={itemContainer} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={props.onClick} title={props.title}>
      <Icon src={props.src} color={hover() ? color.enabled : 'white'} base={10} />
      <Show when={props.label}>
        <p style={{ color: hover() ? color.enabled : 'white' }}>{props.label}</p>
      </Show>
    </div>
  );
};
const Divider: Component = () => {
  return <div class={dividerStyle} />;
};

export default FrameResizeMenu;
