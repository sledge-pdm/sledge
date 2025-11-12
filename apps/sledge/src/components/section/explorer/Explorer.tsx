import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge/core';
import { color } from '@sledge/theme';
import { Dropdown, DropdownOption, Icon, MenuList } from '@sledge/ui';
import { message } from '@tauri-apps/plugin-dialog';
import { DirEntry, readDir } from '@tauri-apps/plugin-fs';
import { openPath } from '@tauri-apps/plugin-opener';
import { Component, createEffect, createMemo, createSignal, For, Match, onMount, Show, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import Breadcrumbs from '~/components/section/explorer/Breadcrumbs';
import FileItem, { FilesConfig } from '~/components/section/explorer/item/FileItem';
import { getParentDirectory, normalizeDirectoryPath } from '~/components/section/explorer/utils/path';
import { appearanceStore, fileStore, setAppearanceStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';
import { getDefaultPictureDir, getDefinedDriveLetters, isOpenableFile, normalizeJoin } from '~/utils/FileUtils';

// Styles
const explorerContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-left: 8px;
  gap: 8px;
`;

const driveDropdownContainer = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: end;
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

const Explorer: Component = () => {
  let inputRef: HTMLInputElement | undefined = undefined;
  const [configStore, setConfigStore] = createStore<FilesConfig>({
    showOnlySledgeOpenable: true,
    twoColumns: false,
    pathEditMode: false,
  });
  const [currentPath, setCurrentPath] = createSignal<string>('');
  createEffect(() => {
    const newPath = currentPath();
    if (newPath) setAppearanceStore('explorerPath', newPath);
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

  let defaultExplorerPath: string | undefined;
  let lastValidPath: string | undefined;
  let loadRequestToken = 0;
  let skipBlurApply = false;
  let backPath: string | undefined;
  let forwardPath: string | undefined;

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

  const revertToPath = (path: string) => {
    setCurrentPath(path);
    if (!configStore.pathEditMode) setPathDraft(path);
  };

  const setPath = async (path: string, allowRetry = true): Promise<boolean> => {
    const normalized = normalizeDirectoryPath(path);
    if (!normalized) return false;

    const previousValidPath = lastValidPath ?? currentPath();
    if (normalized === previousValidPath) {
      if (currentPath() !== previousValidPath) {
        revertToPath(previousValidPath);
      } else if (!configStore.pathEditMode) {
        setPathDraft(previousValidPath);
      }
      return true;
    }

    const requestToken = ++loadRequestToken;
    revertToPath(normalized);

    try {
      const dirEntries = await readDir(normalized);
      if (requestToken !== loadRequestToken) return true;
      sortEntries(dirEntries);
      setEntries(dirEntries);
      lastValidPath = normalized;
      if (!defaultExplorerPath) defaultExplorerPath = normalized;
      return true;
    } catch (error) {
      if (requestToken !== loadRequestToken) return false;

      const fallback =
        allowRetry &&
        ((lastValidPath && lastValidPath !== normalized && lastValidPath) ||
          (defaultExplorerPath && defaultExplorerPath !== normalized && defaultExplorerPath));

      await message(`Cannot open directory.\n${normalized}${fallback ? `\nReverting to ${fallback}.` : ''}`, {
        kind: 'warning',
        title: 'Explorer',
        okLabel: 'OK',
      });

      if (fallback) {
        return await setPath(fallback, false);
      }

      if (previousValidPath) {
        revertToPath(previousValidPath);
        return false;
      }

      setEntries(undefined);
      setCurrentPath('');
      if (!configStore.pathEditMode) setPathDraft('');
      return false;
    }
  };

  type HistoryMode = 'push' | 'back' | 'forward' | 'replace';

  const navigatePath = async (path: string, options?: { mode?: HistoryMode; allowRetry?: boolean }) => {
    const mode = options?.mode ?? 'push';
    const allowRetry = options?.allowRetry ?? true;
    const previous = currentPath();
    const previousBack = backPath;
    const previousForward = forwardPath;
    let candidateBack = backPath;
    let candidateForward = forwardPath;

    if (mode !== 'replace') {
      if (mode === 'push') {
        candidateBack = previous ? previous : candidateBack;
        candidateForward = undefined;
      } else if (mode === 'back') {
        candidateForward = previous ? previous : candidateForward;
      } else if (mode === 'forward') {
        candidateBack = previous ? previous : candidateBack;
      }
    }

    const success = await setPath(path, allowRetry);
    const changed = success && currentPath() !== previous;

    if (!changed) {
      backPath = previousBack;
      forwardPath = previousForward;
      return false;
    }

    if (mode === 'replace') {
      return true;
    }

    backPath = candidateBack;
    forwardPath = candidateForward;

    if (mode === 'back') {
      backPath = undefined;
    } else if (mode === 'forward') {
      forwardPath = undefined;
    }

    return true;
  };

  const handleBackNavigation = async () => {
    if (backPath) {
      const target = backPath;
      await navigatePath(target, { mode: 'back' });
      return;
    }

    const current = currentPath();
    const parent = current ? getParentDirectory(current) : undefined;
    if (!parent) return;
    if (current) {
      forwardPath = current;
    }
    await navigatePath(parent, { mode: 'replace' });
  };

  const handleForwardNavigation = async () => {
    if (!forwardPath) return;
    const target = forwardPath;
    await navigatePath(target, { mode: 'forward' });
  };

  const applyPathDraft = async () => {
    const rawDraft = pathDraft();
    if (!rawDraft.trim()) {
      setPathDraft(currentPath());
      setConfigStore('pathEditMode', false);
      return;
    }

    const normalizedDraft = normalizeDirectoryPath(rawDraft);
    if (!normalizedDraft) {
      setPathDraft(currentPath());
      setConfigStore('pathEditMode', false);
      return;
    }

    if (normalizedDraft === currentPath()) {
      setPathDraft(currentPath());
      setConfigStore('pathEditMode', false);
      return;
    }

    await navigatePath(rawDraft);
    setPathDraft(currentPath());
    setConfigStore('pathEditMode', false);
  };

  const handleMouseDown = (e: MouseEvent) => {
    // prevent if canvas area focused
    if ((e.target as HTMLElement).closest('#canvas-area')) {
      return;
    }

    if (e.button === 3) {
      e.preventDefault();
      handleBackNavigation();
      return;
    } else if (e.button === 4) {
      e.preventDefault();
      handleForwardNavigation();
      return;
    }
  };

  onMount(async () => {
    const openPath = fileStore.savedLocation.path ? normalizeJoin(fileStore.savedLocation.path) : undefined;
    const fallbackPath = await getDefaultPictureDir();
    defaultExplorerPath = fallbackPath;
    const editorSavedPath = appearanceStore.explorerPath ?? undefined;
    const defaultPath = editorSavedPath ?? openPath ?? fallbackPath;
    if (defaultPath) {
      setPathDraft(defaultPath);
      await navigatePath(defaultPath, { mode: 'replace' });
    }

    setDriveLetters(await getDefinedDriveLetters());

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  });

  const [isMenuOpened, setMenuOpened] = createSignal<boolean>(false);

  return (
    <div class={explorerContainer}>
      <Show when={driveLetters()}>
        <div class={driveDropdownContainer}>
          <Dropdown
            align='right'
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
              await navigatePath(v, { mode: 'replace' });
            }}
          />
        </div>
      </Show>
      <div class={explorerInner}>
        <div class={navigationPanel}>
          <div class={navigationRow}>
            <Show
              when={configStore.pathEditMode}
              fallback={
                <>
                  <Breadcrumbs
                    path={currentPath()}
                    onNavigate={(value) => {
                      void navigatePath(value);
                    }}
                  />
                </>
              }
            >
              <input
                ref={(ref) => (inputRef = ref)}
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
                class={pathInput}
                style={{
                  opacity: configStore.pathEditMode ? 1 : 0.4,
                }}
              />
            </Show>
          </div>

          <div class={controlsRow}>
            <div class={controlButtonsRow}>
              <div
                class={iconButton}
                onClick={() => {
                  setPathDraft(currentPath());
                  setConfigStore('pathEditMode', true);
                  skipBlurApply = false;
                  setTimeout(() => {
                    inputRef?.focus();
                    inputRef?.select();
                  }, 0);
                }}
              >
                <Icon src={'/icons/files/edit.png'} base={8} hoverColor={color.accent} />
              </div>
              <div
                class={iconButton}
                onClick={() => {
                  const parent = getParentDirectory(currentPath());
                  if (parent) {
                    void navigatePath(parent);
                  }
                }}
              >
                <Icon src={'/icons/files/folder_up.png'} base={8} hoverColor={color.accent} />
              </div>
              <div
                class={iconButton}
                onClick={() => {
                  setConfigStore('twoColumns', (v) => !v);
                }}
              >
                <Icon
                  src={configStore.twoColumns ? '/icons/files/two_column.png' : '/icons/files/one_column.png'}
                  base={8}
                  hoverColor={color.accent}
                />
              </div>
              <div
                class={iconButton}
                title='show only files that sledge can open.'
                onClick={() => {
                  setConfigStore('showOnlySledgeOpenable', (v) => !v);
                }}
              >
                <Icon
                  src={'/icons/files/file_sledge.png'}
                  base={8}
                  color={configStore.showOnlySledgeOpenable ? color.enabled : color.muted}
                  hoverColor={color.enabled}
                />
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
                  <Icon src={'/icons/misc/vert_dots.png'} base={8} hoverColor={color.accent} />
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
                          await openPath(currentPath());
                        },
                      },
                      {
                        type: 'item',
                        label: 'back to saved folder',
                        disabled: !fileStore.savedLocation.path || !fileStore.savedLocation.name,
                        onSelect: () => {
                          if (fileStore.savedLocation.path) void navigatePath(fileStore.savedLocation.path);
                        },
                      },
                      {
                        type: 'item',
                        label: 'Export to this folder',
                        onSelect: () => {
                          setAppearanceStore(
                            'rightSide',
                            'selectedIndex',
                            appearanceStore.rightSide.tabs.findIndex((t) => t === 'export')
                          );
                          setAppearanceStore('rightSide', 'shown', true);

                          eventBus.emit('export:requestExportPath', { newPath: currentPath() });
                        },
                      },
                    ]}
                  />
                </Show>
              </div>
            </div>
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
                    fileStore.savedLocation.path && fileStore.savedLocation.name
                      ? normalizeJoin(fileStore.savedLocation.path, fileStore.savedLocation.name)
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
                      onClick={(e) => {
                        if (entry.isDirectory) {
                          void navigatePath(path);
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
              <p>failed to open directory.</p>
            </Match>
            <Match when={entries() !== undefined && (visibleEntries()?.length ?? 0) === 0}>
              <p>
                {configStore.showOnlySledgeOpenable && (entries()?.length ?? 0) > 0
                  ? 'no sledge-compatible files in this folder.'
                  : 'this directory is empty.'}
              </p>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default Explorer;
