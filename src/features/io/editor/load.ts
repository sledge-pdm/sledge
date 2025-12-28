import { FileLocation } from '@sledge/core';
import { BaseDirectory } from '@tauri-apps/api/path';
import { exists, readTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/Consts';
import { logSystemError } from '~/features/log/service';
import { EditorStateStore, loadEditorStateStore } from '~/stores/EditorStores';

export async function loadEditorState(): Promise<
  | {
      lastOpenAs?: 'project' | 'new_project' | 'image';
      lastPath?: FileLocation;
    }
  | undefined
> {
  const isFileExists = await exists(Consts.editorStateFileName, { baseDir: BaseDirectory.AppConfig });
  if (isFileExists) {
    const stateData = await readTextFile(Consts.editorStateFileName, {
      baseDir: BaseDirectory.AppConfig,
    });

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
