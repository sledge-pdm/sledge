import { getTheme, ZFB09 } from '@sledge/theme';
import { MenuList, MenuListOption } from '@sledge/ui';
import * as styles from '@styles/globals/top_menu_bar.css';
import { Component, createEffect, createSignal, For, Show } from 'solid-js';
import ExportDialog from '~/components/dialogs/ExportDialog';
import SettingDialog from '~/components/dialogs/SettingDialog';
import { createNew, openExistingProject, openProject } from '~/controllers/project/window';
import { globalConfig } from '~/stores/GlobalStores';
import { openWindow } from '~/utils/WindowUtils';

interface Item {
  text: string;
  action: () => void;
}

const TopMenuBar: Component = () => {
  const [isRecentMenuShown, setIsRecentMenuShown] = createSignal(false);
  const [isOpenMenuShown, setIsOpenMenuShown] = createSignal(false);

  const [isExportShown, setIsExportShown] = createSignal(false);
  const [isSettingShown, setIsSettingShown] = createSignal(false);
  let exportDialog = null;
  let settingDialog = null;

  createEffect(() => {
    if (isExportShown()) {
      exportDialog = <ExportDialog open={isExportShown()} onClose={() => setIsExportShown(false)} />;
    } else {
      exportDialog = null;
    }
  });

  createEffect(() => {
    if (isSettingShown()) {
      settingDialog = <SettingDialog open={isSettingShown()} onClose={() => setIsSettingShown(false)} />;
    } else {
      settingDialog = null;
    }
  });

  const leftItems: Item[] = [
    {
      text: 'SLEDGE.',
      action: () => {
        openWindow('start');
      },
    },
    {
      text: '> OPEN.',
      action: () => setIsOpenMenuShown(true),
    },
  ];
  const rightItems: Item[] = [
    {
      text: 'EXPORT.',
      action: () => {
        setIsExportShown(true);
      },
    },
    {
      text: 'SETTINGS.',
      action: () => {
        openWindow('settings');
        // setIsSettingShown(true);
      },
    },
  ];

  const recentFiles = globalConfig.misc.recentFiles.slice(0, 5);

  const recentFilesMenuOptions = recentFiles.map((file) => ({
    label: file.name,
    onSelect: () => {
      openExistingProject(file);
      setIsRecentMenuShown(false);
    },
  }));

  const startMenu: MenuListOption[] = [
    ...recentFilesMenuOptions,

    {
      label: 'close.',
      onSelect: () => {
        setIsRecentMenuShown(false);
        createNew();
      },
    },
  ];

  const openMenu: MenuListOption[] = [
    {
      label: '> create...',
      onSelect: () => {
        setIsOpenMenuShown(false);
        createNew();
      },
    },
    {
      label: '> existing project.',
      onSelect: () => {
        setIsOpenMenuShown(false);
        openProject();
      },
    },
    {
      label: '> from clipboard.',
      onSelect: () => {
        setIsOpenMenuShown(false);
        openProject();
      },
    },
  ];

  return (
    <div class={[getTheme(globalConfig.appearance.theme), styles.root].join(' ')}>
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
                <Show when={item.text === 'RECENT.' && isRecentMenuShown()}>
                  <MenuList options={startMenu} onClose={() => setIsRecentMenuShown(false)} />
                </Show>
                <Show when={item.text === '> OPEN.' && isOpenMenuShown()}>
                  <MenuList options={openMenu} onClose={() => setIsOpenMenuShown(false)} />
                </Show>
              </div>
            );
          }}
        </For>
      </div>
      <div class={styles.menuListRight}>
        <For each={rightItems}>
          {(item, i) => {
            return (
              <div class={styles.menuItem}>
                <a class={styles.menuItemText} onClick={(e) => item.action()}>
                  {item.text}
                </a>
                <div class={styles.menuItemBackground} />
              </div>
            );
          }}
        </For>
      </div>
      <div class={styles.menuItem} style={{ padding: '0 6px' }}>
        <a
          class={styles.menuItemText}
          style={{ 'font-family': ZFB09, 'font-size': '8px', opacity: 0.5 }}
          onClick={(e) => {
            openWindow('about');
          }}
        >
          ?
        </a>
        <div class={styles.menuItemBackground} />
      </div>
      {exportDialog}
    </div>
  );
};

export default TopMenuBar;
