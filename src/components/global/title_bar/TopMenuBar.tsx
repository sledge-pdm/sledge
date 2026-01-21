import { css } from '@acab/ecsstatic';
import { color, fonts, MenuListOption } from '@sledge-pdm/ui';
import { Component, createEffect, createMemo, createSignal, onMount, Show } from 'solid-js';
import CanvasControlMenu from '~/components/global/title_bar/CanvasControlMenu';
import SaveSection from '~/components/global/title_bar/SaveSection';
import { TopMenuBarItem, TopMenuBarItemProps } from '~/components/global/title_bar/TopMenuBarItem';
import { SECTION_TAB_CONTROLS } from '~/config/SectionTabConfig';
import { isTabControlVisible, toggleTabControlVisibility } from '~/features/config/TabControlController';
import { clipboardCopy, clipboardCut, clipboardPaste } from '~/features/io/clipboard/ClipboardActions';
import { tryGetImageFromClipboard } from '~/features/io/clipboard/ClipboardUtils';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { createNew, openExistingProject, openFromClipboard, openProject } from '~/features/io/window';
import { activeLayer } from '~/features/layer';
import { flipAllLayer, rotateAllLayer } from '~/features/layer/service';
import { isSelectionAvailable } from '~/features/selection/SelectionOperator';
import { createDefaultAppearanceStore, sanitizeAppearanceStore } from '~/stores/editor/AppearanceStore';
import { appearanceStore, ioStore, setAppearanceStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { normalizeJoin } from '~/utils/FileUtils';
import { dialog, window as platformWindow, Update } from '~/utils/platform';
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
  padding-left: 16px;
  padding-right: 8px;
  z-index: var(--zindex-title-bar);
`;

const menuListLeft = css`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  gap: 8px;
`;

const menuListCanvasControls = css`
  display: flex;
  flex-direction: row;
  height: 100%;
  align-items: center;
`;

const menuListRight = css`
  display: flex;
  flex-direction: row;
  margin-left: 8px;
`;

const saveSectionContainer = css`
  display: flex;
  flex-direction: row;
  align-self: center;
`;

const TopMenuBar: Component = () => {
  let canvasControlsRef: HTMLDivElement | undefined;

  const [isDecorated, setIsDecorated] = createSignal(true);
  const [availableUpdate, setAvailableUpdate] = createSignal<Update | undefined>();

  onMount(async () => {
    setIsDecorated(await platformWindow.getCurrentWindow().isDecorated());
    const update = await getUpdate();
    setAvailableUpdate(update);
  });

  createEffect(async () => {
    globalConfig.debug.updateChannel;
    const update = await getUpdate();
    setAvailableUpdate(update);
  });

  const getCurrentEditTarget = () => {
    if (isSelectionAvailable()) {
      return 'selection';
    }
    return `layer: ${activeLayer()?.name}`;
  };

  const FilesMenuItem = createMemo<TopMenuBarItemProps>(() => {
    return {
      label: 'Files.',
      action: () => {},
      menu: () => [
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
        {
          type: 'item',
          label: '> from clipboard.',
          onSelect: async () => {
            // clipboard data will loaded in new window, but ensure there's data
            const ensureData = await tryGetImageFromClipboard();
            if (!ensureData) {
              const confirmed = await dialog.confirm(`Current clipboard data may not be an loadable Image.\nOpen anyway?`, {
                title: 'Open from clipboard',
              });
              if (!confirmed) return;
            }

            openFromClipboard();
          },
        },
        ...(ioStore.recentFiles.length > 0
          ? [
              { type: 'divider', label: 'recent' } as MenuListOption,
              { type: 'label', label: 'recent files.', fontFamily: fonts.ZFB03 } as MenuListOption,
              ...ioStore.recentFiles
                .map<MenuListOption | undefined>((loc) => {
                  if (!loc.name || !loc.path) return undefined;
                  return {
                    type: 'item',
                    label: normalizeJoin(loc.path, loc.name),
                    title: normalizeJoin(loc.path, loc.name),
                    fontFamily: fonts.ZFB03,
                    disabled: loc.path === ioStore.savedLocation.path && loc.name === ioStore.savedLocation.name,
                    onSelect: () => {
                      openExistingProject(loc);
                    },
                  };
                })
                .filter((item): item is Exclude<typeof item, undefined> => item !== undefined),
            ]
          : []),
      ],
    };
  });

  const ViewMenuItem = createMemo<TopMenuBarItemProps>(() => {
    return {
      label: 'View.',
      action: () => {},
      menu: () => [
        {
          type: 'label',
          label: 'canvas',
        },
        {
          label: 'ruler',
          type: 'item',
          icon: appearanceStore.ruler ? '/assets/icons/misc/check_8.png' : undefined,
          onSelect: () => {
            setAppearanceStore('ruler', (v) => !v);
          },
          retainAfterSelect: true,
        },
        {
          label: 'onscreen control',
          type: 'item',
          icon: appearanceStore.onscreenControl ? '/assets/icons/misc/check_8.png' : undefined,
          onSelect: () => {
            setAppearanceStore('onscreenControl', (v) => !v);
          },
          retainAfterSelect: true,
        },
        {
          type: 'label',
          label: 'tab',
        },
        ...SECTION_TAB_CONTROLS.map((control) => {
          const shown = isTabControlVisible(control.id);
          return {
            label: control.id,
            type: 'item',
            icon: shown ? '/assets/icons/misc/check_8.png' : undefined,
            title: control.id,
            onSelect: () => {
              // toggle Controls' visibility, not show/hide content
              toggleTabControlVisibility(control.id);
            },
            retainAfterSelect: true,
          } as MenuListOption;
        }),
        {
          type: 'item',
          label: 'reset to default.',
          onSelect: async () => {
            const sanitizedDefault = sanitizeAppearanceStore(createDefaultAppearanceStore());
            setAppearanceStore(sanitizedDefault);
            await saveEditorStateImmediate();
          },
          color: color.muted,
        },
      ],
    };
  });

  const EditMenuItem = createMemo<TopMenuBarItemProps>(() => {
    return {
      label: 'Edit.',
      action: () => {},
      menu: () => [
        {
          type: 'label',
          label: getCurrentEditTarget(),
        },
        {
          type: 'item',
          label: 'Copy.',
          onSelect: async () => await clipboardCopy(),
        },
        {
          type: 'item',
          label: 'Cut.',
          onSelect: async () => await clipboardCut(),
        },
        {
          type: 'item',
          label: 'Paste.',
          onSelect: async () => await clipboardPaste(),
        },
        {
          type: 'label',
          label: 'canvas',
        },
        {
          type: 'item',
          label: 'flip horizontally.',
          icon: '/assets/icons/context_menu/flip_horizontal.png',
          onSelect: () => flipAllLayer({ flipX: true }),
        },
        {
          type: 'item',
          label: 'flip vertically.',
          icon: '/assets/icons/context_menu/flip_vertical.png',
          onSelect: () => flipAllLayer({ flipY: true }),
        },
        {
          type: 'item',
          label: 'rotate 90 (right).',
          icon: '/assets/icons/context_menu/canvas_rotate_clockwise.png',
          // layer coordinate ccw = canvas cw
          onSelect: () => rotateAllLayer('ccw'),
        },
        {
          type: 'item',
          label: 'rotate 90 (left).',
          icon: '/assets/icons/context_menu/canvas_rotate_counterclockwise.png',
          // layer coordinate ccw = canvas cw
          onSelect: () => rotateAllLayer('cw'),
        },
      ],
    };
  });

  const settingMenuItem: TopMenuBarItemProps = {
    label: 'SETTINGS.',
    action: () => {
      openWindow('settings');
    },
  };

  return (
    <div class={topMenuBarRoot}>
      <div class={menuListLeft}>
        <TopMenuBarItem {...FilesMenuItem()} />
        <TopMenuBarItem {...ViewMenuItem()} />
        <Show when={!ioStore.isInInitialLoading}>
          <TopMenuBarItem {...EditMenuItem()} />
        </Show>
      </div>

      <div class={menuListCanvasControls} ref={canvasControlsRef}>
        <Show when={!ioStore.isInInitialLoading}>
          <CanvasControlMenu />
        </Show>
      </div>

      <Show when={!ioStore.isInInitialLoading && isDecorated()}>
        <div class={saveSectionContainer}>
          <SaveSection />
        </div>
      </Show>

      <div class={menuListRight}>
        <TopMenuBarItem {...settingMenuItem} />
      </div>

      <Show when={availableUpdate() && !globalConfig.general.skippedVersions.includes(availableUpdate()?.version || '')}>
        <TopMenuBarItem
          label='! update'
          labelStyleOverride={{
            'font-family': 'ZFB09',
            'font-size': '8px',
            opacity: 1,
            'white-space': 'nowrap',
            color: color.active,
          }}
          action={async () => {
            await askAndInstallUpdate();
          }}
        />
        <TopMenuBarItem
          label='[skip]'
          labelStyleOverride={{
            'font-family': 'ZFB09',
            opacity: 1,
            'white-space': 'nowrap',
            color: color.muted,
          }}
          title={'You can restore skipped updates from settings.'}
          action={() => {
            const skippingVersion = availableUpdate()?.version;
            if (skippingVersion) {
              addSkippedVersion(skippingVersion);
            }
          }}
        />
      </Show>
    </div>
  );
};

export default TopMenuBar;
