import { pageRoot } from '@sledge/theme';
import { onMount } from 'solid-js';
import ConfigForm from '~/components/config/ConfigForm';
import { loadGlobalSettings } from '~/io/config/load';
import { reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';

export default function Settings() {
  onMount(async () => {
    try {
      await loadGlobalSettings();
      throw new Error('This is a test error to check global error handling.', { cause: 'TestError' });
      await showMainWindow();
    } catch (e) {
      await reportWindowStartError(e);
    }
  });

  return (
    <div class={pageRoot}>
      <ConfigForm />
    </div>
  );
}
