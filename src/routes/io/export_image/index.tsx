import { getCurrentWindow } from '@tauri-apps/api/window';
import { open as openFile } from '@tauri-apps/plugin-dialog';
import { createSignal, onMount, Show } from 'solid-js';
import Checkbox from '~/components/common/control/Checkbox';
import Dropdown, { DropdownOption } from '~/components/common/control/Dropdown';
import Slider from '~/components/common/control/Slider';
import { CanvasExportOptions, defaultExportDir, exportableFileTypes } from '~/io/image_export/exportCanvas';
import { canvasStore } from '~/stores/ProjectStores';
import { accentedButton, vars } from '~/styles/global.css';
import { flexRow } from '~/styles/snippets.css';
import { emitGlobalEvent } from '~/utils/TauriUtils';
import * as styles from './export_image.css';

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

export interface ExportRequestPayload {
  dirPath?: string;
  exportOptions: CanvasExportOptions;
  showDirAfterSave: boolean;
}

export default function ExportImage() {
  const [fileType, setFileType] = createSignal(fileTypeOptions[0].value);
  const [scale, setScale] = createSignal(scaleOptions[0].value);
  const [customScale, setCustomScale] = createSignal<number | undefined>(undefined);
  const [quality, setQuality] = createSignal<number>(95);
  const [saveDir, setSaveDir] = createSignal<string | undefined>();
  const [showDirAfterSave, setShowDirAfterSave] = createSignal<boolean>(true);

  const finalScale = () => (scale() !== 0 ? scale() : customScale()) ?? 1;

  onMount(async () => {
    setSaveDir(await defaultExportDir());
  });

  const openDirSelectionDialog = async () => {
    const dir = await openFile({
      multiple: false,
      directory: true,
      defaultPath: saveDir(),
      canCreateDirectories: true,
    });

    if (dir) setSaveDir(dir);
  };

  const requestExport = async () => {
    if (scale() === 0) return;

    await emitGlobalEvent('onExportRequested', {
      dirPath: saveDir(),
      exportOptions: {
        format: fileType(),
        quality: quality(),
        scale: finalScale(),
      },
      showDirAfterSave: showDirAfterSave(),
    });

    getCurrentWindow().close();
  };

  return (
    <div class={styles.root}>
      <div class={styles.content}>
        {/* <p class={styles.header}>EXPORT.</p> */}

        <div class={styles.field}>
          <div class={flexRow} style={{ 'align-items': 'center', gap: '8px', 'margin-bottom': vars.spacing.md }}>
            <p class={styles.fieldHeader} style={{ 'margin-bottom': 0, 'flex-grow': 1 }}>
              Output Directory.
            </p>
            <Checkbox
              checked={showDirAfterSave()}
              onChange={(checked) => setShowDirAfterSave(checked)}
              label='open dir after save'
              labelMode='left'
            />
          </div>
          <div style={{ 'align-items': 'center', gap: '12px', width: '300px' }} class={flexRow}>
            <p style={{ 'flex-grow': 1, 'text-overflow': 'ellipsis' }}>{saveDir()}</p>
            <button onClick={openDirSelectionDialog}>...</button>
          </div>
        </div>

        <div class={styles.field}>
          <p class={styles.fieldHeader}>Type.</p>
          <Dropdown options={fileTypeOptions} value={fileType()} onChange={(e) => setFileType(e)} />
        </div>

        <div class={fileType() === 'jpg' ? styles.field : styles.fieldDisabled}>
          <p class={styles.fieldHeader}>Quality.</p>
          <Slider labelMode={'left'} defaultValue={quality()} value={quality()} min={0} max={100} onChange={(v) => setQuality(v)} />
        </div>

        <div class={styles.field}>
          <p class={styles.fieldHeader}>Scale.</p>
          <div class={flexRow} style={{ 'align-items': 'center', gap: '12px' }}>
            <Dropdown options={scaleOptions} value={scale()} onChange={(e) => setScale(e)} />
            <Show when={scale() === 0}>
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

      <div class={styles.controlArea}>
        <button class={accentedButton} onClick={requestExport}>
          export!
        </button>
      </div>
    </div>
  );
}
