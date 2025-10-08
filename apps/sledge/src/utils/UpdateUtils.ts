import { confirm } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';
import { projectStore } from '~/stores/ProjectStores';

function isValidUpdate(update: Update): boolean {
  if (update.version.includes('dev') || update.version.includes('test')) {
    if (import.meta.env.DEV) {
      return true;
    } else {
      return false;
    }
  }

  return true;
}

export async function getUpdate(): Promise<Update | undefined> {
  console.log('checking for updates...');
  try {
    const update = await check({
      timeout: 5000,
    });
    if (update && isValidUpdate(update)) {
      return update;
    }
  } catch (e) {
    console.error('failed to update:', e);
  }

  return undefined;
}

export async function askAndInstallUpdate() {
  console.log('checking for updates...');

  if (projectStore.isProjectChangedAfterSave) {
    const confirmed = await confirm('There are unsaved changes.\nSure to update without save?', {
      kind: 'warning',
      title: 'Unsaved Changes',
      okLabel: 'update without save.',
      cancelLabel: 'CANCEL.',
    });
    if (!confirmed) {
      return;
    }
  }

  try {
    const update = await check({
      timeout: 5000,
    });
    if (update && isValidUpdate(update)) {
      console.log(`found update ${update.version} from ${update.date} with notes ${update.body}`);

      const confirmed = await confirm(
        `New version available.
${update.currentVersion} -> ${update.version}`,
        {
          kind: 'info',
          title: 'Update Available',
          okLabel: 'Update',
          cancelLabel: 'Not Now',
        }
      );

      if (confirmed) {
        let downloaded = 0;
        let contentLength = 0;
        // alternatively we could also call update.download() and update.install() separately
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength || 0;
              console.log(`started downloading ${event.data.contentLength} bytes`);
              break;
            case 'Progress':
              downloaded += event.data.chunkLength || 0;
              console.log(`downloaded ${downloaded} from ${contentLength}`);
              break;
            case 'Finished':
              console.log('download finished');
              break;
          }
        });

        console.log('update installed');
        await relaunch();
      }
    }
  } catch (e) {
    console.error('failed to update:', e);
  }
}
