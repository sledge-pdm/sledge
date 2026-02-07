import { debounce } from '@solid-primitives/scheduled';
import { Consts } from '~/Consts';
import { ensureAppConfigPath } from '~/features/config';
import { logSystemError, logSystemInfo } from '~/features/log/service';
import { EditorStateStore, getEditorStateStore } from '~/stores/EditorStores';
import { fs } from '~/utils/platform';

export const saveEditorStateDebounced = debounce(saveEditorStateImmediate, 500);

const LOG_LABEL = 'EditorState';

const pickEditorStateKeys = (state: EditorStateStore, keys: (keyof EditorStateStore)[]): Partial<EditorStateStore> => {
  return Object.fromEntries(keys.map((key) => [key, state[key]])) as Partial<EditorStateStore>;
};

const readPersistedEditorState = async (baseDir: unknown): Promise<EditorStateStore | undefined> => {
  const options = baseDir ? { baseDir } : undefined;
  const exists = baseDir ? await fs.exists(Consts.editorStateFileName, { baseDir }) : await fs.exists(Consts.editorStateFileName);
  if (!exists) return undefined;

  const content = await fs.readTextFile(Consts.editorStateFileName, options);
  const parsed = JSON.parse(content);
  if (!parsed || typeof parsed !== 'object') return undefined;
  return parsed as EditorStateStore;
};

export async function saveEditorStateImmediate(keys?: (keyof EditorStateStore)[]) {
  try {
    await ensureAppConfigPath();

    const currentState = getEditorStateStore();
    const baseDir = fs.BaseDirectory?.AppConfig;
    let stateToSave: EditorStateStore = currentState;
    if (keys && keys.length > 0) {
      try {
        const persisted = await readPersistedEditorState(baseDir);
        if (persisted) {
          stateToSave = {
            ...persisted,
            ...pickEditorStateKeys(currentState, keys),
          };
        }
      } catch {
        stateToSave = currentState;
      }
    }

    await fs.writeTextFile(Consts.editorStateFileName, JSON.stringify(stateToSave, null, 2), {
      baseDir,
      create: true,
    });
    if (import.meta.env.DEV) logSystemInfo('editor state saved.', { label: LOG_LABEL });
  } catch (e) {
    logSystemError('editor state save failed.', { label: LOG_LABEL, details: [e] });
    throw e;
  }
}
