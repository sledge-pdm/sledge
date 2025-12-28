import { FileLocation } from '@sledge/core';
import { appConfigDir } from '@tauri-apps/api/path';
import { mkdir, readDir, writeFile } from '@tauri-apps/plugin-fs';
import { v4 } from 'uuid';
import { dumpProject } from '~/features/io/project/out/dump';
import { fileStore } from '~/stores/EditorStores';
import { normalizeJoin } from '~/utils/FileUtils';

const EMERGENCY_BACKUP_FOLDER = 'backup';

export async function getEmergencyBackupPath(): Promise<string> {
  const dir = normalizeJoin(await appConfigDir(), EMERGENCY_BACKUP_FOLDER);
  return dir;
}

// create snapshot of current project, and save as emergency backup
export async function saveEmergencyBackup(): Promise<FileLocation> {
  const packedProject = await dumpProject();

  const loc = fileStore.savedLocation;
  // save to nested unique id dir to prevent overwriting project with same name
  const dirName = v4();
  // Use only the project name and sanitize it for filename safety
  const sanitize = (name: string) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').slice(0, 100);
  const projectName = loc.name ? sanitize(loc.name) : 'new_project';

  const dir = normalizeJoin(await appConfigDir(), EMERGENCY_BACKUP_FOLDER, dirName);
  await mkdir(dir, { recursive: true });
  const fileName = `${projectName}.sledge`;

  await writeFile(normalizeJoin(dir, fileName), packedProject, {
    create: true,
  });

  return {
    path: dir,
    name: fileName,
  };
}

export async function getEmergencyBackups(): Promise<FileLocation[] | undefined> {
  const dir = normalizeJoin(await appConfigDir(), EMERGENCY_BACKUP_FOLDER);
  await mkdir(dir, { recursive: true });

  const entries = await readDir(dir);

  const backupFiles: FileLocation[] = [];

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory) {
        const projectDir = normalizeJoin(dir, entry.name);
        const projectEntries = await readDir(projectDir);
        projectEntries.forEach((f) => {
          backupFiles.push({
            path: projectDir,
            name: f.name,
          });
        });
      }
    })
  );

  return backupFiles?.length > 0 ? backupFiles : undefined;
}
