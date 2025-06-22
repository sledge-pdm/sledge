import * as styles from '@styles/globals/top_menu_bar.css';
import { Component, createEffect, createSignal, For } from 'solid-js';
import ExportImageDialog from '~/components/dialogs/ExportImage';
import { createNew, openProject } from '~/controllers/project/window';
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
    { text: '> OPEN.', action: () => openProject() },
    { text: '+ CREATE.', action: () => createNew() },
  ];
  const rightItems: Item[] = [
    {
      text: 'EXPORT.',
      action: () => {
        setIsExportShown(true);
      },
    },
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
                <a class={styles.menuItemText} onClick={(e) => item.action()}>
                  {item.text}
                </a>
                <div class={styles.menuItemBackground} />
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
                <a class={styles.menuItemText} onClick={(e) => item.action()}>
                  {item.text}
                </a>
                <div class={styles.menuItemBackground} />
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
