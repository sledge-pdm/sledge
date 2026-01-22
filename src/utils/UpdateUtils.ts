import { Update as PluginUpdate } from '@tauri-apps/plugin-updater';
import { logSystemError, logSystemInfo } from '~/features/log/service';
import { ioStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { dialog, process, Update } from './platform';
import { safeInvoke } from './TauriUtils';

type UpdaterMetadata = {
  rid: number;
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
  rawJson: Record<string, unknown>;
};

function toUpdate(metadata: UpdaterMetadata): Update {
  return new PluginUpdate(metadata) as unknown as Update;
}

export async function getUpdate(): Promise<Update | undefined> {
  logSystemInfo('checking for updates...', { label: 'UpdateUtils', debugOnly: true });
  try {
    const metadata = await safeInvoke<UpdaterMetadata | null>('check_update_with_channel', {
      channel: globalConfig.debug.updateChannel ?? 'stable',
      timeout: 5000,
    });
    if (metadata) {
      const update = toUpdate(metadata);
      return update;
    }
  } catch (e) {
    logSystemError('failed to update.', { label: 'UpdateUtils', details: [e] });
  }

  return undefined;
}

export async function askAndInstallUpdate() {
  logSystemInfo('checking for updates...', { label: 'UpdateUtils', debugOnly: true });

  try {
    const metadata = await safeInvoke<UpdaterMetadata | null>('check_update_with_channel', {
      channel: globalConfig.debug.updateChannel ?? 'stable',
      timeout: 5000,
    });
    if (metadata) {
      const update = toUpdate(metadata);
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
      if (!confirmed) return;

      // Alert if there's unsaved changes
      if (ioStore.isProjectChangedAfterSave) {
        const confirmed = await dialog.confirm('There are unsaved changes.\nSure to update without save?', {
          kind: 'warning',
          title: 'Unsaved Changes',
          okLabel: 'update without save.',
          cancelLabel: 'CANCEL.',
        });
        if (!confirmed) return;
      }

      // Alert if it's updating on dev environment
      if (import.meta.env.DEV) {
        const confirmed = await dialog.confirm(`You are in development environment. The update will be applied to local application. Continue?`);
        if (!confirmed) return;
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
