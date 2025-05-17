import { Component, createSignal, Show } from 'solid-js';
import { rflItem, rflName, rflPath, rflThumb } from '~/styles/components/file_item/list.css';
import { FileItemProps } from './FileItemBase';

const ListFileItem: Component<FileItemProps> = (props) => {
  const [hovered, setHovered] = createSignal(false);
  const [pos, setPos] = createSignal({ x: 0, y: 0 });

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
        {props.file.name.substring(0, props.file.name.lastIndexOf('.'))}
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
            'z-index': '9999',
          }}
        >
          <Show when={props.thumbnail} fallback={<p>loading...</p>}>
            <Show when={props.thumbnail !== 'failed'} fallback={<p>NO IMAGE</p>}>
              <img src={props.thumbnail} width={150} height={150} />
            </Show>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default ListFileItem;
