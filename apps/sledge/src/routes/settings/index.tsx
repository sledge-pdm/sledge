import { onMount } from 'solid-js';
import ConfigForm from '~/components/config/ConfigForm';
import loadGlobalSettings from '~/io/config/load';

export default function Settings() {
  onMount(async () => {
    await loadGlobalSettings();
  });

  return <ConfigForm />;
}
