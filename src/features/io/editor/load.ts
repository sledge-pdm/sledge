import { FileLocation } from '@sledge-pdm/core';
import { Consts } from '~/Consts';
import { logSystemError } from '~/features/log/service';
import { EditorStateStore, loadEditorStateStore } from '~/stores/EditorStores';
import { fs } from '~/utils/platform';

export async function loadEditorState(): Promise<
  | {
      lastOpenAs?: 'project' | 'new_project' | 'image';
      lastPath?: FileLocation;
    }
  | undefined
> {
  const baseDir = fs.BaseDirectory?.AppConfig;
  const isFileExists = baseDir ? await fs.exists(Consts.editorStateFileName, { baseDir }) : await fs.exists(Consts.editorStateFileName);
  if (isFileExists) {
    const stateData = await fs.readTextFile(Consts.editorStateFileName, baseDir ? { baseDir } : undefined);

    let stateJson;

    try {
      stateJson = JSON.parse(stateData);
    } catch (e) {
      logSystemError('Failed to parse config JSON.', { label: 'EditorState', details: [e] });
    }

    if (stateJson) {
      return loadEditorStateStore(stateJson as EditorStateStore);
    }
  }
  return undefined;
}
