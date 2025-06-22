import { readFile } from '@tauri-apps/plugin-fs';
import { Packr } from 'msgpackr';
import { loadProjectJson } from '~/io/project/in/load';
import { Project } from '~/io/project/out/dump';

// called when projectstore load
export async function importProjectFromPath(filePath: string) {
  if (!filePath) {
    console.log('file not selected');
    return;
  }
  // const jsonText = await readTextFile(filePath);

  // loadProjectJson(jsonText);

  const projectBin = await readFile(filePath);
  let packr = new Packr({ useRecords: true, mapsAsObjects: false });
  const project = packr.unpack(projectBin) as Project;
  // project.imagePoolStore.entries = new ReactiveMap(Object.entries(project.imagePoolStore.entries));
  // project.layerBuffers = new Map(Object.entries(project.layerBuffers));
  loadProjectJson(project);
}
