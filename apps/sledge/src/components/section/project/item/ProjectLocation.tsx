import { css } from '@acab/ecsstatic';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, Show } from 'solid-js';
import { openExistingProject } from '~/features/io/window';
import { fileStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/ProjectStores';
import { normalizeJoin } from '~/utils/FileUtils';
import { sectionSubCaption, sectionSubContent } from '../../SectionStyles';

const locationHeaderStyle = css`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: space-between;
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

const reopenProjectLink = css`
  font-family: ZFB03B;
  opacity: 0.75;
`;

const explorerLinkStyle = css`
  color: var(--color-muted);
  text-decoration: none;
  font-family: ZFB08;
`;

const linksContainer = css`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 4px;
`;

const ProjectLocation: Component = () => {
  return (
    <>
      <div class={locationHeaderStyle}>
        <p class={sectionSubCaption}>Location.</p>
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

        <div class={linksContainer}>
          <Show when={fileStore.savedLocation.name && fileStore.savedLocation.path}>
            <a
              href='#'
              onClick={(e) => {
                const loc = fileStore.savedLocation;
                if (!loc || !loc.path || !loc.name) return;
                revealItemInDir(normalizeJoin(loc.path, loc.name));
              }}
              class={explorerLinkStyle}
            >
              Open in Explorer
            </a>
            <a
              class={reopenProjectLink}
              title={'reopen project'}
              onClick={async () => {
                const confirmed = await confirm(`Sure to reopen this project?
Unsaved changes will be discarded!`);
                if (confirmed) {
                  await openExistingProject(fileStore.savedLocation);
                  // clear dirty and close
                  setProjectStore('isProjectChangedAfterSave', false);
                  getCurrentWindow().close();
                }
              }}
            >
              reopen project.
            </a>
          </Show>
        </div>
      </div>
    </>
  );
};

export default ProjectLocation;
