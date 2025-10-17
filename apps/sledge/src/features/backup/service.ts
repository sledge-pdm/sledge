import { FileLocation } from '@sledge/core';
import { appConfigDir } from '@tauri-apps/api/path';
import { mkdir, readDir, writeFile } from '@tauri-apps/plugin-fs';
import { dumpProject } from '~/features/io/project/out/dump';
import { join } from '~/utils/FileUtils';

const LAST_PROJECT_FOLDER = 'session';

// create snapshot of current project, and save as backup
export async function saveLastProject(): Promise<FileLocation> {
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
