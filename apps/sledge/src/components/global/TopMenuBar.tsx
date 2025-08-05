import { getLatestVersion } from '@sledge/core';
import { getTheme, vars, ZFB09 } from '@sledge/theme';
import { MenuList, MenuListOption } from '@sledge/ui';
import * as styles from '@styles/globals/top_menu_bar.css';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-shell';
import { Component, createEffect, createSignal, For, onMount, Show } from 'solid-js';
import ExportDialog from '~/components/dialogs/ExportDialog';
import SettingDialog from '~/components/dialogs/SettingDialog';
import SaveSection from '~/components/global/SaveSection';
import { createNew, openExistingProject, openProject } from '~/controllers/project/window';
import { globalConfig } from '~/stores/GlobalStores';
import { addSkippedVersion, isNewVersionAvailable } from '~/utils/VersionUtils';
import { openWindow } from '~/utils/WindowUtils';

interface Item {
  text: string;
  action: () => void;
}

const TopMenuBar: Component = () => {
  const releaseApiUrl =
    import.meta.env.VITE_GITHUB_REST_API_URL +
    '/repos/' +
    import.meta.env.VITE_GITHUB_OWNER +
    '/' +
    import.meta.env.VITE_GITHUB_REPO +
    '/releases/latest';

  const [isRecentMenuShown, setIsRecentMenuShown] = createSignal(false);
  const [isOpenMenuShown, setIsOpenMenuShown] = createSignal(false);

  const [isExportShown, setIsExportShown] = createSignal(false);
  const [isSettingShown, setIsSettingShown] = createSignal(false);
  let exportDialog = null;
  let settingDialog = null;

  const [isDecorated, setIsDecorated] = createSignal(true);
  const [latestVersion, setLatestVersion] = createSignal<string | undefined>();
  const [newVersionAvailable, setNewVersionAvailable] = createSignal(false);
  onMount(async () => {
    setIsDecorated(await getCurrentWindow().isDecorated());
    setLatestVersion((await getLatestVersion(releaseApiUrl)) ?? undefined);
    const isAvailable = await isNewVersionAvailable(true);
    setNewVersionAvailable(true);
  });

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
      text: 'START.',
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
    label: file.name || '[error]',
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
        <Show when={isDecorated()}>
          <SaveSection />
          <div style={{ width: '8px' }} />
        </Show>
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
      <Show when={newVersionAvailable()}>
        <div class={styles.menuItem}>
          <a
            class={styles.menuItemText}
            style={{
              'font-family': ZFB09,
              'font-size': '8px',
              opacity: 1,
              'white-space': 'nowrap',
              color: vars.color.active,
            }}
            onClick={(e) => {
              // open(`https://github.com/Innsbluck-rh/sledge/releases/tag/${latestVersion()}`);
              open('https://www.sledge-rules.app');
            }}
          >
            ! update available
          </a>
          <div class={styles.menuItemBackground} />
        </div>
        <div class={styles.menuItem} style={{ 'margin-right': '6px' }}>
          <a
            class={styles.menuItemText}
            style={{
              'font-family': ZFB09,
              'font-size': '8px',
              opacity: 1,
              'white-space': 'nowrap',
              color: vars.color.muted,
            }}
            onClick={(e) => {
              addSkippedVersion(latestVersion()!);
              setNewVersionAvailable(false);
              setLatestVersion(undefined);
            }}
          >
            [skip]
          </a>
          <div class={styles.menuItemBackground} />
        </div>
      </Show>
      <div class={styles.menuItem} style={{ 'margin-right': '6px' }}>
        <a
          class={styles.menuItemText}
          style={{ 'font-family': ZFB09, 'font-size': '8px', opacity: 0.5, width: 'fit-content' }}
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
