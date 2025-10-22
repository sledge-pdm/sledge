import { css } from '@acab/ecsstatic';
import { color } from '@sledge/theme';
import { Icon, MenuList, MenuListOption } from '@sledge/ui';
import { makeTimer } from '@solid-primitives/timer';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, createEffect, createMemo, createSignal, onMount, Show } from 'solid-js';
import { saveProject } from '~/features/io/project/out/save';
import { fileStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/ProjectStores';
import { eventBus } from '~/utils/EventBus';
import { normalizeJoin } from '~/utils/FileUtils';
import { useTimeAgoText } from '~/utils/TimeUtils';

const saveSectionContainer = css`
  display: flex;
  flex-direction: row;
  position: relative;
  align-items: center;
  overflow: visible;
  gap: 8px;
  pointer-events: all;
`;

const saveButtonRoot = css`
  display: flex;
  flex-direction: row;
  position: relative;
  border-radius: 4px;
  border: 1px solid var(--color-accent);
  overflow: hidden;
  margin: 0;
  margin-left: 4px;
`;

const saveButtonMainButton = css`
  display: flex;
  flex-direction: row;
  padding: 4px 12px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: all;
  &:hover {
    background-color: var(--color-button-hover);
  }
`;

const saveButtonSide = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  border-left: 1px solid var(--color-border);
  cursor: pointer;
  &:hover {
    background-color: var(--color-button-hover);
  }
`;

const SaveSection: Component = () => {
  const [isSaveMenuShown, setIsSaveMenuShown] = createSignal(false);
  const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);
  const isOWPossible = () =>
    fileStore.savedLocation.name !== undefined && fileStore.savedLocation.path !== undefined && fileStore.openAs === 'project';

  const save = async () => {
    await saveProject(fileStore.savedLocation.name, fileStore.savedLocation.path);
  };

  const { saveTimeText, updatePastTimeStamp } = useTimeAgoText(projectStore.lastSavedAt?.getTime());

  createEffect(() => {
    updatePastTimeStamp(projectStore.lastSavedAt?.getTime());
  });

  const setTimeredSaveLog = (text: string) => {
    setSaveLog(text);
    makeTimer(
      () => {
        setSaveLog(undefined);
      },
      2000,
      setTimeout
    );
  };

  onMount(() => {
    eventBus.on('project:saved', () => {
      console.log('project saved!');
      setTimeredSaveLog('saved!');
    });

    eventBus.on('project:saveFailed', () => {
      setTimeredSaveLog('save failed.');
    });

    eventBus.on('project:saveCancelled', () => {
      setTimeredSaveLog('save cancelled.');
    });
  });

  const saveMenu = createMemo<MenuListOption[]>(() => [
    {
      type: 'item',
      label: 'Save As...',
      onSelect: async () => await saveProject(),
      color: color.onBackground,
    },
    {
      type: 'item',
      label: 'Open Saved Folder',
      onSelect: () => {
        if (!fileStore.savedLocation.path || !fileStore.savedLocation.name) return;
        revealItemInDir(normalizeJoin(fileStore.savedLocation.path, fileStore.savedLocation.name));
      },
      disabled: !fileStore.savedLocation.path || !fileStore.savedLocation.name,
      color: color.onBackground,
    },
  ]);

  return (
    <div class={saveSectionContainer} data-tauri-drag-region-exclude>
      <Show when={saveLog()} fallback={<p style={{ 'white-space': 'nowrap', opacity: 0.6 }}>{saveTimeText()}</p>}>
        <p style={{ 'white-space': 'nowrap', opacity: 0.8 }}>{saveLog()}</p>
      </Show>
      <div class={saveButtonRoot} data-tauri-drag-region-exclude>
        <div class={saveButtonMainButton} onClick={async () => await save()}>
          <p
            style={{
              color: color.accent,
              'white-space': 'nowrap',
            }}
          >
            {isOWPossible() ? 'save' : 'save (new)'}
          </p>
        </div>
        <div class={saveButtonSide} onClick={() => setIsSaveMenuShown(!isSaveMenuShown())}>
          <div
            style={{
              transform: isSaveMenuShown() ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <Icon src={'/icons/misc/triangle_5.png'} color={color.onBackground} base={5} scale={1} />
          </div>
        </div>
        {/* <div
          class={autoSaveProgressBar}
          style={{
            width: `${autoSnapshotIntervalRatio() * 100}%`,
          }}
        /> */}
      </div>

      <Show when={isSaveMenuShown()}>
        <MenuList
          options={saveMenu()}
          onClose={() => setIsSaveMenuShown(false)}
          align={'right'}
          style={{
            'margin-top': '4px',
            'border-color': color.onBackground,
            'border-radius': '4px',
          }}
        />
      </Show>

      {/* <Show when={projectStore.autoSnapshotEnabled && fileStore.savedLocation.name && fileStore.savedLocation.path && projectStore.lastSavedAt}>
        <div style={{ opacity: 0.3 }}>
          <Icon src={iconSrc() ?? ''} color={color.onBackground} base={12} scale={1} />
        </div>
      </Show> */}
    </div>
  );
};

export default SaveSection;
