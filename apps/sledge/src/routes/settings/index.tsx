import { onMount } from 'solid-js';
import ConfigForm from '~/components/config/ConfigForm';
import { loadGlobalSettings } from '~/io/config/load';
import { eventBus } from '~/utils/EventBus';

export default function Settings() {
  onMount(async () => {
    await loadGlobalSettings();
    eventBus.emit('window:routeReady', { ready: true });
  });

  return <ConfigForm />;
}
