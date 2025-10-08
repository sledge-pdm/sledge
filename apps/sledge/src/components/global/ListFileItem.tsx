import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge/core';
import { Component, createSignal, Show } from 'solid-js';

const thumb = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  max-width: 150px;
  max-height: 150px;
  overflow: hidden;
  opacity: 0.8;
  position: fixed;
  image-rendering: pixelated;
  pointer-events: none;
  background-color: var(--color-canvas);
`;

const thumbImg = css`
  max-width: 100%;
  height: auto;
  object-fit: cover;
`;

const item = css`
  position: relative;
  width: fit-content;
  padding: var(--spacing-sm);
  margin-left: -8px;
`;

const name = css`
  font-family: ZFB09;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const path = css`
  font-family: ZFB03B;
  font-size: var(--text-md);
  opacity: 0.4;
`;

export interface FileItemProps {
  thumbnail: string;
  onClick: (file: FileLocation) => void;
  file: FileLocation;
}

const ListFileItem: Component<FileItemProps> = (props) => {
  const [hovered, setHovered] = createSignal(false);
  const [pos, setPos] = createSignal({ x: 0, y: 0 });

  const transparent_bg_color = '#00000010';
  const gridSize = () => 10;

  return (
    <div class={item}>
      <a
        class={name}
        onClick={(e) => {
          if (props.onClick) props.onClick(props.file);
        }}
        onMouseEnter={(e) => {
          setHovered(true);
          setPos({ x: e.clientX + 12, y: e.clientY + 12 });
        }}
        onMouseMove={(e) => {
          setPos({ x: e.clientX + 12, y: e.clientY + 12 });
        }}
        onMouseLeave={() => setHovered(false)}
      >
        {props.file.name?.substring(0, props.file.name.lastIndexOf('.'))}
      </a>
      <p class={path}>{props.file.path}</p>
      <Show when={hovered()}>
        <div
          class={thumb}
          style={{
            top: `${pos().y}px`,
            left: `${pos().x}px`,
          }}
        >
          <div
            style={{
              'background-image':
                `linear-gradient(45deg, ${transparent_bg_color} 25%, transparent 25%, transparent 75%, ${transparent_bg_color} 75%),` +
                `linear-gradient(45deg, ${transparent_bg_color} 25%, transparent 25%, transparent 75%, ${transparent_bg_color} 75%)`,
              'background-size': `${gridSize() * 2}px ${gridSize() * 2}px`,
              'background-position': `0 0, ${gridSize()}px ${gridSize()}px`,
            }}
          >
            <Show when={props.thumbnail} fallback={<p>loading...</p>}>
              <Show when={props.thumbnail !== 'failed'} fallback={<p>NO IMAGE</p>}>
                <img class={thumbImg} src={props.thumbnail} />
              </Show>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ListFileItem;
