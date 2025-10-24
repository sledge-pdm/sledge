import { CloseRequestedEvent } from '@tauri-apps/api/window';
import { message } from '@tauri-apps/plugin-dialog';
import { saveEditorState } from '~/features/io/editor/save';
import { saveProject } from '~/features/io/project/out/save';
import { projectStore } from '~/stores/ProjectStores';

const BUTTON_YES = 'Save and Quit';
const BUTTON_NO = 'Discard and Quit';
const BUTTON_CANCEL = 'Cancel';

export const handleCloseRequest = async (event: CloseRequestedEvent) => {
  await saveEditorState();
  if (projectStore.isProjectChangedAfterSave) {
    const button = await message('There are unsaved changes.\nSure to quit?', {
      kind: 'warning',
      title: 'Unsaved Changes',
      buttons: { yes: BUTTON_YES, no: BUTTON_NO, cancel: BUTTON_CANCEL },
    });

    switch (button) {
      case BUTTON_YES:
        const saveSuccessful = await saveProject();
        if (saveSuccessful) return;

        event.preventDefault();
        message('Save failed. try save project manually.');
        break;

      case BUTTON_NO:
        break;

      case BUTTON_CANCEL:
        event.preventDefault();
        break;
    }
  }
};
