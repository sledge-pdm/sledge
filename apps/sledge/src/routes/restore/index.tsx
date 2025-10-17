import { css } from '@acab/ecsstatic';
import { FileLocation } from '@sledge/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import { remove, stat } from '@tauri-apps/plugin-fs';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { createSignal, For, onMount } from 'solid-js';
import { getEmergencyBackupPath, getEmergencyBackups } from '~/features/backup';
import { loadGlobalSettings } from '~/features/io/config/load';
import { readProjectFromPath } from '~/features/io/project/in/import';
import { pageRoot } from '~/styles/styles';
import { join } from '~/utils/FileUtils';
import { reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';

const root = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 16px;
`;
const heading = css`
  font-size: 24px;
  margin-bottom: 8px;
`;
const fileList = css`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
`;
const fileListLabel = css`
  font-family: ZFB03;
  color: var(--color-muted);
  margin-bottom: 4px;
  margin-top: 8px;
`;
const itemHeader = css`
  display: flex;
  flex-direction: row;
  padding: 6px 8px;
  opacity: 0.5;
`;
const item = css`
  display: flex;
  flex-direction: row;
  padding: 6px 8px;
  cursor: pointer;

  &:hover {
    background-color: var(--color-button-hover);
  }
`;
const itemName = css`
  width: 60%;
`;
const itemProjectSavedAt = css`
  width: 20%;
`;
const itemBackupSavedAt = css`
  width: 20%;
`;
const buttonsContainer = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-top: auto;
  padding: 8px;
  gap: 12px;
`;
const spacer = css`
  flex-grow: 1;
`;

interface BackupInfo {
  backupLocation: FileLocation;
  projectPath?: string;
  originalLastSavedAt?: Date;
  backupLastSavedAt?: Date;
}

const Restore = () => {
  const [backupInfos, setBackupInfos] = createSignal<BackupInfo[]>([]);

  onMount(async () => {
    try {
      await loadGlobalSettings();
      const emergencyBackups = await getEmergencyBackups();
      if (!emergencyBackups) return;

      const infos: BackupInfo[] = [];
      await Promise.all(
        emergencyBackups.map(async (backupLoc) => {
          const backupPath = join(backupLoc.path!, backupLoc.name!);
          const parsed = await readProjectFromPath(backupPath);
          // Simple runtime validation for ProjectV1 structure
          if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.project &&
            parsed.project.store &&
            typeof parsed.project.store.lastSavedPath === 'string'
          ) {
            const projectPath = parsed.project.store.lastSavedPath;
            const lastSavedAt = parsed.project.store.lastSavedAt;
            const backupStat = await stat(backupPath);
            const backupSavedAt = backupStat.mtime;
            const info: BackupInfo = {
              backupLocation: backupLoc,
              projectPath: projectPath,
              originalLastSavedAt: lastSavedAt,
              backupLastSavedAt: backupSavedAt ?? undefined,
            };
            infos.push(info);
          } else {
            // Handle invalid backup file structure
            console.warn(`Backup at ${backupPath} does not match expected ProjectV1 structure.`);
          }
        })
      );
      setBackupInfos(infos);

      await showMainWindow();
    } catch (e) {
      await reportWindowStartError(e);
    }
  });

  // open project as unsaved backup(like last opened project), and delete backup.
  // TODO: implement this. (should delete backup in loading of "restored" editor window, to make sure backup successfully loaded.)
  const restore = async () => {
    // memo: i think editor file loading logic gonna be so wild, as there are 5 ways to open project:
    // 1. last opened project
    // 2. unresolved backup project (=> this window)
    // 3. (=> this method) restored backup project
    // 4. opening existing project (such as opening .sledge file from explorer)
    // 5. new project (from default settings)
    // woah.
  };

  return (
    <div class={pageRoot}>
      <div class={root}>
        {/* <p class={heading}>Unresolved Backups</p> */}
        <p>There are some unresolved emergency backups.</p>
        <p>Restore them and clear backup folders to remove this window on startup.</p>

        <p>You can close this window without any changes to original and backup files.</p>

        <div class={fileList}>
          {/* <p class={fileListLabel}>Backups</p> */}
          <div class={itemHeader}>
            <p class={itemName}>name</p>
            <p class={itemProjectSavedAt}>original</p>
            <p class={itemBackupSavedAt}>backup</p>
          </div>
          <For each={backupInfos()}>
            {(info) => {
              return (
                <div
                  class={item}
                  onClick={async () => {
                    revealItemInDir(join(info.backupLocation.path!, info.backupLocation.name!));
                  }}
                >
                  <p class={itemName}>{info.backupLocation.name}</p>
                  <p class={itemProjectSavedAt}>{info.originalLastSavedAt?.toLocaleTimeString() ?? 'not saved'}</p>
                  <p class={itemBackupSavedAt}>{info.backupLastSavedAt?.toLocaleTimeString()}</p>
                </div>
              );
            }}
          </For>
        </div>

        <div class={buttonsContainer}>
          <div class={spacer} />
          {/* <button class={enabledButton} onClick={() => restore()}>
            Restore.
          </button> */}
          <button
            onClick={async () => {
              const confirmed = await confirm(
                `Sure to delete ALL backups and close this window?
Make sure you have restored all backups!!`,
                {
                  cancelLabel: 'Yes, I restored all projects',
                  okLabel: 'Cancel',
                  kind: 'warning',
                }
              );
              if (!confirmed) {
                const dirPath = await getEmergencyBackupPath();
                await remove(dirPath, {
                  recursive: true,
                });
                getCurrentWindow().close();
              }
            }}
          >
            clear backup folder.
          </button>
        </div>
      </div>
    </div>
  );
};

export default Restore;
