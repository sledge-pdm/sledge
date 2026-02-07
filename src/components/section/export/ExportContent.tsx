import { css } from '@acab/ecsstatic';
import { clsx, FileLocation, Vec2 } from '@sledge-pdm/core';
import { Checkbox, color, Dropdown, DropdownOption, fonts, Icon, MenuList, MenuListOption, Slider } from '@sledge-pdm/ui';
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { CanvasExportOptions, exportImage } from '~/features/io/export/export';
import { EXPORT_TYPES, ExportableTypes } from '~/features/io/export/types';
import { allLayers } from '~/features/layer';
import { logUserError } from '~/features/log';
import { lastSettingsStore, setLastSettingsStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { accentedButton, flexCol } from '~/styles/styles';
import { eventBus, Events } from '~/utils/EventBus';
import { exportDir, exportFileName, normalizeJoin, normalizePath } from '~/utils/FileUtils';
import { revealInFileBrowser } from '~/utils/NativeOpener';
import { dialog, fs } from '~/utils/platform';
import { sectionContent, sectionSubCaption, sectionSubContent } from '../SectionStyles';

const qualityField = css`
  display: flex;
  flex-direction: column;
  max-width: 400px;
`;

const qualityFieldDisabled = css`
  pointer-events: none;
  cursor: auto;
  opacity: 0.15;
`;

const exportDialogCustomScaleInput = css`
  font-family: ZFB09;
  font-size: var(--text-md);
  width: 24px;
`;

const folderPathContainer = css`
  display: flex;
  flex-direction: row;
  position: relative;
  overflow: visible;
  padding: 2px 4px;
  border-bottom: 1px solid var(--color-border-secondary);
`;

const folderPath = css`
  font-size: 10px;
  font-family: PM10;
  line-height: 1.2;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  resize: none;
  outline: none;
  padding: 0;
  margin: 0;
  inset: 0;
  width: 100%;
  height: fit-content;
  field-sizing: content;

  border: none;
  letter-spacing: 1px;
`;

const menuButtonContainer = css`
  display: flex;
  flex-direction: column;
  cursor: pointer;
`;
const menuButtonContainerDisabled = css`
  opacity: 0.25;
  cursor: default;
  pointer-events: none;
`;
const iconButton = css`
  padding: 2px;
`;

const browseButton = css`
  white-space: nowrap;
  align-self: end;
`;

const fileNameContainer = css`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
`;

const fileNameInput = css`
  flex-grow: 1;
  min-width: 0;
  font-size: 16px;
  padding-bottom: 2px;
  font-family: k12x8;
  border-bottom-color: var(--color-border);
`;

const scaleContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const customScaleContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const exportSection = css`
  display: flex;
  flex-direction: column;
  align-items: end;
  justify-content: right;
  gap: 8px;
  margin-top: 8px;
`;

const exportControls = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: end;
  gap: 8px;
  margin-bottom: 8px;
`;

const estimatedSize = css`
  width: fit-content;
  margin-bottom: 8px;
  margin-left: 16px;
  opacity: 0.75;
`;

const exportResultText = css`
  font-family: ZFB03;
  color: var(--color-muted);
`;

const scaleOptions: DropdownOption<number>[] = [
  { label: 'x1', value: 1 },
  { label: 'x2', value: 2 },
  { label: 'x4', value: 4 },
  { label: 'x10', value: 10 },
  { label: 'CUSTOM', value: 0 },
];

export interface ExportSettings {
  folderPath?: string;
  fileName?: string;
  exportOptions: CanvasExportOptions;
  showDirAfterSave: boolean;
}

const ExportContent: Component = () => {
  const fileTypeOptions: DropdownOption<ExportableTypes>[] = Object.entries(EXPORT_TYPES).map(([type, value]) => {
    return {
      label: value.label,
      value: type as ExportableTypes,
    };
  });

  const [settings, setSettings] = createStore<ExportSettings>({
    ...lastSettingsStore.exportSettings,
    fileName: exportFileName(),
    exportOptions: {
      ...lastSettingsStore.exportSettings.exportOptions,
      perLayer: false,
    },
  });
  const [customScale, setCustomScale] = createSignal(1);
  const finalScale = () => (settings.exportOptions.scale !== 0 ? settings.exportOptions.scale : customScale()) ?? 1;

  const [exportResult, setExportResult] = createSignal<
    | {
        kind: 'success' | 'error';
        text: string;
      }
    | undefined
  >(undefined);

  const handleRequestExportPath = (e: Events['export:requestExportPath']) => {
    setSettings('folderPath', e.newPath);
  };

  onMount(async () => {
    setSettings('folderPath', await exportDir());
    eventBus.on('export:requestExportPath', handleRequestExportPath);
  });

  onCleanup(() => {
    eventBus.off('export:requestExportPath', handleRequestExportPath);
  });

  const openDirSelectionDialog = async () => {
    const dir = await dialog.open({
      multiple: false,
      directory: true,
      defaultPath: settings.folderPath,
      canCreateDirectories: true,
    });

    if (dir) setSettings('folderPath', dir.toString());
  };

  const requestExport = async () => {
    if (finalScale() <= 0) {
      setExportResult({
        kind: 'error',
        text: `Export Error: invalid scale value.`,
      });
      return;
    }

    setSettings('exportOptions', 'scale', finalScale());

    const name = settings.fileName;
    if (!name) {
      setExportResult({
        kind: 'error',
        text: `Export Error: File name is empty.`,
      });
      return;
    }
    if (settings.folderPath) {
      let location: FileLocation | undefined;
      try {
        location = await exportImage(settings.folderPath, name, settings.exportOptions);
      } catch (e) {
        logUserError(`Failed to export: ${e}`);
      }
      if (location && location.path && location.name) {
        const exportedFolderPath = normalizePath(location.path);
        setExportResult({
          kind: 'success',
          text: `export succeed!\n${exportedFolderPath}`,
        });
        setLastSettingsStore('exportedFolderPaths', (prev) => {
          prev = [exportedFolderPath, ...prev.filter((p) => p !== exportedFolderPath)];
          if (prev.length >= 10) prev.pop();
          return prev;
        });

        if (settings.showDirAfterSave && location.path && location.name) {
          const path = normalizeJoin(location.path, location.name);
          await revealInFileBrowser(path);
        }
      } else {
        setExportResult({
          kind: 'error',
          text: `Export error: file not exported`,
        });
      }
    }

    setLastSettingsStore('exportSettings', settings);
    await saveEditorStateImmediate();
  };

  const [lastExportDirsMenuShown, setLastExportDirsMenuShown] = createSignal(false);
  const selectedExportType = () => EXPORT_TYPES[settings.exportOptions.format];

  let menuButtonContainerRef: HTMLDivElement;

  const [menuAnchor, setMenuAnchor] = createSignal<Vec2>({ x: 0, y: 0 });

  createEffect(() => {
    lastExportDirsMenuShown();
    const rect = menuButtonContainerRef.getBoundingClientRect();
    setMenuAnchor({ x: rect.right, y: rect.bottom });
  });

  const exportedFoldersOptions = createMemo<MenuListOption[]>(() =>
    lastSettingsStore.exportedFolderPaths.map((path: string) => {
      return {
        type: 'item',
        label: normalizePath(path) + '/',
        onSelect: () => {
          setSettings('folderPath', normalizePath(path));
          setLastExportDirsMenuShown(false);
        },
      };
    })
  );

  return (
    <div class={sectionContent} style={{ gap: '8px', 'box-sizing': 'border-box', 'margin-top': '4px' }}>
      <div class={flexCol}>
        <p class={sectionSubCaption}>Output Folder.</p>
        <div class={sectionSubContent}>
          <div class={folderPathContainer}>
            <textarea
              value={settings.folderPath}
              class={folderPath}
              onKeyDown={(e) => {
                e.stopImmediatePropagation();
              }}
              onChange={async (e) => {
                if (settings.folderPath) {
                  setSettings('folderPath', normalizePath(settings.folderPath));
                }
                const path = normalizePath(e.target.value);
                if (!(await fs.exists(path))) {
                  const confirmed = await dialog.confirm(`The specified folder does not exist. create new?`, {
                    okLabel: 'Create',
                    cancelLabel: 'Cancel',
                    kind: 'info',
                    title: 'Output Folder',
                  });

                  if (!confirmed) return;

                  await fs.mkdir(path, { recursive: true });
                } else {
                  const pathStat = await fs.stat(path);
                  if (pathStat.isFile) {
                    await dialog.message('The specified path is already exists as a file.');
                    return;
                  }
                }
                setSettings('folderPath', path);
              }}
            />
            <div
              ref={(ref) => {
                menuButtonContainerRef = ref;
              }}
              class={clsx(menuButtonContainer, lastSettingsStore.exportedFolderPaths.length <= 0 && menuButtonContainerDisabled)}
            >
              <div
                class={iconButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLastExportDirsMenuShown(!lastExportDirsMenuShown());
                }}
              >
                <Icon src={'/assets/icons/misc/triangle_7.png'} base={7} hoverColor={color.accent} />
              </div>
              <Show when={lastExportDirsMenuShown()}>
                <MenuList
                  options={[
                    ...exportedFoldersOptions(),
                    {
                      type: 'item',
                      label: 'clear.',
                      color: color.muted,
                      fontFamily: fonts.ZFB03,
                      onSelect: async () => {
                        setLastSettingsStore('exportedFolderPaths', []);
                        await saveEditorStateImmediate();
                        setLastExportDirsMenuShown(false);
                      },
                    },
                  ]}
                  onClose={() => setLastExportDirsMenuShown(false)}
                  align='right'
                  style={{
                    position: 'fixed',
                    top: `${menuAnchor().y + 8}px`,
                    left: `${menuAnchor().x + 8}px`,
                    transform: 'translateX(-100%)',
                    width: 'fit-content',
                    'max-width': '480px',
                  }}
                />
              </Show>
            </div>
          </div>
          <button class={browseButton} onClick={openDirSelectionDialog}>
            browse...
          </button>
        </div>
      </div>

      <div class={flexCol}>
        <p class={sectionSubCaption}>File Name.</p>
        <div class={sectionSubContent}>
          <div class={fileNameContainer}>
            <input
              class={fileNameInput}
              placeholder='image'
              value={settings.fileName}
              autocomplete='off'
              onInput={(e) => setSettings('fileName', e.target.value)}
            />
            <Show when={!settings.exportOptions.perLayer}>
              <p>.{selectedExportType().fileExtension}</p>
            </Show>
          </div>
        </div>
      </div>

      <div class={flexCol}>
        <p class={sectionSubCaption}>Format.</p>
        <div class={sectionSubContent}>
          <Dropdown options={fileTypeOptions} value={settings.exportOptions.format} onChange={(e) => setSettings('exportOptions', 'format', e)} />
        </div>
      </div>

      <div class={clsx(qualityField, !selectedExportType().qualityMutable && qualityFieldDisabled)} style={{ 'flex-grow': 1 }}>
        <p class={sectionSubCaption}>Quality.</p>
        <div class={sectionSubContent}>
          <Slider
            labelMode={'left'}
            defaultValue={settings.exportOptions.quality}
            value={settings.exportOptions.quality}
            allowDirectInput={true}
            min={0}
            max={100}
            onChange={(v) => setSettings('exportOptions', 'quality', v)}
          />
        </div>
      </div>

      <div class={flexCol}>
        <p class={sectionSubCaption}>Scale.</p>
        <div class={sectionSubContent}>
          <div class={scaleContainer}>
            <Dropdown
              options={scaleOptions}
              value={settings.exportOptions.scale ?? 1}
              onChange={(e) => setSettings('exportOptions', 'scale', Number(e))}
            />
            <Show when={settings.exportOptions.scale === 0}>
              <div class={customScaleContainer}>
                <p>x</p>
                <input
                  class={exportDialogCustomScaleInput}
                  type='number'
                  onInput={(e) => {
                    let roundedValue = Math.floor(Number(e.target.value));
                    if (roundedValue < 1) roundedValue = 1;
                    if (roundedValue > 20) roundedValue = 20;
                    if (e.target.value.trim() === '') e.target.value = ``;
                    else e.target.value = `${roundedValue}`;
                    setCustomScale(roundedValue);
                  }}
                  value={customScale()}
                  min={1}
                  max={20}
                  maxLength={2}
                />
              </div>
            </Show>
          </div>
        </div>
      </div>

      <p class={estimatedSize}>
        estimated: {projectStore.canvas.size.width * finalScale()} x {projectStore.canvas.size.height * finalScale()}
      </p>

      <div class={exportSection}>
        <div class={exportControls}>
          <Checkbox
            checked={settings.exportOptions.perLayer}
            onChange={(v) => setSettings('exportOptions', 'perLayer', v)}
            label='Export Per Layer.'
            labelMode='left'
            title={
              !settings.fileName || !settings.folderPath
                ? undefined
                : 'Layer images will be exported in:\n' +
                  allLayers()
                    .map((layer) => {
                      return normalizeJoin(
                        settings.folderPath!,
                        settings.fileName!,
                        `${settings.fileName}_${layer.name}.${selectedExportType().fileExtension}`
                      );
                    })
                    .join('\n')
            }
          />
          <Checkbox
            checked={settings.showDirAfterSave}
            onChange={(checked) => setSettings('showDirAfterSave', checked)}
            label='open in explorer'
            labelMode='left'
          />
        </div>

        <button class={accentedButton} onClick={(e) => requestExport()} disabled={!settings.folderPath || !settings.fileName}>
          Export
        </button>

        <p
          class={exportResultText}
          style={{
            color: exportResult()?.kind === 'error' ? color.error : color.muted,
          }}
        >
          {exportResult()?.text}
        </p>
      </div>
    </div>
  );
};

export default ExportContent;
