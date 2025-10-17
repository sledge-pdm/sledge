import { FileLocation } from '@sledge/core';
import { appConfigDir } from '@tauri-apps/api/path';
import { message } from '@tauri-apps/plugin-dialog';
import { mkdir, readDir, writeFile } from '@tauri-apps/plugin-fs';
import { v4 } from 'uuid';
import { dumpProject } from '~/features/io/project/out/dump';
import { fileStore } from '~/stores/EditorStores';
import { join } from '~/utils/FileUtils';

const LAST_PROJECT_FOLDER = 'session';
const EMERGENCY_BACKUP_FOLDER = 'backup';

// create snapshot of current project, and save
export async function saveLastProject(): Promise<FileLocation | undefined> {
  try {
    const packedProject = await dumpProject();

    const dir = join(await appConfigDir(), LAST_PROJECT_FOLDER);
    await mkdir(dir, { recursive: true });
    const fileName = 'last.sledge';
    await writeFile(join(dir, fileName), packedProject, {
      create: true,
    });

    return {
      path: dir,
      name: fileName,
    };
  } catch (e) {
    await message(`Error while saving state:\n${e}`);
    return undefined;
  }
}

export async function getLastOpenedProjects(): Promise<FileLocation[] | undefined> {
  const dir = join(await appConfigDir(), LAST_PROJECT_FOLDER);
  await mkdir(dir, { recursive: true });

  const entries = await readDir(dir);

  const projectLocations: FileLocation[] = [];
  entries.forEach((entry) => {
    if (entry.isFile && entry.name.endsWith('.sledge')) {
      projectLocations.push({
        path: dir,
        name: entry.name,
      });
    }
  });

  return projectLocations?.length > 0 ? projectLocations : undefined;
}

export async function getEmergencyBackupPath(): Promise<string> {
  const dir = join(await appConfigDir(), EMERGENCY_BACKUP_FOLDER);
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

  const dir = join(await appConfigDir(), EMERGENCY_BACKUP_FOLDER, dirName);
  await mkdir(dir, { recursive: true });
  const fileName = `${projectName}.sledge`;

  await writeFile(join(dir, fileName), packedProject, {
    create: true,
  });

  return {
    path: dir,
    name: fileName,
  };
}

export async function getEmergencyBackups(): Promise<FileLocation[] | undefined> {
  const dir = join(await appConfigDir(), EMERGENCY_BACKUP_FOLDER);
  await mkdir(dir, { recursive: true });

  const entries = await readDir(dir);

  const backupFiles: FileLocation[] = [];

  await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory) {
        const projectDir = join(dir, entry.name);
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
