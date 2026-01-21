import { Update as PluginUpdate } from '@tauri-apps/plugin-updater';
import { logSystemError, logSystemInfo } from '~/features/log/service';
import { ioStore } from '~/stores/EditorStores';
import { dialog, process, Update } from './platform';
import { safeInvoke } from './TauriUtils';

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

type UpdaterMetadata = {
  rid: number;
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
  rawJson: Record<string, unknown>;
};

const UPDATE_CHANNEL: 'stable' | 'rust' = 'stable';

function toUpdate(metadata: UpdaterMetadata): Update {
  return new PluginUpdate(metadata) as unknown as Update;
}

export async function getUpdate(): Promise<Update | undefined> {
  logSystemInfo('checking for updates...', { label: 'UpdateUtils', debugOnly: true });
  try {
    const metadata = await safeInvoke<UpdaterMetadata | null>('check_update_with_channel', {
      channel: UPDATE_CHANNEL,
      timeout: 5000,
    });
    if (metadata) {
      const update = toUpdate(metadata);
      if (isValidUpdate(update)) {
        return update;
      }
    }
  } catch (e) {
    logSystemError('failed to update.', { label: 'UpdateUtils', details: [e] });
  }

  return undefined;
}

export async function askAndInstallUpdate() {
  logSystemInfo('checking for updates...', { label: 'UpdateUtils', debugOnly: true });

  if (ioStore.isProjectChangedAfterSave) {
    const confirmed = await dialog.confirm('There are unsaved changes.\nSure to update without save?', {
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
    const metadata = await safeInvoke<UpdaterMetadata | null>('check_update_with_channel', {
      channel: UPDATE_CHANNEL,
      timeout: 5000,
    });
    if (metadata) {
      const update = toUpdate(metadata);
      if (!isValidUpdate(update)) {
        return;
      }
      logSystemInfo(`found update ${update.version} from ${update.date}`, {
        label: 'UpdateUtils',
        debugOnly: true,
        details: [update.body],
      });

      const confirmed = await dialog.confirm(
        `New version available.
${update.currentVersion} -> ${update.version}`,
        {
          kind: 'info',
          title: 'Update Available',
          okLabel: 'Update',
          cancelLabel: 'Not Now',
        }
      );

      if (!confirmed) {
        return;
      }

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
      await process.relaunch();
    }
  } catch (e) {
    logSystemError('failed to update.', { label: 'UpdateUtils', details: [e] });
  }
}
