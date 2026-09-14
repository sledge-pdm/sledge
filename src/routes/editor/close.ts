import { busyStore, isBusy, runExclusive } from '~/features/busy';
import { cancelSave, isSaveCancellable, saveProject } from '~/features/io/project/ProjectSave';
import { isProjectChanged } from '~/features/project';
import { ioStore } from '~/stores/EditorStores';
import { CloseRequestedEvent, dialog } from '~/utils/platform';

const BUTTON_YES = 'Save and Quit';
const BUTTON_NO = 'Discard and Quit';
const BUTTON_CANCEL = 'Cancel';

const BUTTON_STOP_SAVING = 'Stop Saving';
const BUTTON_WAIT = 'Wait';

/**
 * @description tell the user why the quit was turned down, and offer to stop the save if it can still be
 *   stopped. reported here rather than in the bottom bar, which is the opposite corner from the button they
 *   just pressed and so goes unread.
 *
 *   this never quits. stopping the save only clears what was in the way; closing again then goes through the
 *   normal prompt.
 */
const reportQuitRefused = async (): Promise<void> => {
  const lines = ['Cannot quit while an operation is running.'];
  if (busyStore.label) lines.push(`Operation: ${busyStore.label}`);

  if (!isSaveCancellable()) {
    await dialog.message(lines.join('\n\n'), {
      kind: 'info',
      title: 'Operation in progress',
    });
    return;
  }

  // the button says "Stop Saving", which could be read as "stop saving, then quit". it does not quit.
  lines.push(`${BUTTON_STOP_SAVING} does not quit. Close the window again once the save has stopped.`);

  const button = await dialog.message(lines.join('\n\n'), {
    kind: 'info',
    title: 'Operation in progress',
    buttons: { yes: BUTTON_STOP_SAVING, no: BUTTON_WAIT },
  });

  // the save may have reached its write while this dialog was up, and from there it cannot be stopped.
  // nothing is said about that: the save simply finishes, which is the same outcome as waiting.
  if (button === BUTTON_STOP_SAVING) cancelSave();
};

export const handleCloseRequest = async (event: CloseRequestedEvent) => {
  // an operation holding the window is describing a project that quitting would take away underneath it.
  if (isBusy()) {
    event.preventDefault();
    await reportQuitRefused();
    return;
  }

  if (!isProjectChanged()) return;

  const saveFailed = await runExclusive(
    'quit',
    async (): Promise<boolean> => {
      const button = await dialog.message('There are unsaved changes.\nSure to quit?', {
        kind: 'warning',
        title: 'Unsaved Changes',
        buttons: { yes: BUTTON_YES, no: BUTTON_NO, cancel: BUTTON_CANCEL },
      });

      switch (button) {
        case BUTTON_YES: {
          // the prompt and this save are one stretch of the same operation, so the save runs inside the
          // window this already holds. nothing could be edited between the two - so one save answers the
          // changes the prompt was about, and there is nothing for a second attempt to pick up.
          //
          // the modal is left to that save to raise: a project that has never been saved opens a file
          // dialog first, and covering the window behind that is the thing being avoided here.
          const result = await saveProject(ioStore.savedLocation.name, ioStore.savedLocation.path, { busy: 'inherit' });
          if (result === 'saved' && !isProjectChanged()) return false;

          // the changes are still there, so the window stays. a save the user stopped - or a destination they
          // declined - is not a failure, and was already reported as the cancellation it is: saying it failed
          // on top of that would tell them their own answer went wrong.
          event.preventDefault();
          return result !== 'cancelled';
        }

        case BUTTON_CANCEL:
          event.preventDefault();
          return false;

        // BUTTON_NO: quit without saving
        default:
          return false;
      }
    },
    {
      // the prompt is modal to this window already, and a quit the user cancels never covers it at all.
      deferDialog: true,
      // the window was free a moment ago; if it is not now, quitting is the thing to give up on.
      onRejected: () => {
        event.preventDefault();
        return false;
      },
    }
  );

  // said after the window is given back, so this is not another native dialog with our modal behind it.
  if (saveFailed) await dialog.message('Save failed. Try save project manually.');
};
