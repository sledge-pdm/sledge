import { Packr } from 'msgpackr';
import { fs } from './platform';

// Preserve Set/Map types in serialized project data.
export const packr = new Packr({ useRecords: true, mapsAsObjects: false, moreTypes: true });

export async function unpackFromPath(path: string): Promise<any | null> {
  try {
    const data = await fs.readFile(path);
    return unpackFromBytes(data);
  } catch (error) {
    throw error;
  }
}

export function unpackFromBytes(data: Uint8Array): any | null {
  return packr.unpack(data);
}
