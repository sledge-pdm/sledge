import { Component, Show } from 'solid-js';
import { Consts } from '~/models/Consts';
import { rfsItem, rfsName, rfsPath, rfsThumb } from '~/styles/components/file_item/standard.css';
import { flexRow } from '~/styles/snippets.css';
import { FileItemProps } from './FileItemBase';

const StandardFileItem: Component<FileItemProps> = (props) => {
  return (
    <div class={rfsItem}>
      <div class={rfsThumb}>
        <Show when={props.thumbnail} fallback={<p>loading...</p>}>
          <Show when={props.thumbnail !== 'failed'} fallback={<p>NO IMAGE</p>}>
            <img
              src={props.thumbnail}
              width={Consts.projectThumbnailSize}
              height={Consts.projectThumbnailSize}
              style={{ 'image-rendering': 'pixelated' }}
            />
          </Show>
        </Show>
      </div>
      <div class={flexRow}>
        <a
          class={rfsName}
          onClick={(e) => {
            if (props.onClick) props.onClick(props.file);
          }}
        >
          {props.file.name.substring(0, props.file.name.lastIndexOf('.'))}
        </a>
      </div>
      <p class={rfsPath}>{props.file.path}</p>
    </div>
  );
};

export default StandardFileItem;
