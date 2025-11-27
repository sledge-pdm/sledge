import { confirm } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';
import { logSystemError, logSystemInfo } from '~/features/log/service';
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
  logSystemInfo('checking for updates...', { label: 'UpdateUtils', debugOnly: true });
  try {
    const update = await check({
      timeout: 5000,
    });
    if (update && isValidUpdate(update)) {
      return update;
    }
  } catch (e) {
    logSystemError('failed to update.', { label: 'UpdateUtils', details: [e] });
  }

  return undefined;
}

export async function askAndInstallUpdate() {
  logSystemInfo('checking for updates...', { label: 'UpdateUtils', debugOnly: true });

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
      logSystemInfo(`found update ${update.version} from ${update.date}`, {
        label: 'UpdateUtils',
        debugOnly: true,
        details: [update.body],
      });

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
              logSystemInfo(`started downloading ${event.data.contentLength} bytes`, { label: 'UpdateUtils', debugOnly: true });
              break;
            case 'Progress':
              downloaded += event.data.chunkLength || 0;
              logSystemInfo(`downloaded ${downloaded} from ${contentLength}`, { label: 'UpdateUtils', debugOnly: true });
              break;
            case 'Finished':
              logSystemInfo('download finished', { label: 'UpdateUtils', debugOnly: true });
              break;
          }
        });

        logSystemInfo('update installed', { label: 'UpdateUtils', debugOnly: true });
        await relaunch();
      }
    }
  } catch (e) {
    logSystemError('failed to update.', { label: 'UpdateUtils', details: [e] });
  }
}
