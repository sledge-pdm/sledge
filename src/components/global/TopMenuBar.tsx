import * as styles from '@styles/globals/top_menu_bar.css';
import { Component, createEffect, createSignal, For } from 'solid-js';
import { openImageImportDialog } from '~/controllers/canvas/image_pool/ImageImport';
import { addToImagePool } from '~/controllers/canvas/image_pool/ImagePoolController';
import ExportImageDialog from '~/dialogs/io/ExportImage';
import { openWindow } from '~/utils/WindowUtils';

interface Item {
  text: string;
  action: () => void;
}

const TopMenuBar: Component = () => {
  const [isExportShown, setIsExportShown] = createSignal(false);
  let dialog = null;

  createEffect(() => {
    if (isExportShown()) {
      dialog = <ExportImageDialog open={isExportShown()} onClose={() => setIsExportShown(false)} />;
    } else {
      dialog = null;
    }
  });

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
      {dialog}
    </div>
  );
};

export default TopMenuBar;
