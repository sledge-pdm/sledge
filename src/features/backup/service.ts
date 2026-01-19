import { FileLocation } from '@sledge-pdm/core';
import { v4 } from 'uuid';
import { ioStore } from '~/stores/EditorStores';
import { normalizeJoin } from '~/utils/FileUtils';
import { fs, path } from '~/utils/platform';
import { getPackedCurrentProject } from '../io/project/out/save';

const EMERGENCY_BACKUP_FOLDER = 'backup';

export async function getEmergencyBackupPath(): Promise<string> {
  const dir = normalizeJoin(await path.appConfigDir(), EMERGENCY_BACKUP_FOLDER);
  return dir;
}

// create snapshot of current project, and save as emergency backup
export async function saveEmergencyBackup(): Promise<FileLocation> {
  const packedProject = await getPackedCurrentProject();

  const loc = ioStore.savedLocation;
  // save to nested unique id dir to prevent overwriting project with same name
  const dirName = v4();
  // Use only the project name and sanitize it for filename safety
  const sanitize = (name: string) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').slice(0, 100);
  const projectName = loc.name ? sanitize(loc.name) : 'new_project';

  const dir = normalizeJoin(await path.appConfigDir(), EMERGENCY_BACKUP_FOLDER, dirName);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${projectName}.sledge`;

  await fs.writeFile(normalizeJoin(dir, fileName), packedProject, {
    create: true,
  });

  return {
    path: dir,
    name: fileName,
  };
}

export async function getEmergencyBackups(): Promise<FileLocation[] | undefined> {
  const dir = normalizeJoin(await path.appConfigDir(), EMERGENCY_BACKUP_FOLDER);
  await fs.mkdir(dir, { recursive: true });

  const entries = await fs.readDir(dir);

  const backupFiles: FileLocation[] = [];

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory) {
        const projectDir = normalizeJoin(dir, entry.name);
        const projectEntries = await fs.readDir(projectDir);
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
