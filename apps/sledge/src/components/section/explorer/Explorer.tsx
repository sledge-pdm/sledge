import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge/core';
import { color } from '@sledge/theme';
import { Icon, MenuList } from '@sledge/ui';
import { pictureDir } from '@tauri-apps/api/path';
import { DirEntry, readDir } from '@tauri-apps/plugin-fs';
import { Component, createEffect, createMemo, createSignal, For, Match, onMount, Show, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import FileItem, { FilesConfig } from '~/components/section/explorer/item/FileItem';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import { openExistingProject } from '~/features/io/window';
import { appearanceStore, fileStore, setAppearanceStore, setLastSettingsStore } from '~/stores/EditorStores';
import { normalizeJoin, normalizePath } from '~/utils/FileUtils';

interface Props {
  defaultPath?: string;
}

// Styles
const breadcrumbsContainer = css`
  display: flex;
  flex-direction: row;
  gap: 2px;
  width: 100%;
  flex-wrap: wrap;
  margin-right: auto;
  padding: 4px 8px;
  background: var(--color-surface);
`;

const breadcrumbItem = css`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
`;

const breadcrumbLink = css`
  font-family: PM10;
  font-size: 10px;
`;

const explorerContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-left: 8px;
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
`;

const flexGrow = css`
  flex-grow: 1;
`;

const menuButtonContainer = css`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const iconButton = css`
  padding: 2px;
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

const backToProjectLink = css`
  font-family: ZFB03B;
  opacity: 0.5;
  align-self: flex-end;
`;

const controlButtonsRow = css`
  display: flex;
  flex-direction: row;
  gap: 6px;
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

const Explorer: Component<Props> = (props) => {
  let inputRef: HTMLInputElement | undefined = undefined;
  const [configStore, setConfigStore] = createStore<FilesConfig>({
    twoColumns: false,
    pathEditMode: false,
  });
  const [currentPath, setCurrentPath] = createSignal<string>(props.defaultPath ?? '');
  const [entries, setEntries] = createSignal<DirEntry[] | undefined>([]);

  onMount(async () => {
    const openPath = fileStore.savedLocation.path ? normalizeJoin(fileStore.savedLocation.path) : undefined;
    const defaultPath = props.defaultPath ?? openPath ?? (await pictureDir());
    if (defaultPath) {
      setPath(defaultPath);
    }
  });

  const setPath = (path: string) => {
    if (!path.includes('/')) path += '/';
    setCurrentPath(normalizePath(path));
  };

  createEffect(async () => {
    const path = currentPath();
    if (path) {
      try {
        const entries = await readDir(path);

        // sort dir => file
        entries.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

        setEntries(entries);
      } catch (e) {
        setEntries(undefined);
      }
    }
  });

  const Breadcrumbs: Component<{ path: string }> = (props) => {
    const parts = createMemo<string[]>(() => {
      return props.path
        .replaceAll('\\', '/')
        .split('/')
        .filter((p) => p);
    });
    return (
      <div class={breadcrumbsContainer}>
        <For each={parts()}>
          {(part, index) => {
            return (
              <div class={breadcrumbItem}>
                {index() > 0 && <p>&gt;</p>}
                <a
                  onClick={() => {
                    const newPath = parts()
                      .slice(0, index() + 1)
                      .join('/');
                    setPath(newPath);
                  }}
                  class={breadcrumbLink}
                  style={{
                    'pointer-events': index() === parts().length - 1 ? 'none' : 'auto',
                    color: index() === parts().length - 1 ? color.accent : color.onBackground,
                  }}
                >
                  {part}
                  {parts().length === 1 && '/'}
                </a>
              </div>
            );
          }}
        </For>
      </div>
    );
  };

  const [isMenuOpened, setMenuOpened] = createSignal<boolean>(false);

  return (
    <div class={explorerContainer}>
      {/* <p class={sectionCaption} style={{ margin: 0 }}>
        explorer.
      </p> */}
      <div class={explorerInner}>
        <div class={navigationPanel}>
          <div class={navigationRow}>
            <Show
              when={configStore.pathEditMode}
              fallback={
                <>
                  <Breadcrumbs path={currentPath()} />
                </>
              }
            >
              <input
                ref={(ref) => (inputRef = ref)}
                value={currentPath()}
                onInput={(e) => {
                  setPath(e.currentTarget.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setConfigStore('pathEditMode', false);
                    inputRef?.blur();
                  }
                }}
                onBlur={() => setConfigStore('pathEditMode', false)}
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
                  setConfigStore('pathEditMode', true);
                  inputRef?.focus();
                  // inputRef?.select();
                }}
              >
                <Icon src={'/icons/files/edit.png'} base={8} hoverColor={color.accent} />
              </div>
              <div
                class={iconButton}
                onClick={() => {
                  const path = currentPath();
                  const parts = normalizePath(path).split('/');
                  if (parts.length <= 1) return;
                  let parent = parts.slice(0, -1).join('/');
                  if (parts.length === 2) parent += '/';
                  if (parent) {
                    setPath(parent);
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
                    style={{ 'margin-top': '4px', 'margin-left': '-8px', width: '160px' }}
                    options={[
                      {
                        type: 'item',
                        label: 'back to saved folder',
                        disabled: !fileStore.savedLocation.path || !fileStore.savedLocation.name,
                        onSelect: () => {
                          if (fileStore.savedLocation.path) setPath(fileStore.savedLocation.path);
                        },
                      },
                      {
                        type: 'item',
                        label: 'Export to this folder',
                        onSelect: () => {
                          setLastSettingsStore('exportSettings', 'folderPath', currentPath());
                          setAppearanceStore(
                            'rightSide',
                            'selectedIndex',
                            appearanceStore.rightSide.tabs.findIndex((t) => t === 'export')
                          );
                          setAppearanceStore('rightSide', 'shown', true);
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
              <For each={entries()}>
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
                      entry={entry}
                      isMe={!!isMe}
                      isPartOfMe={!!isPartOfMe}
                      onClick={(e) => {
                        if (entry.isDirectory) {
                          setPath(path);
                        } else if (entry.isFile) {
                          const ext = ['sledge', ...importableFileExtensions];
                          if (ext.some((e) => entry.name.endsWith(`.${e}`))) {
                            openExistingProject(location);
                          } else {
                            // TODO: show error toast
                          }
                        }
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
            <Match when={entries() !== undefined && entries()!.length === 0}>
              <p>this directory is empty.</p>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  );
};

export default Explorer;
