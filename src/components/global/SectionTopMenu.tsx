import * as styles from '@styles/section/section_top_menu.css';
import { Component, For, Show } from 'solid-js';
import { appearanceStore, setAppearanceStore } from '~/stores/EditorStores';

interface Item {
  text: string;
  isActive: () => boolean;
  action: () => void;
}

const SectionTopMenu: Component = () => {
  const items: Item[] = [
    {
      text: 'EDITOR.',
      isActive: () => appearanceStore.sideAppearanceMode === 'editor',
      action: () => {
        setAppearanceStore('sideAppearanceMode', 'editor');
      },
    },
    {
      text: 'PROJECT.',
      isActive: () => appearanceStore.sideAppearanceMode === 'project',
      action: () => {
        setAppearanceStore('sideAppearanceMode', 'project');
      },
    },
  ];
  return (
    <div class={styles.root}>
      <div class={styles.menuList}>
        <For each={items}>
          {(item, i) => {
            let containerRef: HTMLDivElement;
            return (
              <>
                <div ref={(el) => (containerRef = el)} class={styles.menuItem}>
                  <a onClick={(e) => item.action()} style={{ color: item.isActive() ? 'blue' : undefined }}>
                    {item.text}
                  </a>
                </div>

                <Show when={i() !== items.length - 1}>
                  <p>/</p>
                </Show>
              </>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default SectionTopMenu;
