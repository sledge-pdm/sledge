import { logSystemError, logSystemInfo } from '~/features/log/service';
import { isProjectChanged } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { dialog, process, Update, updater } from './platform';

const getUpdaterCheckOptions = () => ({
  channel: globalConfig.debug.updateChannel ?? 'stable',
  headers: [
    ['Cache-Control', 'no-cache'],
    ['Pragma', 'no-cache'],
  ],
  timeout: 5000,
});

export async function getUpdate(): Promise<Update | undefined> {
  logSystemInfo('checking for updates...', { label: 'UpdateUtils', debugOnly: true });
  try {
    const update = await updater.check(getUpdaterCheckOptions());
    if (update) return update;
  } catch (e) {
    logSystemError('failed to update.', { label: 'UpdateUtils', details: [e] });
  }

  return undefined;
}

export async function askAndInstallUpdate() {
  logSystemInfo('checking for updates...', { label: 'UpdateUtils', debugOnly: true });

  try {
    const update = await updater.check(getUpdaterCheckOptions());
    if (update) {
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
      if (isProjectChanged()) {
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
