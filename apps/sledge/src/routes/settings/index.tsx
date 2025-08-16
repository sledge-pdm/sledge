import { pageRoot } from '@sledge/theme';
import { onMount } from 'solid-js';
import ConfigForm from '~/components/config/ConfigForm';
import { loadGlobalSettings } from '~/io/config/load';
import { showMainWindow } from '~/utils/WindowUtils';

export default function Settings() {
  onMount(async () => {
    await loadGlobalSettings();
    await showMainWindow();
  });

  return (
    <div class={pageRoot}>
      <ConfigForm />
    </div>
  );
}
