import { createSignal, onMount, Show } from 'solid-js';
import ConfigForm from '~/components/config/ConfigForm';
import { loadGlobalConfig } from '~/features/io/config/load';
import { ErrorTypes } from '~/features/io/project/ProjectLoader';
import { InitialLoadTypes } from '~/routes/editor/load';
import { reportInitialLoadError } from '~/routes/editor/loadError';
import { pageRoot } from '~/styles/styles';
import { showMainWindow } from '~/utils/WindowUtils';

export default function Settings() {
  const [configLoaded, setConfigLoaded] = createSignal(false);

  onMount(async () => {
    try {
      await loadGlobalConfig();
      setConfigLoaded(true);
      await showMainWindow();
    } catch (e) {
      await reportInitialLoadError(InitialLoadTypes.UNKNOWN, {
        type: ErrorTypes.UNKNOWN_ERROR,
        detail: `Unknown error while settings window load.\n${e}`,
        stacktrace: e instanceof Error ? e.stack : undefined,
      });
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
