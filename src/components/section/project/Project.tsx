import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge-pdm/core';
import { Nothing } from '@sledge-pdm/ui';
import { Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import SectionItem from '~/components/section/SectionItem';
import { ioStore } from '~/stores/EditorStores';
import { eventBus, Events } from '~/utils/EventBus';
import { normalizeJoin } from '~/utils/FileUtils';
import { revealInFileBrowser } from '~/utils/NativeOpener';
import { FileInfo, fs } from '~/utils/platform';
import { sectionContent } from '../SectionStyles';

const projectContentStyle = css`
  margin-top: 16px;
`;
const locationGrid = css`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 16px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const locationLabelStyle = css`
  font-family: ZFB03;
  opacity: 0.8;
`;

const locationValueStyle = css`
  overflow-wrap: break-word;
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  text-align: left;
  cursor: pointer;
`;

const Project: Component = () => {
  const [savedStat, setSavedStat] = createSignal<FileInfo>();

  const updateStat = async (location: FileLocation) => {
    if (location.path && location.name) {
      const path = normalizeJoin(location.path, location.name);
      const fileStat = await fs.stat(path);
      setSavedStat(fileStat);
    }
  };

  const onProjectSaved = (e: Events['project:saved']) => {
    updateStat(e.location);
  };

  onMount(async () => {
    const location = ioStore.savedLocation;
    await updateStat(location);

    eventBus.on('project:saved', onProjectSaved);
  });

  onCleanup(() => {
    eventBus.off('project:saved', onProjectSaved);
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
      return `${bytes.toFixed(1)} Byte`; // < 1KB
    }
  };

  const openFolderInExplorer = () => {
    const loc = ioStore.savedLocation;
    if (!loc || !loc.path) return;
    revealInFileBrowser(normalizeJoin(loc.path));
  };

  const revealFileInExplorer = () => {
    const loc = ioStore.savedLocation;
    if (!loc || !loc.path || !loc.name) return;
    revealInFileBrowser(normalizeJoin(loc.path, loc.name));
  };

  return (
    <SectionItem title='project.'>
      <div class={`${sectionContent} ${projectContentStyle}`}>
        <Show when={ioStore.savedLocation.name} fallback={<Nothing>unsaved project.</Nothing>}>
          <div class={locationGrid}>
            <p class={locationLabelStyle}>path</p>
            <Show when={ioStore.savedLocation.path} fallback={<Nothing>unknown.</Nothing>}>
              <button type='button' class={locationValueStyle} onClick={() => openFolderInExplorer()} title={'click to open in explorer.'}>
                {ioStore.savedLocation.path || '<unknown>'}
              </button>
            </Show>
            <p class={locationLabelStyle}>file</p>
            <Show when={ioStore.savedLocation.name} fallback={<Nothing>unknown.</Nothing>}>
              <button type='button' class={locationValueStyle} onClick={() => revealFileInExplorer()} title={'click to open in explorer.'}>
                {ioStore.savedLocation.name || '<unknown>'}
              </button>
            </Show>
            <p class={locationLabelStyle}>size</p>
            <Show when={savedStat()} fallback={<Nothing>unknown.</Nothing>}>
              <p>{toReadableByteStr(savedStat()!.size ?? 0)}</p>
            </Show>
          </div>
        </Show>
      </div>
    </SectionItem>
  );
};

export default Project;
