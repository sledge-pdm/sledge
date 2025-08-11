import { vars } from '@sledge/theme';
import { Component, createSignal, Show } from 'solid-js';
import { rflItem, rflName, rflPath, rflThumb } from '~/styles/components/file_item/list.css';
import { FileItemProps } from './FileItemBase';

const ListFileItem: Component<FileItemProps> = (props) => {
  const [hovered, setHovered] = createSignal(false);
  const [pos, setPos] = createSignal({ x: 0, y: 0 });

  const transparent_bg_color = '#00000010';
  const gridSize = () => 10;

  return (
    <div class={rflItem}>
      <a
        class={rflName}
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
      <p class={rflPath}>{props.file.path}</p>
      <Show when={hovered()}>
        <div
          class={rflThumb}
          style={{
            position: 'fixed',
            top: `${pos().y}px`,
            left: `${pos().x}px`,
            'image-rendering': 'pixelated',
            'pointer-events': 'none',
            'background-color': vars.color.canvas,
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
                <img
                  style={{
                    'max-width': '100%',
                    height: 'auto',
                    'object-fit': 'cover',
                  }}
                  src={props.thumbnail}
                />
              </Show>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ListFileItem;
