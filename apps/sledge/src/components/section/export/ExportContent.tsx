import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { fonts } from '@sledge/theme';
import { Checkbox, Dropdown, DropdownOption, Slider } from '@sledge/ui';
import { confirm, message, open } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, createMemo, createSignal, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { saveGlobalSettings } from '~/features/io/config/save';
import { convertToExtension, convertToLabel, exportableFileTypes, ExportableFileTypes } from '~/features/io/FileExtensions';
import { CanvasExportOptions, defaultExportDir, exportImage } from '~/features/io/image/out/export';
import { fileStore } from '~/stores/EditorStores';
import { lastSettingsStore, setLastSettingsStore } from '~/stores/GlobalStores';
import { canvasStore } from '~/stores/ProjectStores';
import { accentedButton, flexCol } from '~/styles/styles';
import { getFileNameWithoutExtension, join } from '~/utils/FileUtils';
import { sectionContent, sectionSubCaption, sectionSubContent } from '../SectionStyles';

const qualityField = css`
  display: flex;
  flex-direction: column;
  max-width: 400px;
`;

const qualityFieldDisabled = css`
  display: none;
  /* pointer-events: none;
  cursor: auto;
  opacity: 0.25; */
`;

const exportDialogCustomScaleInput = css`
  font-family: ZFB09;
  font-size: var(--text-md);
  width: 24px;
`;

const directoryPath = css`
  font-family: k12x8;
  font-size: 8px;
  line-height: 1.2;
  word-wrap: break-word;
  word-break: break-word;
  width: 100%;
  padding: 4px;
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
`;

const fileNameInput = css`
  flex-grow: 1;
  min-width: 0;
  font-size: 16px;
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
  flex-direction: row;
  width: 100%;
  justify-content: end;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const estimatedSize = css`
  width: fit-content;
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
  dirPath?: string;
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
    fileName: nameWithoutExtension() ?? 'new project',
  });
  const [customScale, setCustomScale] = createSignal(1);

  const finalScale = () => (settings.exportOptions.scale !== 0 ? settings.exportOptions.scale : customScale()) ?? 1;

  onMount(async () => {
    if (fileStore.savedLocation.path) {
      setSettings('dirPath', fileStore.savedLocation.path);
    } else {
      setSettings('dirPath', await defaultExportDir());
    }
  });

  const openDirSelectionDialog = async () => {
    const dir = await open({
      multiple: false,
      directory: true,
      defaultPath: settings.dirPath,
      canCreateDirectories: true,
    });

    if (dir) setSettings('dirPath', dir);
  };

  const requestExport = async () => {
    if (finalScale() === 0) return;

    setSettings('exportOptions', 'scale', finalScale());

    const name = settings.fileName;
    if (!name) {
      message('Export Error; File name is empty.');
      return;
    }
    if (settings.dirPath) {
      const filePath = join(settings.dirPath, `${name}.${convertToExtension(settings.exportOptions.format)}`);
      if (await exists(filePath)) {
        const ok = await confirm(`File already exists:\n${filePath}\n\nOverwrite?`, {
          kind: 'info',
          okLabel: 'Overwrite',
          cancelLabel: 'Cancel',
          title: 'Export',
        });
        if (!ok) {
          console.warn('export cancelled.');
          return;
        }
      }

      const location = await exportImage(settings.dirPath, name, settings.exportOptions);
      if (location) {
        // setLastSettingsStore('exportSettings', 'dirPath', location.path);
        if (settings.showDirAfterSave && location.path && location.name) {
          await revealItemInDir(join(location.path, location.name));
        }
      }
    }

    setLastSettingsStore('exportSettings', settings);
    await saveGlobalSettings(true);
  };

  const exportDirHistoryOptions = createMemo<DropdownOption<string>[]>(() => {
    const options: DropdownOption<string>[] = lastSettingsStore.exportedDirPaths.map((path: string) => {
      return {
        label: path,
        value: path,
      };
    });

    return options.reverse();
  });

  return (
    <div class={sectionContent} style={{ gap: '12px', 'box-sizing': 'border-box' }}>
      <div class={flexCol}>
        <p class={sectionSubCaption} style={{ 'margin-bottom': '8px', width: '100%' }}>
          Recent folders.
        </p>
        <div class={sectionSubContent}>
          <Dropdown
            options={exportDirHistoryOptions() ?? []}
            value={lastSettingsStore.exportedDirPaths.find((p) => p === (settings.dirPath ?? '')) ?? ''}
            onChange={(path) => setSettings('dirPath', path as string)}
            align='right'
            fontFamily={fonts.k12x8}
            fullWidth={true}
          />
        </div>
      </div>

      <div class={flexCol}>
        <p class={sectionSubCaption} style={{ 'margin-bottom': '8px' }}>
          Output Directory.
        </p>
        <div class={sectionSubContent}>
          <p class={directoryPath}>{settings.dirPath}\</p>
          <button class={browseButton} onClick={openDirSelectionDialog}>
            browse...
          </button>
        </div>
      </div>

      <div class={flexCol}>
        <p class={sectionSubCaption} style={{ 'margin-bottom': '8px' }}>
          Format.
        </p>
        <div class={sectionSubContent}>
          <Dropdown options={fileTypeOptions} value={settings.exportOptions.format} onChange={(e) => setSettings('exportOptions', 'format', e)} />
        </div>
      </div>

      <div
        class={clsx(qualityField, qualityMutableExtensions.includes(settings.exportOptions.format) && qualityFieldDisabled)}
        style={{ 'flex-grow': 1 }}
      >
        <p class={sectionSubCaption} style={{ 'margin-bottom': '8px' }}>
          Quality.
        </p>
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
        <p class={sectionSubCaption} style={{ 'margin-bottom': '8px' }}>
          File Name.
        </p>
        <div class={sectionSubContent}>
          <div class={fileNameContainer}>
            <input
              class={fileNameInput}
              placeholder='file name'
              value={settings.fileName}
              autocomplete='off'
              onInput={(e) => setSettings('fileName', e.target.value)}
            />
            <p>.{convertToExtension(settings.exportOptions.format)}</p>
          </div>
        </div>
      </div>

      <div class={flexCol}>
        <p class={sectionSubCaption} style={{ 'margin-bottom': '8px' }}>
          Scale.
        </p>
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

      <div class={exportSection}>
        <p class={estimatedSize}>
          estimated size: {canvasStore.canvas.width * finalScale()} x {canvasStore.canvas.height * finalScale()}
        </p>
        <div class={exportControls}>
          <Checkbox
            checked={settings.showDirAfterSave}
            onChange={(checked) => setSettings('showDirAfterSave', checked)}
            label='open dir after save'
            labelMode='left'
          />
        </div>

        <button class={accentedButton} onClick={(e) => requestExport()}>
          Export
        </button>
      </div>
    </div>
  );
};

export default ExportContent;
