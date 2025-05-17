import { Component, Show } from 'solid-js';
import { recentFilesItem, recentFilesName, recentFilesPath, recentFilesThumb } from '~/routes/start.css';
import { flexRow } from '~/styles/snippets.css';
import { FileLocation } from '~/types/FileLocation';
import { Consts } from '~/utils/consts';

export interface FileItemProps {
  thumbnail: string;
  onClick: (file: FileLocation) => void;
  file: FileLocation;
}

const StandardFileItem: Component<FileItemProps> = (props) => {
  return (
    <div class={recentFilesItem}>
      <div class={recentFilesThumb}>
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
          class={recentFilesName}
          onClick={(e) => {
            if (props.onClick) props.onClick(props.file);
          }}
        >
          {props.file.name.substring(0, props.file.name.lastIndexOf('.'))}
        </a>
      </div>
      <p class={recentFilesPath}>{props.file.path}</p>
    </div>
  );
};

export default StandardFileItem;
