import { css } from '@acab/ecsstatic';
import { clsx, FileLocation } from '@sledge-pdm/core';
import { Checkbox, color, Dropdown, DropdownOption, Slider } from '@sledge-pdm/ui';
import { Component, createSignal, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { CanvasExportOptions, exportImage } from '~/features/io/export/export';
import { EXPORT_TYPES, ExportableTypes } from '~/features/io/export/types';
import { logUserError } from '~/features/log';
import { lastSettingsStore, setLastSettingsStore } from '~/stores/EditorStores';
import { projectStore } from '~/stores/RuntimeProjectStore';
import { accentedButton, flexCol } from '~/styles/styles';
import { exportFileName } from '~/utils/FileUtils';
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

const ExportContentBrowser: Component = () => {
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

  const selectedExportType = () => EXPORT_TYPES[settings.exportOptions.format];

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

    let location: FileLocation | undefined;
    try {
      location = await exportImage(undefined, name, settings.exportOptions);
    } catch (e) {
      logUserError(`Failed to export: ${e}`);
    }

    if (location && location.name) {
      setExportResult({
        kind: 'success',
        text: `export succeed!\nDownload started: ${location.name}`,
      });
    } else {
      setExportResult({
        kind: 'error',
        text: `Export error: file not exported`,
      });
    }

    setLastSettingsStore('exportSettings', settings);
    await saveEditorStateImmediate(['lastSettingsStore']);
  };

  return (
    <div class={sectionContent} style={{ gap: '8px', 'box-sizing': 'border-box', 'margin-top': '4px' }}>
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
            title={!settings.fileName ? undefined : 'Layer images will be downloaded separately.'}
          />
        </div>

        <button class={accentedButton} onClick={(e) => requestExport()} disabled={!settings.fileName}>
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

export default ExportContentBrowser;
