import { css } from '@acab/ecsstatic';
import { confirm } from '@tauri-apps/plugin-dialog';
import { FileInfo, stat } from '@tauri-apps/plugin-fs';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { adjustZoomToFit } from '~/features/canvas';
import { loadProjectFromLocation } from '~/routes/editor/load';
import { fileStore } from '~/stores/EditorStores';
import { normalizeJoin } from '~/utils/FileUtils';
import { revealInFileBrowser } from '~/utils/NativeOpener';
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
  opacity: 0.5;
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

const ProjectInfo: Component = () => {
  const [savedStat, setSavedStat] = createSignal<FileInfo>();

  onMount(async () => {
    const location = fileStore.savedLocation;
    if (location.path && location.name) {
      const path = normalizeJoin(location.path, location.name);
      const fileStat = await stat(path);
      setSavedStat(fileStat);
    }
  });

  const toReadableByteStr = (bytes: number): string => {
    const order = 1024;
    if (bytes > order ** 3) {
      return `${(bytes / order ** 3).toFixed(1)} GB`; // GB
    } else if (bytes > order ** 2) {
      return `${(bytes / order ** 2).toFixed(1)} MB`; // MB
    } else if (bytes > order ** 1) {
      return `${(bytes / order ** 1).toFixed(1)} KB`; // KB
    } else {
      return `${bytes.toFixed(1)} B`; // < 1KB
    }
  };

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
          <div class={locationRowStyle}>
            <p class={locationLabelStyle}>size</p>
            <Show when={savedStat()} fallback={<p class={placeholderStyle}></p>}>
              <p class={locationValueStyle}>{toReadableByteStr(savedStat()!.size)}</p>
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
                revealInFileBrowser(normalizeJoin(loc.path, loc.name));
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
                  await loadProjectFromLocation(fileStore.savedLocation);
                  adjustZoomToFit();
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

export default ProjectInfo;
