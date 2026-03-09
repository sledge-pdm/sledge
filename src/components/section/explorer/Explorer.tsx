import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge-pdm/core';
import { color, Dropdown, DropdownOption, Icon, MenuList, Nothing } from '@sledge-pdm/ui';
import { Component, createEffect, createMemo, createSignal, For, Match, onCleanup, onMount, Show, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import Breadcrumbs from '~/components/section/explorer/Breadcrumbs';
import FileItem, { FilesConfig } from '~/components/section/explorer/item/FileItem';
import { getParentDirectory, normalizeDirectoryPath } from '~/components/section/explorer/utils/path';
import { showTabContent } from '~/features/config/TabContentController';
import { isOpenableFile } from '~/features/io/Extensions';
import { appearanceStore, ioStore, setAppearanceStore } from '~/stores/EditorStores';
import { exportDir, getDefinedDriveLetters, normalizeJoin, normalizePath } from '~/utils/FileUtils';
import { revealInFileBrowser } from '~/utils/NativeOpener';
import { dialog, DirEntry, fs } from '~/utils/platform';
import { openExportWithPath } from '../export/Export';
import { useExplorerNavigation } from './utils/useExplorerNavigation';

const explorerContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-left: 8px;
  gap: 8px;
`;

const explorerInner = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const navigationPanel = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const navigationRow = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  background: var(--color-surface);
  padding: 4px 8px;
`;

const menuButtonContainer = css`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const iconButton = css`
  padding: 3px;
  cursor: pointer;
`;

const pathInput = css`
  font-family: PM10;
  font-size: 10px;
  letter-spacing: 1px;
  padding: 0;
  flex-grow: 1;
`;

const controlsRow = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 6px;
  align-items: center;
`;

const controlButtonsRow = css`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  margin-left: auto;
`;

const entriesContainer = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: auto;
  overflow: hidden;
  flex-wrap: wrap;
`;

const errorText = css`
  color: var(--color-error);
`;

const Explorer: Component = () => {
  let inputRef: HTMLInputElement | undefined = undefined;

  const [configStore, setConfigStore] = createStore<FilesConfig>({
    showOnlySledgeOpenable: true,
    twoColumns: false,
    pathEditMode: false,
  });
  const { currentPath, setCurrentPath, push, back, forward } = useExplorerNavigation('');
  createEffect(async () => {
    const newPath = currentPath();
    if (newPath) {
      // update store
      setAppearanceStore('explorerPath', newPath);
      // update explorer entries
      const normalized = normalizePath(newPath);
      try {
        const dirEntries = await fs.readDir(normalized);
        if (currentPath() !== newPath) return;
        sortEntries(dirEntries);
        setEntries(dirEntries);
      } catch (e) {
        // handle error
        await dialog.message(`Couldn't open directory.\n${normalized}`, {
          kind: 'warning',
          title: 'Explorer',
          okLabel: 'OK',
        });
      }
    }
  });

  const [entries, setEntries] = createSignal<DirEntry[] | undefined>([]);
  const visibleEntries = createMemo<DirEntry[] | undefined>(() => {
    const currentEntries = entries();
    if (!currentEntries) return currentEntries;
    if (!configStore.showOnlySledgeOpenable) return currentEntries;
    return currentEntries.filter((entry) => {
      if (!entry.isFile) return true;
      return isOpenableFile(entry.name);
    });
  });
  const [pathDraft, setPathDraft] = createSignal<string>('');
  const [driveLetters, setDriveLetters] = createSignal<string[] | undefined>(undefined);

  let skipBlurApply = false;

  const driveRootFromLetter = (letter: string | undefined): string | undefined => {
    if (!letter) return undefined;
    const upper = letter.trim().toUpperCase();
    if (!upper || upper.length === 0 || !/^[A-Z]$/.test(upper)) return undefined;
    const normalized = normalizeDirectoryPath(`${upper}:`);
    return normalized || undefined;
  };

  const driveRootFromPath = (path: string | undefined): string | undefined => {
    if (!path) return undefined;
    const normalized = normalizeDirectoryPath(path);
    if (!normalized) return undefined;
    const match = normalized.match(/^([a-zA-Z]):/);
    if (!match) return undefined;
    return driveRootFromLetter(match[1]);
  };

  const sortEntries = (items: DirEntry[]): DirEntry[] => {
    return items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const applyPathDraft = async () => {
    const rawDraft = pathDraft();
    if (rawDraft.trim()) {
      const normalizedDraft = normalizeDirectoryPath(rawDraft);
      if (normalizedDraft && normalizedDraft !== currentPath()) {
        // prevent pushing same path
        push(normalizedDraft);
      }
    }
    setPathDraft(currentPath());
    setConfigStore('pathEditMode', false);
  };

  const handleMouseDown = (e: MouseEvent) => {
    // prevent if canvas area focused
    if ((e.target as HTMLElement).closest('#canvas-area')) return;

    if (e.button === 3) {
      e.preventDefault();
      back();
    } else if (e.button === 4) {
      e.preventDefault();
      forward();
    }
  };

  onMount(async () => {
    const openPath = ioStore.savedLocation.path ? normalizePath(ioStore.savedLocation.path) : undefined;
    const fallbackPath = await exportDir();
    const editorSavedPath = appearanceStore.explorerPath ?? undefined;
    const defaultPath = editorSavedPath ?? openPath ?? fallbackPath;
    if (defaultPath) {
      setPathDraft(defaultPath);
      setCurrentPath(defaultPath);
    }

    setDriveLetters(await getDefinedDriveLetters());

    window.addEventListener('mousedown', handleMouseDown);
  });

  onCleanup(() => {
    window.removeEventListener('mousedown', handleMouseDown);
  });

  const enterEditMode = () => {
    setPathDraft(currentPath());
    setConfigStore('pathEditMode', true);
    skipBlurApply = false;
    setTimeout(() => {
      inputRef?.focus();
      inputRef?.select();
    }, 0);
  };

  const [isMenuOpened, setMenuOpened] = createSignal<boolean>(false);

  return (
    <div class={explorerContainer}>
      <Show when={driveLetters()}>
        <div class={controlsRow}>
          <Dropdown
            align='left'
            wheelSpin={false}
            options={driveLetters()!
              .map((letter) => driveRootFromLetter(letter))
              .filter((root): root is string => !!root)
              .map<DropdownOption<string>>((root) => ({
                label: root,
                value: root,
              }))}
            value={driveRootFromPath(currentPath()) ?? ''}
            onChange={async (v) => {
              setPathDraft(v);
              push(v);
            }}
          />
          <div class={controlButtonsRow}>
            <div class={iconButton} onClick={() => enterEditMode()}>
              <Icon src={'/assets/icons/files/edit.png'} base={8} hoverColor={color.accent} />
            </div>
            <div
              class={iconButton}
              onClick={() => {
                const parent = getParentDirectory(currentPath());
                if (parent) push(parent);
              }}
            >
              <Icon src={'/assets/icons/files/folder_up.png'} base={8} hoverColor={color.accent} />
            </div>
            <div class={iconButton} onClick={() => setConfigStore('twoColumns', (v) => !v)}>
              <Icon
                src={configStore.twoColumns ? '/assets/icons/files/two_column.png' : '/assets/icons/files/one_column.png'}
                base={8}
                hoverColor={color.accent}
              />
            </div>
            <div class={iconButton} title='show only files that sledge can open.' onClick={() => setConfigStore('showOnlySledgeOpenable', (v) => !v)}>
              <Icon src={'/assets/icons/files/file_sledge.png'} base={8} color={configStore.showOnlySledgeOpenable ? color.enabled : color.muted} />
            </div>
            <div class={menuButtonContainer}>
              <div
                class={iconButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpened(!isMenuOpened());
                }}
              >
                <Icon src={'/assets/icons/misc/vert_dots.png'} base={8} hoverColor={color.accent} />
              </div>
              <Show when={isMenuOpened()}>
                <MenuList
                  align='right'
                  onClose={() => setMenuOpened(false)}
                  closeByOutsideClick
                  style={{ 'margin-top': '4px', 'margin-left': '-8px' }}
                  options={[
                    {
                      type: 'item',
                      label: 'open in explorer',
                      onSelect: async () => {
                        await revealInFileBrowser(currentPath());
                      },
                    },
                    {
                      type: 'item',
                      label: 'back to saved folder',
                      disabled: !ioStore.savedLocation.path || !ioStore.savedLocation.name,
                      onSelect: () => {
                        if (ioStore.savedLocation.path) push(ioStore.savedLocation.path);
                      },
                    },
                    {
                      type: 'item',
                      label: 'Export to this folder',
                      onSelect: () => {
                        showTabContent('export', 'rightSide');
                        openExportWithPath(currentPath());
                      },
                    },
                  ]}
                />
              </Show>
            </div>
          </div>
        </div>
      </Show>
      <div class={explorerInner}>
        <div class={navigationPanel}>
          <div class={navigationRow} onDblClick={() => enterEditMode()}>
            <Show when={configStore.pathEditMode} fallback={<Breadcrumbs path={currentPath()} onNavigate={(value) => push(value)} />}>
              <input
                ref={(ref) => (inputRef = ref)}
                class={pathInput}
                style={{
                  opacity: configStore.pathEditMode ? 1 : 0.4,
                }}
                value={pathDraft()}
                onInput={(e) => {
                  setPathDraft(e.currentTarget.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    skipBlurApply = false;
                    inputRef?.blur();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    skipBlurApply = true;
                    setPathDraft(currentPath());
                    setConfigStore('pathEditMode', false);
                    inputRef?.blur();
                  }
                }}
                onBlur={async () => {
                  if (skipBlurApply) {
                    skipBlurApply = false;
                    return;
                  }
                  if (!configStore.pathEditMode) return;
                  await applyPathDraft();
                }}
              />
            </Show>
          </div>
        </div>

        <div class={entriesContainer}>
          <Switch
            fallback={
              <For each={visibleEntries()}>
                {(entry) => {
                  const path = normalizeJoin(currentPath(), entry.name);
                  const location: FileLocation = {
                    name: entry.name,
                    path: currentPath(),
                  };

                  const openPath =
                    ioStore.savedLocation.path && ioStore.savedLocation.name
                      ? normalizeJoin(ioStore.savedLocation.path, ioStore.savedLocation.name)
                      : undefined;
                  const isMe = openPath && openPath === path;
                  const isPartOfMe = openPath && openPath.startsWith(path.endsWith('/') ? path : path + '/');

                  return (
                    <FileItem
                      config={configStore}
                      location={location}
                      entry={entry}
                      isMe={!!isMe}
                      isPartOfMe={!!isPartOfMe}
                      onClick={() => {
                        if (entry.isDirectory) {
                          push(path);
                          return true;
                        }
                        return false;
                      }}
                    />
                  );
                }}
              </For>
            }
          >
            <Match when={entries() === undefined}>
              <p class={errorText}>failed to open directory.</p>
            </Match>
            <Match when={entries() !== undefined && (visibleEntries()?.length ?? 0) === 0}>
              <Nothing>no files.</Nothing>
              <Show when={configStore.showOnlySledgeOpenable}>
                <Nothing>try turning off filter config.</Nothing>
              </Show>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default Explorer;
