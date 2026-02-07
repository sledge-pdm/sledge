import { dialog } from '~/utils/platform';

export const confirmOperation = async (message: string, callback: () => void) => {
  if (await dialog.confirm(message, { title: 'Confirm Operation', kind: 'warning' })) {
    callback();
  }
};
