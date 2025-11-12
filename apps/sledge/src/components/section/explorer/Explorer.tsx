import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge/core';
import { color } from '@sledge/theme';
import { Icon, MenuList } from '@sledge/ui';
import { message } from '@tauri-apps/plugin-dialog';
import { DirEntry, readDir } from '@tauri-apps/plugin-fs';
import { Component, createMemo, createSignal, For, Match, onMount, Show, Switch } from 'solid-js';
import { createStore } from 'solid-js/store';
import FileItem, { FilesConfig } from '~/components/section/explorer/item/FileItem';
import { importableFileExtensions } from '~/features/io/FileExtensions';
import { openExistingProject } from '~/features/io/window';
import { appearanceStore, fileStore, setAppearanceStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';
import { getDefaultPictureDir, normalizeJoin, normalizePath } from '~/utils/FileUtils';

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

const Explorer: Component<Props> = (props) => {
  let inputRef: HTMLInputElement | undefined = undefined;
  const [configStore, setConfigStore] = createStore<FilesConfig>({
    twoColumns: false,
    pathEditMode: false,
  });
  const [currentPath, setCurrentPath] = createSignal<string>(props.defaultPath ?? '');
  const [entries, setEntries] = createSignal<DirEntry[] | undefined>([]);
  const [pathDraft, setPathDraft] = createSignal<string>(props.defaultPath ?? '');

  let defaultExplorerPath: string | undefined;
  let lastValidPath: string | undefined;
  let loadRequestToken = 0;
  let skipBlurApply = false;

  const normalizeDirectoryPath = (rawPath: string): string => {
    if (!rawPath) return '';
    let candidate = rawPath.trim();
    if (/^[a-zA-Z]:$/.test(candidate)) {
      candidate = `${candidate}/`;
    }
    const normalized = normalizePath(candidate);
    if (!normalized) {
      const slashOnly = candidate.replace(/\\/g, '/');
      if (/^\/+$/.test(slashOnly)) return '/';
    }
    return normalized;
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
      if (!configStore.pathEditMode) setPathDraft(normalized);
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

      await message(
        `Cannot open directory.\n${normalized}${fallback ? `\nReverting to ${fallback}.` : ''}`,
        {
          kind: 'warning',
          title: 'Explorer',
          okLabel: 'OK',
        }
      );

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

    await setPath(rawDraft);
    setPathDraft(currentPath());
    setConfigStore('pathEditMode', false);
  };

  type BreadcrumbEntry = { label: string; value: string };

  const buildBreadcrumbItems = (rawPath: string): BreadcrumbEntry[] => {
    const normalized = normalizeDirectoryPath(rawPath);
    if (!normalized) return [];

    if (normalized === '/') {
      return [{ label: '/', value: '/' }];
    }

    if (normalized.startsWith('//')) {
      const withoutPrefix = normalized.replace(/^\/\//, '');
      const parts = withoutPrefix.split('/').filter((part) => part);
      if (parts.length < 2) {
        return [{ label: normalized, value: normalized }];
      }
      const [server, share, ...rest] = parts;
      let acc = `//${server}/${share}`;
      const items: BreadcrumbEntry[] = [{ label: `//${server}/${share}`, value: acc }];
      rest.forEach((part) => {
        acc = `${acc}/${part}`;
        items.push({ label: part, value: acc });
      });
      return items;
    }

    if (normalized.startsWith('/')) {
      const rest = normalized.split('/').filter((part) => part);
      const items: BreadcrumbEntry[] = [{ label: '/', value: '/' }];
      let acc = '';
      rest.forEach((part) => {
        acc = acc ? `${acc}/${part}` : `/${part}`;
        items.push({ label: part, value: acc });
      });
      return items;
    }

    if (/^[a-zA-Z]:/.test(normalized)) {
      const segments = normalized.split('/').filter((part, index) => part || index === 0);
      if (segments.length === 0) return [];
      const driveLabel = segments[0].endsWith(':') ? `${segments[0]}/` : segments[0];
      let acc = driveLabel;
      const items: BreadcrumbEntry[] = [{ label: driveLabel, value: driveLabel }];
      segments.slice(1).forEach((part) => {
        acc = acc.endsWith('/') ? `${acc}${part}` : `${acc}/${part}`;
        items.push({ label: part, value: acc });
      });
      return items;
    }

    const parts = normalized.split('/').filter((part) => part);
    let acc = '';
    return parts.map((part) => {
      acc = acc ? `${acc}/${part}` : part;
      return { label: part, value: acc };
    });
  };

  onMount(async () => {
    const openPath = fileStore.savedLocation.path ? normalizeJoin(fileStore.savedLocation.path) : undefined;
    const fallbackPath = await getDefaultPictureDir();
    defaultExplorerPath = fallbackPath;
    const defaultPath = props.defaultPath ?? openPath ?? fallbackPath;
    if (defaultPath) {
      setPathDraft(defaultPath);
      await setPath(defaultPath);
    }
  });

  const Breadcrumbs: Component<{ path: string }> = (props) => {
    const items = createMemo<BreadcrumbEntry[]>(() => buildBreadcrumbItems(props.path));
    return (
      <div class={breadcrumbsContainer}>
        <For each={items()}>
          {(item, index) => {
            return (
              <div class={breadcrumbItem}>
                {index() > 0 && <p>&gt;</p>}
                <a
                  onClick={() => {
                    if (index() === items().length - 1) return;
                    void setPath(item.value);
                  }}
                  class={breadcrumbLink}
                  style={{
                    'pointer-events': index() === items().length - 1 ? 'none' : 'auto',
                    color: index() === items().length - 1 ? color.accent : color.onBackground,
                  }}
                >
                  {item.label}
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
                  const path = currentPath();
                  const parts = normalizePath(path).split('/');
                  if (parts.length <= 1) return;
                  let parent = parts.slice(0, -1).join('/');
                  if (parts.length === 2) parent += '/';
                  if (parent) {
                    void setPath(parent);
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
                    style={{ 'margin-top': '4px', 'margin-left': '-8px' }}
                    options={[
                      {
                        type: 'item',
                        label: 'back to saved folder',
                        disabled: !fileStore.savedLocation.path || !fileStore.savedLocation.name,
                        onSelect: () => {
                          if (fileStore.savedLocation.path) void setPath(fileStore.savedLocation.path);
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
                          void setPath(path);
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
