import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge/core';
import { color } from '@sledge/theme';
import { MenuList, MenuListOption } from '@sledge/ui';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Update } from '@tauri-apps/plugin-updater';
import { Component, createSignal, For, onMount, Show } from 'solid-js';
import CanvasTempControls from '~/components/global/title_bar/CanvasTempControls';
import SaveSection from '~/components/global/title_bar/SaveSection';
import { createNew, openExistingProject, openProject } from '~/features/io/window';
import { globalConfig } from '~/stores/GlobalStores';
import { askAndInstallUpdate, getUpdate } from '~/utils/UpdateUtils';
import { addSkippedVersion } from '~/utils/VersionUtils';
import { openWindow } from '~/utils/WindowUtils';

const topMenuBarRoot = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-controls);
  height: 28px;
  align-items: end;
  z-index: var(--zindex-title-bar);
`;

const menuListLeft = css`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  padding-left: 16px;
  gap: var(--spacing-xs);
`;

const menuListCanvasControls = css`
  display: flex;
  flex-direction: row;
  height: 100%;
  align-items: center;
  margin-right: 6px;
`;

const menuListRight = css`
  display: flex;
  flex-direction: row;
  margin-right: 6px;
`;

const menuItem = css`
  display: flex;
  flex-direction: row;
  position: relative;
  justify-content: center;
  align-items: center;
  height: 26px;
`;

const menuItemText = css`
  font-family: ZFB11;
  font-size: 8px;
  text-rendering: geometricPrecision;
  margin: 0;
  align-content: center;
  text-align: center;
  width: 100%;
  height: 30px;
  margin-left: 8px;
  margin-right: 8px;
`;

const menuItemBackground = css`
  display: flex;
  flex-direction: row;
  position: absolute;
  align-items: center;
  left: 0;
  right: 0;
  height: 26px;
  z-index: -1;
`;

const versionContainer = css`
  display: flex;
  flex-direction: row;
  align-self: center;
`;

interface Item {
  text: string;
  action: () => void;
}

const TopMenuBar: Component = () => {
  let canvasControlsRef: HTMLDivElement | undefined;

  const [isRecentMenuShown, setIsRecentMenuShown] = createSignal(false);
  const [isOpenMenuShown, setIsOpenMenuShown] = createSignal(false);

  const [isDecorated, setIsDecorated] = createSignal(true);
  const [availableUpdate, setAvailableUpdate] = createSignal<Update | undefined>();

  onMount(async () => {
    setIsDecorated(await getCurrentWindow().isDecorated());
    const update = await getUpdate();
    setAvailableUpdate(update);
  });

  const leftItems: Item[] = [
    {
      text: 'START.',
      action: () => {
        openWindow('start');
      },
    },
    // {
    //   text: '+ NEW',
    //   action: () => {
    //     createNew();
    //   },
    // },
    {
      text: '+ OPEN.',
      action: () => {
        setIsOpenMenuShown(true);
      },
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
      label: '+ new project.',
      onSelect: () => {
        setIsOpenMenuShown(false);
        createNew();
      },
    },
    {
      label: '> open project.',
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
    <div class={topMenuBarRoot}>
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
                <Show when={item.text === '+ OPEN.' && isOpenMenuShown()}>
                  <MenuList options={openMenu} onClose={() => setIsOpenMenuShown(false)} />
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      <div class={menuListCanvasControls} ref={canvasControlsRef}>
        <CanvasTempControls />
      </div>

      <div class={menuListRight}>
        <Show when={isDecorated()}>
          <div class={versionContainer}>
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
              'font-family': 'ZFB09',
              'font-size': '8px',
              opacity: 1,
              'white-space': 'nowrap',
              color: color.active,
            }}
            onClick={async (e) => {
              await askAndInstallUpdate();
            }}
          >
            ! update
          </a>
          <div class={menuItemBackground} />
        </div>
        <div class={menuItem}>
          <a
            class={menuItemText}
            style={{
              'font-family': 'ZFB09',
              'font-size': '8px',
              opacity: 1,
              'white-space': 'nowrap',
              color: color.muted,
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
    </div>
  );
};

export default TopMenuBar;
