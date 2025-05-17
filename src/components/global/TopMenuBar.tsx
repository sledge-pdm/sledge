import * as styles from '@styles/components/globals/top_menu_bar.css';
import { Component, For } from 'solid-js';
import { openWindow } from '~/utils/WindowUtils';

interface Item {
  text: string;
  action: () => void;
}

const TopMenuBar: Component = () => {
  const leftItems: Item[] = [
    { text: 'IMPORT.', action: () => {} },
    { text: 'EXPORT.', action: () => {} },
  ];
  const rightItems: Item[] = [{ text: 'SETTINGS.', action: () => openWindow('settings') }];

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
