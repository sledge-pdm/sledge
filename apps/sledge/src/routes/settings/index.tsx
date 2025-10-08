import { onMount } from 'solid-js';
import ConfigForm from '~/components/config/ConfigForm';
import { loadGlobalSettings } from '~/io/config/load';
import { pageRoot } from '~/styles/StyleSnippets';
import { reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';

export default function Settings() {
  onMount(async () => {
    try {
      await loadGlobalSettings();
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
