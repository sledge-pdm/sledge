import { debounce } from '@solid-primitives/scheduled';
import { Consts } from '~/Consts';
import { ensureAppConfigPath } from '~/features/config';
import { logSystemError, logSystemInfo } from '~/features/log/service';
import { getEditorStateStore } from '~/stores/EditorStores';
import { fs } from '~/utils/platform';

export const saveEditorStateDebounced = debounce(saveEditorStateImmediate, 500);

const LOG_LABEL = 'EditorState';

export async function saveEditorStateImmediate() {
  try {
    await ensureAppConfigPath();

    const editorState = getEditorStateStore();
    const baseDir = fs.BaseDirectory?.AppConfig;
    await fs.writeTextFile(Consts.editorStateFileName, JSON.stringify(editorState, null, 2), {
      baseDir,
      create: true,
    });
    if (import.meta.env.DEV) logSystemInfo('editor state saved.', { label: LOG_LABEL });
  } catch (e) {
    logSystemError('editor state save failed.', { label: LOG_LABEL, details: [e] });
    throw e;
  }
}
