import { confirm } from '@tauri-apps/plugin-dialog';
import { check } from '@tauri-apps/plugin-updater';

export async function checkForUpdates() {
  console.log('checking for updates...');
  try {
    const update = await check({
      timeout: 10000,
    });
    if (update) {
      console.log(`found update ${update.version} from ${update.date} with notes ${update.body}`);

      const confirmed = await confirm(
        `New version available.
(${update.currentVersion} -> ${update.version})`,
        {
          kind: 'info',
          title: 'Update Available',
          okLabel: 'Download and Install',
          cancelLabel: 'Not Now',
        }
      );

      if (confirmed) {
        let downloaded = 0;
        let contentLength = 0;
        // alternatively we could also call update.download() and update.install() separately
        await update.download((event) => {
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
        //   await relaunch();
      }
    }
  } catch (e) {
    console.error('failed to update:', e);
  }
}
