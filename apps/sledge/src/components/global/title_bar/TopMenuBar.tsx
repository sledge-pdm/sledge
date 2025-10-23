import { css } from '@acab/ecsstatic';
import { color, fonts } from '@sledge/theme';
import { MenuList, MenuListOption } from '@sledge/ui';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Update } from '@tauri-apps/plugin-updater';
import { Component, createMemo, createSignal, For, onMount, Show } from 'solid-js';
import CanvasControlMenu from '~/components/global/title_bar/CanvasControlMenu';
import SaveSection from '~/components/global/title_bar/SaveSection';
import { createNew, openExistingProject, openProject } from '~/features/io/window';
import { fileStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { eventBus } from '~/utils/EventBus';
import { normalizeJoin } from '~/utils/FileUtils';
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

const saveSectionContainer = css`
  display: flex;
  flex-direction: row;
  align-self: center;
  margin-right: 8px;
`;

interface Item {
  id: string;
  text: string;
  action: () => void;
  menu?: MenuListOption[];
}

const TopMenuBar: Component = () => {
  let canvasControlsRef: HTMLDivElement | undefined;

  const [isDecorated, setIsDecorated] = createSignal(true);
  const [availableUpdate, setAvailableUpdate] = createSignal<Update | undefined>();

  onMount(async () => {
    setIsDecorated(await getCurrentWindow().isDecorated());
    const update = await getUpdate();
    setAvailableUpdate(update);
  });

  const leftItems = createMemo<Item[]>(() => [
    {
      id: 'project',
      text: 'Files.',
      action: () => {},
      menu: [
        {
          type: 'item',
          label: '+ new project.',
          onSelect: () => {
            createNew();
          },
        },
        {
          type: 'item',
          label: '> open project.',
          onSelect: () => {
            openProject();
          },
        },
        ...(fileStore.recentFiles.length > 0
          ? [
              { type: 'divider', label: 'recent' } as MenuListOption,
              { type: 'label', label: 'recent files.', fontFamily: fonts.ZFB03 } as MenuListOption,
              ...fileStore.recentFiles
                .map<MenuListOption | undefined>((loc) => {
                  if (!loc.name || !loc.path) return undefined;
                  return {
                    type: 'item',
                    label: normalizeJoin(loc.path, loc.name),
                    title: normalizeJoin(loc.path, loc.name),
                    fontFamily: fonts.ZFB03,
                    disabled: loc.path === fileStore.savedLocation.path && loc.name === fileStore.savedLocation.name,
                    onSelect: () => {
                      openExistingProject(loc);
                    },
                  };
                })
                .filter((item): item is Exclude<typeof item, undefined> => item !== undefined),
            ]
          : []),
      ],
    },
    {
      id: 'edit',
      text: 'Edit.',
      action: () => {},
      menu: [
        {
          type: 'item',
          label: 'Copy.',
          onSelect: () => {
            eventBus.emit('clipboard:doCopy', {});
          },
        },
        {
          type: 'item',
          label: 'Cut.',
          onSelect: () => {
            eventBus.emit('clipboard:doCut', {});
          },
        },
        {
          type: 'item',
          label: 'Paste.',
          onSelect: () => {
            eventBus.emit('clipboard:doPaste', {});
          },
        },
      ],
    },
  ]);
  const rightItems: Item[] = [
    {
      id: 'settings',
      text: 'SETTINGS.',
      action: () => {
        openWindow('settings');
      },
    },
  ];

  return (
    <div class={topMenuBarRoot}>
      <div class={menuListLeft}>
        <For each={leftItems()}>
          {(item, i) => {
            let containerRef: HTMLDivElement;
            const [menuOpen, setMenuOpen] = createSignal(false);
            return (
              <div ref={(el) => (containerRef = el)} class={menuItem}>
                <a
                  class={menuItemText}
                  onClick={(e) => {
                    if (item.menu) setMenuOpen(true);
                    item.action();
                  }}
                >
                  {item.text}
                </a>
                <div class={menuItemBackground} />
                <Show when={item.menu && menuOpen()}>
                  <MenuList
                    options={item.menu!}
                    onClose={() => setMenuOpen(false)}
                    style={{
                      'margin-top': '4px',
                      'border-color': color.onBackground,
                      'border-radius': '4px',
                      'min-width': '120px',
                    }}
                  />
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      <Show when={isDecorated()}>
        <div class={saveSectionContainer}>
          <SaveSection />
        </div>
      </Show>

      <div class={menuListCanvasControls} ref={canvasControlsRef}>
        <CanvasControlMenu />
      </div>

      <div class={menuListRight}>
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

      <Show when={availableUpdate() && !globalConfig.general.skippedVersions.includes(availableUpdate()?.version || '')}>
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
