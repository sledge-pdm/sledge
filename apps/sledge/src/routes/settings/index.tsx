import { createSignal, onMount, Show } from 'solid-js';
import ConfigForm from '~/components/config/ConfigForm';
import { loadGlobalSettings } from '~/features/io/config/load';
import { pageRoot } from '~/styles/styles';
import { reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';

export default function Settings() {
  const [configLoaded, setConfigLoaded] = createSignal(false);

  onMount(async () => {
    try {
      await loadGlobalSettings();
      setConfigLoaded(true);
      await showMainWindow();
    } catch (e) {
      await reportWindowStartError(e);
    }
  });

  return (
    <div class={pageRoot}>
      <Show when={configLoaded()}>
        <ConfigForm />
      </Show>
    </div>
  );
}
