import { readFile } from '@tauri-apps/plugin-fs';
import { logSystemError, logSystemInfo } from '~/features/log/service';
import { packr } from '~/utils/msgpackr';

const LOG_LABEL = 'ProjectImport';

export async function readProjectFromPath(path: string): Promise<any | null> {
  try {
    logSystemInfo('start reading project file.', { label: LOG_LABEL, debugOnly: true, details: [path] });
    const data = await readFile(path);
    const unpacked = packr.unpack(data) as any;
    logSystemInfo('finished reading project file.', { label: LOG_LABEL, debugOnly: true, details: [path] });
    return unpacked;
  } catch (error) {
    logSystemError('Failed to read project from path.', { label: LOG_LABEL, details: [path, error] });
    return null;
  }
}
