import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Icon, MenuList, MenuListOption } from '@sledge/ui';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import { saveProject } from '~/io/project/out/save';
import { fileStore, setFileStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/ProjectStores';
import { saveButtonMainButton, saveButtonRoot, saveButtonSide } from '~/styles/globals/save_section.css';
import { eventBus } from '~/utils/EventBus';

const SaveSection: Component = () => {
  const [isSaveMenuShown, setIsSaveMenuShown] = createSignal(false);
  const [saveLog, setSaveLog] = createSignal<string | undefined>(undefined);
  const isOWPossible = () => fileStore.location.name !== undefined && fileStore.location.path !== undefined;

  const save = (forceNew?: boolean) => {
    setFileStore('location', 'name', fileStore.location.name);
    saveProject(fileStore.location.name, forceNew ? undefined : fileStore.location.path);
  };

  const getSaveTimeText = () => {
    const lastSavedAt = projectStore.lastSavedAt;
    if (lastSavedAt) {
      var seconds = Math.floor((new Date().getTime() - lastSavedAt.getTime()) / 1000);

      var interval = seconds / 31536000;
      if (interval > 1) {
        return Math.floor(interval) + 'yr ago';
      }
      interval = seconds / 2592000;
      if (interval > 1) {
        return Math.floor(interval) + 'mo ago';
      }
      interval = seconds / 86400;
      if (interval > 1) {
        return Math.floor(interval) + 'd ago';
      }
      interval = seconds / 3600;
      if (interval > 1) {
        return Math.floor(interval) + ' hours ago';
      }
      interval = seconds / 60;
      if (interval > 1) {
        return Math.floor(interval / 10) * 10 + ' min ago';
      }
      return Math.floor(seconds / 10) * 10 + ' sec ago';
    }
    return 'not saved yet.';
  };

  const [saveTimeText, setSaveTimeText] = createSignal(getSaveTimeText());

  const setTimeredSaveLog = (text: string) => {
    setSaveLog(text);
    makeTimer(
      () => {
        setSaveLog(undefined);
      },
      5000,
      setTimeout
    );
  };

  onMount(() => {
    eventBus.on('project:saved', () => {
      console.log('project saved!!!!!!!!!!!!!!!');
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

  const saveMenu: MenuListOption[] = [
    { label: 'Save As...', onSelect: () => save(true), color: vars.color.onBackground },
    { label: 'Save As Layers', onSelect: () => save(true), color: vars.color.onBackground },
  ];

  return (
    <div
      class={flexRow}
      style={{
        position: 'relative',
        'align-items': 'center',
        overflow: 'visible',
      }}
    >
      <p style={{ opacity: 0.6 }}>{saveTimeText()}</p>
      <p style={{ margin: '0 8px' }}>{saveLog()}</p>

      <div class={saveButtonRoot} data-tauri-drag-region-exclude>
        <div class={saveButtonMainButton} onClick={() => save(!isOWPossible())}>
          <p
            style={{
              color: vars.color.accent,
            }}
          >
            save
          </p>
        </div>
        <div class={saveButtonSide} onClick={() => setIsSaveMenuShown(!isSaveMenuShown())}>
          <div
            style={{
              transform: isSaveMenuShown() ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <Icon src={'/icons/misc/triangle_5.png'} color={vars.color.onBackground} base={5} scale={1} />
          </div>
        </div>

        <Show when={isSaveMenuShown()}>
          <MenuList
            options={saveMenu}
            onClose={() => setIsSaveMenuShown(false)}
            align={'right'}
            style={{ 'margin-top': '4px', 'border-color': vars.color.onBackground, 'border-radius': '4px' }}
          />
        </Show>
      </div>
    </div>
  );
};

export default SaveSection;
