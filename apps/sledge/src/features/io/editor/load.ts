import { FileLocation } from '@sledge/core';
import { BaseDirectory } from '@tauri-apps/api/path';
import { exists, readTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/Consts';
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
      console.log('json data loaded from file:', stateJson);
    } catch (e) {
      console.error('Failed to parse config JSON:', e);
    }

    if (stateJson) {
      return loadEditorStateStore(stateJson as EditorStateStore);
    }
  }
  return undefined;
}
