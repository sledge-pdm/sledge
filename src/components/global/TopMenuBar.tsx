import * as styles from '@styles/components/globals/top_menu_bar.css';
import { Component, createSignal, For, Show } from 'solid-js';
import { openImageImportDialog } from '~/controllers/canvas/image_pool/ImageImport';
import { addToImagePool } from '~/controllers/canvas/image_pool/ImagePoolController';
import ExportImage from '~/dialogs/io/ExportImage';
import { openWindow } from '~/utils/WindowUtils';

interface Item {
  text: string;
  action: () => void;
}

const TopMenuBar: Component = () => {
  const [isExportShown, setIsExportShown] = createSignal(false);

  const leftItems: Item[] = [
    {
      text: 'IMPORT.',
      action: async () => {
        const path = await openImageImportDialog();
        if (path !== undefined) {
          addToImagePool(path);
        }
      },
    },
    {
      text: 'EXPORT.',
      action: () => {
        setIsExportShown(true);
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
      <Show when={isExportShown()}>
        <ExportImage open={isExportShown()} onClose={() => setIsExportShown(false)} />
      </Show>
    </div>
  );
};

export default TopMenuBar;
