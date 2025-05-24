import * as styles from '@styles/dialogs/export_image.css';
import { open as openFile } from '@tauri-apps/plugin-dialog';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, createSignal, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import Checkbox from '~/components/common/control/Checkbox';
import Dropdown, { DropdownOption } from '~/components/common/control/Dropdown';
import Slider from '~/components/common/control/Slider';
import { saveGlobalSettings } from '~/io/global_config/globalSettings';
import { CanvasExportOptions, defaultExportDir, exportableFileTypes, exportCanvas } from '~/io/image_export/exportCanvas';
import { lastSettingsStore, setLastSettingsStore } from '~/stores/GlobalStores';
import { canvasStore, projectStore } from '~/stores/ProjectStores';
import { vars, ZFB08 } from '~/styles/global.css';
import { flexRow } from '~/styles/snippets.css';
import { Dialog, DialogExternalProps } from '../Dialog';

const fileTypeOptions: DropdownOption<exportableFileTypes>[] = [
  { label: 'png', value: 'png' },
  { label: 'jpeg', value: 'jpg' },
];
const scaleOptions: DropdownOption<number>[] = [
  { label: 'x1', value: 1 },
  { label: 'x2', value: 2 },
  { label: 'x4', value: 4 },
  { label: 'x10', value: 10 },
  { label: 'CUSTOM', value: 0 },
];

export interface ExportSettings {
  dirPath?: string;
  fileName?: string;
  exportOptions: CanvasExportOptions;
  showDirAfterSave: boolean;
}

export interface ExportImageProps extends DialogExternalProps {
  onExport?: (payload: ExportSettings) => void;
}

const ExportImageDialog: Component<ExportImageProps> = (props) => {
  const [settings, setSettings] = createStore<ExportSettings>({
    ...lastSettingsStore.exportSettings,
    fileName: projectStore.newName ?? projectStore.name,
  });
  const [customScale, setCustomScale] = createSignal(1);

  const finalScale = () => (settings.exportOptions.scale !== 0 ? settings.exportOptions.scale : customScale()) ?? 1;

  onMount(async () => {
    if (settings.dirPath === '' || !settings.dirPath) setSettings('dirPath', await defaultExportDir());
  });

  const openDirSelectionDialog = async () => {
    const dir = await openFile({
      multiple: false,
      directory: true,
      defaultPath: settings.dirPath,
      canCreateDirectories: true,
    });

    if (dir) setSettings('dirPath', dir);
  };

  const requestExport = async () => {
    if (settings.exportOptions.scale === 0) return;

    props.onExport?.(settings);

    const name = settings.fileName;
    if (name === undefined) return;
    if (settings.dirPath) {
      const result = await exportCanvas(settings.dirPath, name, settings.exportOptions);
      if (result) {
        if (settings.showDirAfterSave) await revealItemInDir(result);
      }
    }

    setLastSettingsStore('exportSettings', settings);
    await saveGlobalSettings();
    props.onClose();
  };

  const close = () => {
    props.onClose();
  };

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title='EXPORT.'
      closeByOutsideClick={false}
      leftButtons={[]}
      rightButtons={[
        {
          text: 'export!',
          accented: true,
          onClick: () => requestExport(),
        },
        {
          text: 'cancel',
          accented: false,
          onClick: () => close(),
        },
      ]}
    >
      <div class={styles.root}>
        <div class={styles.content}>
          {/* <p class={styles.header}>EXPORT.</p> */}

          <div class={styles.field}>
            <div class={flexRow} style={{ 'align-items': 'center', gap: '8px', 'margin-bottom': '8px' }}>
              <p class={styles.fieldHeader} style={{ 'margin-bottom': 0, 'flex-grow': 1 }}>
                Output Directory.
              </p>
              <Checkbox
                checked={settings.showDirAfterSave}
                onChange={(checked) => setSettings('showDirAfterSave', checked)}
                label='open dir after save'
                labelMode='left'
              />
            </div>
            <div style={{ 'align-items': 'center', gap: '12px' }} class={flexRow}>
              <p style={{ 'flex-grow': 1, 'text-overflow': 'ellipsis' }}>{settings.dirPath}</p>
              <button onClick={openDirSelectionDialog}>...</button>
            </div>

            <div class={flexRow} style={{ 'align-items': 'end', 'margin-bottom': vars.spacing.sm }}>
              <p class={styles.fileName}>\</p>
              <input
                class={styles.fileName}
                style={{ 'field-sizing': 'content' }}
                value={settings.fileName}
                onChange={(e) => setSettings('fileName', e.target.value)}
              />
              <p style={{ 'font-size': vars.text.md, 'font-family': ZFB08 }}>.{settings.exportOptions.format}</p>
            </div>
          </div>
          <div class={styles.field}>
            <p class={styles.fieldHeader}>Type.</p>
            <Dropdown options={fileTypeOptions} value={settings.exportOptions.format} onChange={(e) => setSettings('exportOptions', 'format', e)} />
          </div>

          <div class={settings.exportOptions.format === 'jpg' ? styles.field : styles.fieldDisabled}>
            <p class={styles.fieldHeader}>Quality.</p>
            <Slider
              labelMode={'left'}
              defaultValue={settings.exportOptions.quality}
              value={settings.exportOptions.quality}
              min={0}
              max={100}
              onChange={(v) => setSettings('exportOptions', 'quality', v)}
            />
          </div>

          <div class={styles.field}>
            <p class={styles.fieldHeader}>Scale.</p>
            <div class={flexRow} style={{ 'align-items': 'center', gap: '12px' }}>
              <Dropdown
                options={scaleOptions}
                value={settings.exportOptions.scale ?? 1}
                onChange={(e) => setSettings('exportOptions', 'scale', Number(e))}
              />
              <Show when={settings.exportOptions.scale === 0}>
                <div style={{ 'align-items': 'center' }} class={flexRow}>
                  <p>x</p>
                  <input
                    class={styles.customScaleInput}
                    type='number'
                    onInput={(e) => setCustomScale(Number(e.target.value))}
                    min={0.1}
                    max={20}
                    maxLength={2}
                  />
                </div>
              </Show>
            </div>
            <p style={{ 'margin-top': '8px' }}>
              estimated size: {canvasStore.canvas.width * finalScale()} x {canvasStore.canvas.height * finalScale()}
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
export default ExportImageDialog;
