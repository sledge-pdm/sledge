import { readFile } from '@tauri-apps/plugin-fs';
import { packr } from '~/utils/msgpackr';

export async function readProjectFromPath(path: string): Promise<any | null> {
  try {
    console.log('start time:', new Date().toISOString());
    const data = await readFile(path);
    const unpacked = packr.unpack(data) as any;
    console.log('end time:', new Date().toISOString());
    return unpacked;
  } catch (error) {
    console.error('Failed to read project from path:', error);
    return null;
  }
}
