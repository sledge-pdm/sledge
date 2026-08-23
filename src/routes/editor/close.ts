import { saveProject } from '~/features/io/project/ProjectSave';
import { isProjectChanged } from '~/features/project';
import { ioStore } from '~/stores/EditorStores';
import { CloseRequestedEvent, dialog } from '~/utils/platform';

const BUTTON_YES = 'Save and Quit';
const BUTTON_NO = 'Discard and Quit';
const BUTTON_CANCEL = 'Cancel';

export const handleCloseRequest = async (event: CloseRequestedEvent) => {
  if (isProjectChanged()) {
    const button = await dialog.message('There are unsaved changes.\nSure to quit?', {
      kind: 'warning',
      title: 'Unsaved Changes',
      buttons: { yes: BUTTON_YES, no: BUTTON_NO, cancel: BUTTON_CANCEL },
    });

    switch (button) {
      case BUTTON_YES:
        const saveSuccessful = await saveProject(ioStore.savedLocation.name, ioStore.savedLocation.path);
        if (saveSuccessful) return;

        event.preventDefault();
        dialog.message('Save failed. Try save project manually.');
        break;

      case BUTTON_NO:
        break;

      case BUTTON_CANCEL:
        event.preventDefault();
        break;
    }
  }
};
