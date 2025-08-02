import { confirm } from '@tauri-apps/plugin-dialog';

export const confirmOperation = async (message: string, callback: () => void) => {
  if (await confirm(message, { title: 'PERILOUS OPERATION', kind: 'warning' })) {
    callback();
  }
};
