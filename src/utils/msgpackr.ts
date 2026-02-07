import { Packr } from 'msgpackr';
import { fs } from './platform';

export const packr = new Packr({ useRecords: true, mapsAsObjects: false });

export async function unpackFromPath(path: string): Promise<any | null> {
  try {
    const data = await fs.readFile(path);
    const unpacked = packr.unpack(data);
    return unpacked;
  } catch (error) {
    throw error;
  }
}
