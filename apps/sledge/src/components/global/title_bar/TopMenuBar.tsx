import { FileLocation, flexRow } from '@sledge/core';
import { vars, ZFB09 } from '@sledge/theme';
import { MenuList, MenuListOption } from '@sledge/ui';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Update } from '@tauri-apps/plugin-updater';
import { Component, createEffect, createSignal, For, onMount, Show } from 'solid-js';
import ExportDialog from '~/components/global/dialogs/ExportDialog';
import SettingDialog from '~/components/global/dialogs/SettingDialog';
import SaveSection from '~/components/global/title_bar/SaveSection';
import { createNew, openExistingProject, openProject } from '~/io/window';
import { globalConfig } from '~/stores/GlobalStores';
import { menuItem, menuItemBackground, menuItemText, menuListLeft, menuListRight, root } from '~/styles/globals/top_menu_bar.css';
import { askAndInstallUpdate, getUpdate } from '~/utils/UpdateUtils';
import { addSkippedVersion } from '~/utils/VersionUtils';
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

  const [isDecorated, setIsDecorated] = createSignal(true);
  const [availableUpdate, setAvailableUpdate] = createSignal<Update | undefined>();
  onMount(async () => {
    setIsDecorated(await getCurrentWindow().isDecorated());
    const update = await getUpdate();
    setAvailableUpdate(update);
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
    // {
    //   text: 'EXPORT.',
    //   action: () => {
    //     setIsExportShown(true);
    //   },
    // },
    {
      text: 'SETTINGS.',
      action: () => {
        openWindow('settings');
        // setIsSettingShown(true);
      },
    },
    {
      text: 'ABOUT.',
      action: () => {
        openWindow('about');
        // setIsSettingShown(true);
      },
    },
  ];

  const recentFiles = globalConfig.misc.recentFiles.slice(0, 5);

  const recentFilesMenuOptions = recentFiles.map((file: FileLocation) => ({
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
    // {
    //   label: '> from clipboard.',
    //   onSelect: () => {
    //     setIsOpenMenuShown(false);
    //     openProject();
    //   },
    // },
  ];

  return (
    <div class={root}>
      <div class={menuListLeft}>
        <For each={leftItems}>
          {(item, i) => {
            let containerRef: HTMLDivElement;
            return (
              <div ref={(el) => (containerRef = el)} class={menuItem}>
                <a class={menuItemText} onClick={(e) => item.action()}>
                  {item.text}
                </a>
                <div class={menuItemBackground} />
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
      <div class={menuListRight}>
        <Show when={isDecorated()}>
          <div class={flexRow} style={{ 'align-self': 'center' }}>
            <SaveSection />
          </div>
        </Show>
        <For each={rightItems}>
          {(item, i) => {
            return (
              <div class={menuItem}>
                <a class={menuItemText} onClick={(e) => item.action()}>
                  {item.text}
                </a>
                <div class={menuItemBackground} />
              </div>
            );
          }}
        </For>
      </div>
      <Show when={availableUpdate() && !globalConfig.misc.skippedVersions.includes(availableUpdate()?.version || '')}>
        <div class={menuItem}>
          <a
            class={menuItemText}
            style={{
              'font-family': ZFB09,
              'font-size': '8px',
              opacity: 1,
              'white-space': 'nowrap',
              color: vars.color.active,
            }}
            onClick={async (e) => {
              await askAndInstallUpdate();
            }}
          >
            ! update
          </a>
          <div class={menuItemBackground} />
        </div>
        <div class={menuItem} style={{ 'margin-left': '-4px', 'margin-right': '0px' }}>
          <a
            class={menuItemText}
            style={{
              'font-family': ZFB09,
              'font-size': '8px',
              opacity: 1,
              'white-space': 'nowrap',
              color: vars.color.muted,
            }}
            title={'You can restore skipped updates from settings.'}
            onClick={(e) => {
              const skippingVersion = availableUpdate()?.version;
              if (skippingVersion) {
                addSkippedVersion(skippingVersion);
              }
            }}
          >
            [skip]
          </a>
          <div class={menuItemBackground} />
        </div>
      </Show>
      <div class={menuItem} style={{ 'margin-right': '8px' }}></div>
      {exportDialog}
    </div>
  );
};

export default TopMenuBar;
