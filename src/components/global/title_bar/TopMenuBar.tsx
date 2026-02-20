import { css } from '@acab/ecsstatic';
import { color, fonts, MenuListOption } from '@sledge-pdm/ui';
import { Component, createMemo, createSignal, onMount, Show } from 'solid-js';
import CanvasControlMenu from '~/components/global/title_bar/CanvasControlMenu';
import { TopMenuBarItem, TopMenuBarItemProps } from '~/components/global/title_bar/TopMenuBarItem';
import { SECTION_TAB_CONTROLS } from '~/config/SectionTabConfig';
import { adjustZoomToFit } from '~/features/canvas';
import { isTabControlVisible, toggleTabControlVisibility } from '~/features/config/TabControlController';
import { clipboardCopy, clipboardCut, clipboardPaste } from '~/features/io/clipboard/ClipboardActions';
import { tryGetImageFromClipboard } from '~/features/io/clipboard/ClipboardUtils';
import { saveEditorStateImmediate } from '~/features/io/editor/save';
import { ProjectLoader } from '~/features/io/project/ProjectLoader';
import { openExistingProject, openNewEditorWindow, openNewProjectWithClipboard, openProjectWithExplorer } from '~/features/io/window';
import { activeLayer } from '~/features/layer';
import { flipAllLayer, rotateAllLayer } from '~/features/layer/service';
import { selectionManager } from '~/features/selection/SelectionManager';
import { createDefaultAppearanceStore, sanitizeAppearanceStore } from '~/stores/editor/AppearanceStore';
import { appearanceStore, ioStore, setAppearanceStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { normalizeJoin } from '~/utils/FileUtils';
import { dialog, window as platformWindow } from '~/utils/platform';
import { openWindow } from '~/utils/WindowUtils';
import SaveSection from './SaveSection';
import { UpdateSection } from './UpdateSection';

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
`;

const saveSectionContainer = css`
  display: flex;
  flex-direction: row;
  align-self: center;
`;

const itemsContainer = css`
  margin-left: 8px;
`;

const TopMenuBar: Component = () => {
  let canvasControlsRef: HTMLDivElement | undefined;

  const [isDecorated, setIsDecorated] = createSignal(true);
  onMount(async () => {
    setIsDecorated(await platformWindow.getCurrentWindow().isDecorated());
  });

  const getCurrentEditTarget = () => {
    if (selectionManager.hasSelection()) {
      return 'selection';
    }
    return `layer: ${activeLayer()?.name}`;
  };

  const recentFileItems = createMemo<MenuListOption[]>(() => {
    if (ioStore.recentFiles.length > 0) {
      return [
        { type: 'label', label: 'recent files.', fontFamily: fonts.ZFB03 },
        ...ioStore.recentFiles
          .toReversed()
          .map<MenuListOption | undefined>((loc) => {
            if (!loc.name || !loc.path) return undefined;
            const fullpath = normalizeJoin(loc.path, loc.name);
            return {
              type: 'item',
              label: fullpath,
              title: fullpath,
              // fontFamily: fonts.ZFB03,
              icon: ProjectLoader.isProjectPath(fullpath) ? '/assets/icons/files/file_sledge.png' : '/assets/icons/files/image.png',
              disabled: loc.path === ioStore.savedLocation.path && loc.name === ioStore.savedLocation.name,
              onSelect: () => {
                openExistingProject(loc);
              },
            };
          })
          .filter((item): item is Exclude<typeof item, undefined> => item !== undefined),
      ];
    }

    return [];
  });

  const FilesMenuItem = createMemo<TopMenuBarItemProps>(() => {
    return {
      label: 'Files.',
      action: () => {},
      menu: () =>
        [
          {
            type: 'item',
            label: 'new project.',
            icon: '/assets/icons/title_bar/addadd.png',
            onSelect: () => {
              openNewEditorWindow(ProjectLoader.getRequestFromNew({ ...globalConfig.default.canvasSize }));
            },
          },
          {
            type: 'item',
            label: 'open project.',
            icon: '/assets/icons/title_bar/open_folder.png',
            onSelect: () => {
              openProjectWithExplorer();
            },
          },
          ...(import.meta.env.DEV
            ? [
                {
                  type: 'item',
                  label: 'reload project.',
                  icon: '/assets/icons/title_bar/reload.png',
                  onSelect: async () => {
                    const confirmed = await dialog.confirm(`Sure to reload this project?
Unsaved changes will be discarded!`);
                    if (confirmed) {
                      const loc = ioStore.savedLocation;
                      if (!loc.path || !loc.name) {
                        await dialog.message('Failed to reload project. (invalid path)');
                        return;
                      }
                      const result = await ProjectLoader.fromPath({ path: normalizeJoin(loc.path, loc.name) }).load();
                      if (result.ok) {
                        adjustZoomToFit();
                      } else {
                        await dialog.message(`Failed to reload project. (load failed)\n${result.error ?? 'unknown error'}`);
                        return;
                      }
                    }
                  },
                },
              ]
            : []),
          {
            type: 'item',
            label: 'from clipboard.',
            icon: '/assets/icons/title_bar/clipboard.png',
            onSelect: async () => {
              // clipboard data will loaded in new window, but ensure there's data
              const ensureData = await tryGetImageFromClipboard();
              if (!ensureData) {
                const confirmed = await dialog.confirm(`Current clipboard data may not be an loadable Image.\nOpen anyway?`, {
                  title: 'Open from clipboard',
                });
                if (!confirmed) return;
              }
              openNewProjectWithClipboard();
            },
          },
          { type: 'divider', label: 'recent' },
          ...recentFileItems(),
        ] as MenuListOption[],
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
          icon: appearanceStore.ruler ? '/assets/icons/misc/check_8.png' : '/assets/icons/misc/empty.png',
          onSelect: () => {
            setAppearanceStore('ruler', (v) => !v);
          },
          retainAfterSelect: true,
        },
        {
          label: 'onscreen control',
          type: 'item',
          icon: appearanceStore.onscreenControl ? '/assets/icons/misc/check_8.png' : '/assets/icons/misc/empty.png',
          onSelect: () => {
            setAppearanceStore('onscreenControl', (v) => !v);
          },
          retainAfterSelect: true,
        },
        { type: 'divider', label: 'tab' },
        {
          type: 'label',
          label: 'tab',
        },
        ...SECTION_TAB_CONTROLS.map((control) => {
          const shown = isTabControlVisible(control.id);
          return {
            label: control.id,
            type: 'item',
            icon: shown ? '/assets/icons/misc/check_8.png' : '/assets/icons/misc/empty.png',
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
            await saveEditorStateImmediate(['appearanceStore']);
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
          icon: '/assets/icons/context_menu/copy.png',
          onSelect: async () => await clipboardCopy(),
        },
        {
          type: 'item',
          label: 'Cut.',
          icon: '/assets/icons/context_menu/cut.png',
          onSelect: async () => await clipboardCut(),
        },
        {
          type: 'item',
          label: 'Paste.',
          icon: '/assets/icons/context_menu/paste.png',
          onSelect: async () => await clipboardPaste(),
        },
        { type: 'divider', label: 'canvas' },
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
        <TopMenuBarItem {...FilesMenuItem()} menuStyleOverride={{ 'max-width': '400px' }} />
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

      <UpdateSection />

      <div class={menuListRight}>
        <div class={itemsContainer}>
          <TopMenuBarItem {...settingMenuItem} />
        </div>
      </div>
    </div>
  );
};

export default TopMenuBar;
