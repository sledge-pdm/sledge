import { css } from '@acab/ecsstatic';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, Show } from 'solid-js';
import { fileStore } from '~/stores/EditorStores';
import { join } from '~/utils/FileUtils';
import { sectionSubCaption, sectionSubContent } from '../../SectionStyles';

const locationHeaderStyle = css`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: space-between;
`;

const explorerLinkStyle = css`
  color: var(--color-muted);
  text-decoration: none;
  font-family: ZFB03;
`;

const locationInfoStyle = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
`;

const locationRowStyle = css`
  display: flex;
`;

const locationLabelStyle = css`
  font-family: ZFB03;
  width: 40px;
  font-size: 8px;
`;

const locationValueStyle = css`
  white-space: wrap;
`;

const placeholderStyle = css`
  font-family: ZFB09;
  opacity: 0.3;
`;

const ProjectLocation: Component = () => {
  return (
    <>
      <div class={locationHeaderStyle}>
        <p class={sectionSubCaption}>Location.</p>

        <Show when={fileStore.savedLocation.name && fileStore.savedLocation.path}>
          <a
            href='#'
            onClick={(e) => {
              const loc = fileStore.savedLocation;
              if (!loc || !loc.path || !loc.name) return;
              revealItemInDir(join(loc.path, loc.name));
            }}
            class={explorerLinkStyle}
          >
            Open in Explorer
          </a>
        </Show>
      </div>
      <div class={sectionSubContent}>
        <div class={locationInfoStyle}>
          <div class={locationRowStyle}>
            <p class={locationLabelStyle}>path</p>
            <Show when={fileStore.savedLocation.path} fallback={<p class={placeholderStyle}></p>}>
              <p class={locationValueStyle}>{fileStore.savedLocation.path || '<unknown>'}</p>
            </Show>
          </div>
          <div class={locationRowStyle}>
            <p class={locationLabelStyle}>file</p>
            <Show when={fileStore.savedLocation.name} fallback={<p class={placeholderStyle}>[ unsaved project ]</p>}>
              <p class={locationValueStyle}>{fileStore.savedLocation.name || '<unknown>'}</p>
            </Show>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectLocation;
