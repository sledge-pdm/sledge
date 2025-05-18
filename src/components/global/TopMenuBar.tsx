import * as styles from '@styles/components/globals/top_menu_bar.css';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { Component, For } from 'solid-js';
import { exportCanvas } from '~/io/image_export/exportCanvas';
import { ExportRequestPayload } from '~/routes/io/export_image';
import { projectStore } from '~/stores/ProjectStores';
import { listenEvent } from '~/utils/TauriUtils';
import { openWindow } from '~/utils/WindowUtils';

interface Item {
  text: string;
  action: () => void;
}

const TopMenuBar: Component = () => {
  const leftItems: Item[] = [
    { text: 'IMPORT.', action: () => {} },
    {
      text: 'EXPORT.',
      action: () => {
        openWindow('export');
        listenEvent('onExportRequested', async (e) => {
          const payload = e.payload as ExportRequestPayload;
          const name = projectStore.newName || projectStore.name;
          if (name === undefined) return;
          console.log(payload);
          if (payload.dirPath) {
            const result = await exportCanvas(payload.dirPath, name, payload.exportOptions);
            if (result) {
              if (payload.showDirAfterSave) await revealItemInDir(result);
            }
          }
        });
      },
    },
  ];
  const rightItems: Item[] = [
    { text: 'START.', action: () => openWindow('start') },
    { text: 'SETTINGS.', action: () => openWindow('settings') },
  ];

  return (
    <div class={styles.root}>
      <div class={styles.menuListLeft}>
        <For each={leftItems}>
          {(item, i) => {
            let containerRef: HTMLDivElement;
            return (
              <div ref={(el) => (containerRef = el)} class={styles.menuItem}>
                <a onClick={(e) => item.action()}>{item.text}</a>
              </div>
            );
          }}
        </For>
      </div>
      <div class={styles.menuListRight}>
        <For each={rightItems}>
          {(item, i) => {
            let containerRef: HTMLDivElement;
            return (
              <div ref={(el) => (containerRef = el)} class={styles.menuItem}>
                <a onClick={(e) => item.action()}>{item.text}</a>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default TopMenuBar;
