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
import { join } from '~/utils/FileUtils';

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
  padding: 4px 4px;
  border-left: 1px solid var(--color-border);
  cursor: pointer;
  &:hover {
    background-color: var(--color-button-hover);
  }
`;

const autoSaveProgressBar = css`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--color-accent);
  opacity: 0.25;
  pointer-events: none;
`;

const SaveSection: Component = () => {
  const [isSaveMenuShown, setIsSaveMenuShown] = createSignal(false);
  const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);
  const isOWPossible = () =>
    fileStore.savedLocation.name !== undefined && fileStore.savedLocation.path !== undefined && fileStore.openAs === 'project';

  const save = async () => {
    await saveProject(fileStore.savedLocation.name, fileStore.savedLocation.path);
  };

  const getSaveTimeText = () => {
    const lastSavedAt = projectStore.lastSavedAt;
    if (lastSavedAt) {
      var seconds = Math.floor((new Date().getTime() - lastSavedAt.getTime()) / 1000);

      var interval = seconds / 31536000;
      if (interval > 1) {
        return Math.floor(interval) + ' years ago';
      }
      interval = seconds / 2592000;
      if (interval > 1) {
        return Math.floor(interval) + ' months ago';
      }
      interval = seconds / 86400;
      if (interval > 1) {
        return Math.floor(interval) + ' days ago';
      }
      interval = seconds / 3600;
      if (interval > 1) {
        return Math.floor(interval) + ' hours ago';
      }
      interval = seconds / 60;
      if (interval > 1) {
        return Math.floor(Math.floor(interval) / 10) * 10 + ' min ago';
      }
      if (seconds < 10) {
        return 'just now';
      }
      return Math.floor(Math.floor(seconds) / 10) * 10 + ' sec ago';
    }

    // return 'not saved yet.';
    return '';
  };

  const [saveTimeText, setSaveTimeText] = createSignal(getSaveTimeText());

  const setTimeredSaveLog = (text: string) => {
    setSaveLog(text);
    makeTimer(
      () => {
        setSaveLog(undefined);
      },
      3000,
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

    const interval = setInterval(() => {
      setSaveTimeText(getSaveTimeText());
    }, 1000);

    return () => clearInterval(interval);
  });

  createEffect(() => {
    projectStore.lastSavedAt;
    setSaveTimeText(getSaveTimeText());
  });

  const saveMenu = createMemo<MenuListOption[]>(() => [
    { label: 'Save As...', onSelect: async () => await saveProject(), color: color.onBackground },
    {
      label: 'Open Saved Folder',
      onSelect: () => {
        if (!fileStore.savedLocation.path || !fileStore.savedLocation.name) return;
        revealItemInDir(join(fileStore.savedLocation.path, fileStore.savedLocation.name));
      },
      disabled: !fileStore.savedLocation.path || !fileStore.savedLocation.name,
      color: color.onBackground,
    },
  ]);

  // const [iconSrc, setIconSrc] = createSignal<string | undefined>(undefined);

  const [autoSaveIntervalRatio, setAutoSaveIntervalRatio] = createSignal<number>(0);

  onMount(() => {
    makeTimer(
      () => {
        if (!projectStore.autoSaveEnabled || !projectStore.autoSaveInterval || !projectStore.lastSavedAt) {
          setAutoSaveIntervalRatio(0);
          return;
        }
        const diffSec = (new Date().getTime() - projectStore.lastSavedAt.getTime()) / 1000;

        const intervalRatio = diffSec / projectStore.autoSaveInterval;
        setAutoSaveIntervalRatio(intervalRatio);

        //     if (diffSec < 3) {
        //       setIconSrc('/icons/progress/circle_check.png');
        //       return;
        //     }

        //     if (intervalRatio < 1 / 8) {
        //       setIconSrc('/icons/progress/circle_0.png');
        //     } else if (intervalRatio < 2 / 8) {
        //       setIconSrc('/icons/progress/circle_1.png');
        //     } else if (intervalRatio < 3 / 8) {
        //       setIconSrc('/icons/progress/circle_2.png');
        //     } else if (intervalRatio < 4 / 8) {
        //       setIconSrc('/icons/progress/circle_3.png');
        //     } else if (intervalRatio < 5 / 8) {
        //       setIconSrc('/icons/progress/circle_4.png');
        //     } else if (intervalRatio < 6 / 8) {
        //       setIconSrc('/icons/progress/circle_5.png');
        //     } else if (intervalRatio < 7 / 8) {
        //       setIconSrc('/icons/progress/circle_6.png');
        //     } else if (intervalRatio < 8 / 8) {
        //       setIconSrc('/icons/progress/circle_7.png');
        //     }
      },
      100,
      setInterval
    );
  });

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
              // 'text-transform': 'uppercase',
              // 'margin-top': '1px',
              // 'font-family': ZFB09,
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
        <div
          class={autoSaveProgressBar}
          style={{
            width: `${autoSaveIntervalRatio() * 100}%`,
          }}
        />
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

      {/* <Show when={projectStore.autoSaveEnabled && fileStore.savedLocation.name && fileStore.savedLocation.path && projectStore.lastSavedAt}>
        <div style={{ opacity: 0.3 }}>
          <Icon src={iconSrc() ?? ''} color={color.onBackground} base={12} scale={1} />
        </div>
      </Show> */}
    </div>
  );
};

export default SaveSection;
