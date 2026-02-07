import { css } from '@acab/ecsstatic';
import { color, Icon, MenuList, MenuListOption } from '@sledge-pdm/ui';
import { makeTimer } from '@solid-primitives/timer';
import { Component, createEffect, createMemo, createSignal, onMount, Show } from 'solid-js';
import { saveProject } from '~/features/io/project/save';
import rawAreaPattern from '~/patterns/SelectionAreaPattern.svg?raw';
import { ioStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { eventBus } from '~/utils/EventBus';
import { normalizeJoin } from '~/utils/FileUtils';
import { revealInFileBrowser } from '~/utils/NativeOpener';
import { useTimeAgoText } from '~/utils/TimeUtils';
// raw SVG 文字列から最初の <path .../> だけを抽出（self-closing想定）。失敗時は全体を返す。
const extractFirstPath = (svg: string) => {
  const m = svg.match(/<path[\s\S]*?>/i); // self-closing or standard 最短
  return m ? m[0] : svg;
};
const areaPatternPath = extractFirstPath(rawAreaPattern);

const saveSectionContainer = css`
  display: flex;
  flex-direction: row;
  position: relative;
  align-items: baseline;
  overflow: visible;
  gap: 6px;
  pointer-events: all;
`;

const saveTimeTextStyle = css`
  white-space: nowrap;
  opacity: 0.5;
  font-family: ZFB03;
`;

const saveLogTextStyle = css`
  white-space: nowrap;
  opacity: 0.8;
`;

const saveButtonRoot = css`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  border-radius: 4px;
  border: 1px solid var(--color-accent);
  overflow: hidden;
  margin-left: 4px;
`;

const saveButtonMainButton = css`
  position: relative;
  display: flex;
  flex-direction: row;
  padding: 4px 12px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: all;
  appearance: none;
  border: none;
  &:hover {
    background-color: var(--color-button-hover);
  }
`;

const saveButtonSide = css`
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-left: 1px solid var(--color-border);
  padding: 4px 6px;
  &:hover {
    background-color: var(--color-button-hover);
  }
`;

const SaveSection: Component = () => {
  const [isSaveMenuShown, setIsSaveMenuShown] = createSignal(false);
  const [saveLog, setSaveLog] = createSignal<
    | {
        text: string;
        color: string;
      }
    | undefined
  >(undefined);
  const isOWPossible = () => ioStore.savedLocation.name !== undefined && ioStore.savedLocation.path !== undefined && ioStore.openAs === 'project';

  const [saveLoading, setSaveLoading] = createSignal<boolean>(false);
  const save = async () => {
    setSaveLoading(true);
    await saveProject(ioStore.savedLocation.name, ioStore.savedLocation.path);
    setSaveLoading(false);
  };

  const { saveTimeText, updatePastTimeStamp } = useTimeAgoText(projectStore.project.lastSavedAt?.getTime());

  createEffect(() => {
    updatePastTimeStamp(projectStore.project.lastSavedAt?.getTime());
  });

  const setTimeredSaveLog = (text: { text: string; color: string }) => {
    setSaveLog(text);
    makeTimer(
      () => {
        setSaveLog(undefined);
      },
      2000,
      setTimeout
    );
  };

  const handleSaved = () => {
    setTimeredSaveLog({
      text: 'saved!',
      color: color.enabled,
    });
  };

  const handleSaveFailed = () => {
    setTimeredSaveLog({
      text: 'save failed.',
      color: color.error,
    });
  };

  const handleSaveCancelled = () => {
    setTimeredSaveLog({
      text: 'save cancelled.',
      color: color.muted,
    });
  };

  const [patternOffset, setPatternOffset] = createSignal(0);
  const updatePatternOffset = () => {
    setPatternOffset((prev) => (prev + 0.3) % 16);
  };

  onMount(() => {
    eventBus.on('project:saved', handleSaved);
    eventBus.on('project:saveFailed', handleSaveFailed);
    eventBus.on('project:saveCancelled', handleSaveCancelled);
    const updatePatternInterval = setInterval(updatePatternOffset, 30);
    return () => {
      eventBus.off('project:saved', handleSaved);
      eventBus.off('project:saveFailed', handleSaveFailed);
      eventBus.off('project:saveCancelled', handleSaveCancelled);
      clearInterval(updatePatternInterval);
    };
  });

  const saveMenu = createMemo<MenuListOption[]>(() => [
    {
      type: 'item',
      label: 'Save As...',
      onSelect: async () => {
        setSaveLoading(true);
        await saveProject(ioStore.savedLocation.name);
        setSaveLoading(false);
      },
      color: color.onBackground,
    },
    {
      type: 'item',
      label: 'Open Saved Folder',
      onSelect: () => {
        if (!ioStore.savedLocation.path || !ioStore.savedLocation.name) return;
        revealInFileBrowser(normalizeJoin(ioStore.savedLocation.path, ioStore.savedLocation.name));
      },
      disabled: !ioStore.savedLocation.path || !ioStore.savedLocation.name,
      color: color.onBackground,
    },
  ]);

  return (
    <>
      <div class={saveSectionContainer} data-tauri-drag-region-exclude>
        <Show when={saveLog()} fallback={<p class={saveTimeTextStyle}>{saveTimeText()}</p>}>
          <p class={saveLogTextStyle} style={{ color: saveLog()?.color }}>
            {saveLog()?.text}
          </p>
        </Show>
        <div class={saveButtonRoot} data-tauri-drag-region-exclude>
          <button class={saveButtonMainButton} onClick={async () => await save()}>
            <p
              style={{
                color: saveLoading() ? color.muted : color.accent,
                'white-space': 'nowrap',
              }}
            >
              {saveLoading() ? 'saving...' : isOWPossible() ? 'save' : 'save (new)'}
            </p>
            <Show when={saveLoading()}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                <defs>
                  <pattern
                    id='save-background-animate'
                    x={patternOffset()}
                    y={patternOffset()}
                    width='32'
                    height='32'
                    patternUnits='userSpaceOnUse'
                    patternContentUnits='userSpaceOnUse'
                  >
                    <rect x={0} y={0} width='32' height='32' fill={'transparent'} />
                    <g innerHTML={areaPatternPath} />
                  </pattern>
                </defs>
                <rect width='100%' height='100%' fill='url(#save-background-animate)' />
              </svg>
            </Show>
          </button>
          <a class={saveButtonSide} onClick={() => setIsSaveMenuShown(!isSaveMenuShown())}>
            <Icon
              src={'/assets/icons/misc/triangle_5.png'}
              color={color.onBackground}
              base={5}
              scale={1}
              transform={isSaveMenuShown() ? 'rotate(180deg)' : 'rotate(0deg)'}
            />
          </a>
        </div>

        <Show when={isSaveMenuShown()}>
          <MenuList
            options={saveMenu()}
            onClose={() => setIsSaveMenuShown(false)}
            align={'right'}
            style={{
              'margin-top': '4px',
            }}
          />
        </Show>
      </div>
    </>
  );
};

export default SaveSection;
