import * as styles from '@styles/dialogs/export_image.css';
import { open as openFile } from '@tauri-apps/plugin-dialog';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, createSignal, onMount, Show } from 'solid-js';
import Checkbox from '~/components/common/control/Checkbox';
import Dropdown, { DropdownOption } from '~/components/common/control/Dropdown';
import Slider from '~/components/common/control/Slider';
import { CanvasExportOptions, defaultExportDir, exportableFileTypes, exportCanvas } from '~/io/image_export/exportCanvas';
import { canvasStore, projectStore } from '~/stores/ProjectStores';
import { vars } from '~/styles/global.css';
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

export interface ExportRequestPayload {
  dirPath?: string;
  exportOptions: CanvasExportOptions;
  showDirAfterSave: boolean;
}

export interface ExportImageProps extends DialogExternalProps {
  onExport?: (payload: ExportRequestPayload) => void;
}

const ExportImage: Component<ExportImageProps> = (props) => {
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

    const payload = {
      dirPath: saveDir(),
      exportOptions: {
        format: fileType(),
        quality: quality(),
        scale: finalScale(),
      },
      showDirAfterSave: showDirAfterSave(),
    };
    props.onExport?.(payload);

    const name = projectStore.newName || projectStore.name;
    if (name === undefined) return;
    if (payload.dirPath) {
      const result = await exportCanvas(payload.dirPath, name, payload.exportOptions);
      if (result) {
        if (payload.showDirAfterSave) await revealItemInDir(result);
      }
    }

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
      </div>
    </Dialog>
  );
};
export default ExportImage;
