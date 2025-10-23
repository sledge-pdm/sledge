import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { color } from '@sledge/theme';
import { Checkbox, Dropdown, DropdownOption, Icon, MenuList, Slider } from '@sledge/ui';
import { confirm, message, open } from '@tauri-apps/plugin-dialog';
import { exists, mkdir, stat } from '@tauri-apps/plugin-fs';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, createEffect, createSignal, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { saveGlobalSettings } from '~/features/io/config/save';
import { convertToExtension, convertToLabel, exportableFileTypes, ExportableFileTypes } from '~/features/io/FileExtensions';
import { CanvasExportOptions, defaultExportDir, exportImage } from '~/features/io/image/out/export';
import { allLayers } from '~/features/layer';
import { fileStore, lastSettingsStore, setLastSettingsStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';
import { accentedButton, flexCol } from '~/styles/styles';
import { getFileNameWithoutExtension, normalizeJoin, normalizePath } from '~/utils/FileUtils';
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

const scaleOptions: DropdownOption<number>[] = [
  { label: 'x1', value: 1 },
  { label: 'x2', value: 2 },
  { label: 'x4', value: 4 },
  { label: 'x10', value: 10 },
  { label: 'CUSTOM', value: 0 },
];

const qualityMutableExtensions: Partial<ExportableFileTypes>[] = ['webp_lossy', 'jpeg'];

export interface ExportSettings {
  folderPath?: string;
  fileName?: string;
  exportOptions: CanvasExportOptions;
  showDirAfterSave: boolean;
}

const ExportContent: Component = () => {
  const fileTypeOptions: DropdownOption<ExportableFileTypes>[] = exportableFileTypes.map((type) => {
    return {
      label: convertToLabel(type) ?? '[unknown]',
      value: type,
    };
  });

  const nameWithoutExtension = () => getFileNameWithoutExtension(fileStore.savedLocation.name);

  const [settings, setSettings] = createStore<ExportSettings>({
    ...lastSettingsStore.exportSettings,
    fileName: fileStore.savedLocation.name ? nameWithoutExtension() : 'new project',
    exportOptions: {
      ...lastSettingsStore.exportSettings.exportOptions,
      perLayer: false,
    },
  });
  const [customScale, setCustomScale] = createSignal(1);

  const finalScale = () => (settings.exportOptions.scale !== 0 ? settings.exportOptions.scale : customScale()) ?? 1;

  onMount(async () => {
    if (fileStore.savedLocation.path) {
      setSettings('folderPath', fileStore.savedLocation.path);
    } else {
      setSettings('folderPath', await defaultExportDir());
    }

    createEffect(() => {
      const newFolderPath = lastSettingsStore.exportSettings.folderPath;
      if (newFolderPath && !newFolderPath.trim()) setSettings('folderPath', newFolderPath);
    });
  });

  const openDirSelectionDialog = async () => {
    const dir = await open({
      multiple: false,
      directory: true, 
      defaultPath: settings.folderPath,
      canCreateDirectories: true,
    });

    if (dir) setSettings('folderPath', dir);
  };

  const requestExport = async () => {
    if (finalScale() === 0) return;

    setSettings('exportOptions', 'scale', finalScale());

    const name = settings.fileName;
    if (!name) {
      message('Export Error: File name is empty.');
      return;
    }
    if (settings.folderPath) {
      const location = await exportImage(settings.folderPath, name, settings.exportOptions);
      if (location && location.path && location.name) {
        const exportedPath = normalizeJoin(location.path, location.name);
        setLastSettingsStore('exportedFolderPaths', (prev) => {
          prev = [exportedPath, ...prev.filter((p) => p !== exportedPath)];
          if (prev.length >= 30) prev.unshift();
          return prev;
        });

        if (settings.showDirAfterSave && location.path && location.name) {
          await revealItemInDir(normalizeJoin(location.path, location.name));
        }
      }
    }

    setLastSettingsStore('exportSettings', settings);
    await saveGlobalSettings(true);
  };

  const [lastExportDirsMenuShown, setLastExportDirsMenuShown] = createSignal(false);

  return (
    <div class={sectionContent} style={{ gap: '8px', 'box-sizing': 'border-box', 'margin-top': '4px' }}>
      <div class={flexCol} style={{ overflow: 'visible' }}>
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
                if (!(await exists(path))) {
                  const confirmed = await confirm(`The specified folder does not exist. create new?`, {
                    okLabel: 'Create',
                    cancelLabel: 'Cancel',
                    kind: 'info',
                    title: 'Output Folder',
                  });

                  if (!confirmed) return;

                  await mkdir(path, { recursive: true });
                } else {
                  const pathStat = await stat(path);
                  if (pathStat.isFile) {
                    await message('The specified path is already exists as a file.');
                    return;
                  }
                }
                setSettings('folderPath', path);
              }}
            />
            <div
              class={clsx(menuButtonContainer, lastSettingsStore.exportedFolderPaths.length <= 0 && menuButtonContainerDisabled)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLastExportDirsMenuShown(!lastExportDirsMenuShown());
              }}
            >
              <div class={iconButton}>
                <Icon src={'/icons/misc/triangle_7.png'} base={7} hoverColor={color.accent} />
              </div>
              <Show when={lastExportDirsMenuShown()}>
                <MenuList
                  options={lastSettingsStore.exportedFolderPaths.map((path: string) => {
                    return { type: 'item', label: normalizePath(path), onSelect: () => setSettings('folderPath', normalizePath(path)) };
                  })}
                  onClose={() => setLastExportDirsMenuShown(false)}
                  align='right'
                  style={{
                    'margin-top': '6px',
                    'border-radius': '4px',
                    'border-color': color.onBackground,
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
              <p>.{convertToExtension(settings.exportOptions.format)}</p>
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

      <div
        class={clsx(qualityField, !qualityMutableExtensions.includes(settings.exportOptions.format) && qualityFieldDisabled)}
        style={{ 'flex-grow': 1 }}
      >
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
        estimated: {canvasStore.canvas.width * finalScale()} x {canvasStore.canvas.height * finalScale()}
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
                        `${settings.fileName}_${layer.name}.${convertToExtension(settings.exportOptions.format)}`
                      );
                    })
                    .join('\n')
            }
          />
          <Checkbox
            checked={settings.showDirAfterSave}
            onChange={(checked) => setSettings('showDirAfterSave', checked)}
            label='open dir after save'
            labelMode='left'
          />
        </div>

        <button class={accentedButton} onClick={(e) => requestExport()} disabled={!settings.folderPath || !settings.fileName}>
          Export
        </button>
      </div>
    </div>
  );
};

export default ExportContent;
