import { onMount } from 'solid-js';
import { settingContainer } from './settings.css';
import EditorSettings from '~/components/section/settings/EditorSettings';
import { loadGlobalSettings } from '~/io/global/globalIO';
import { pageRoot } from '~/styles/global.css';
import { WindowOptionsProp } from '~/utils/windowUtils';

export const SettingsWindowOptions: WindowOptionsProp = {
  url: '/settings',
  width: 420,
  height: 290,
  resizable: false,
  decorations: false,
  minimizable: false,
  maximizable: false,
  closable: true,
  acceptFirstMouse: true,
  focus: true,
  skipTaskbar: true,
};

export default function Settings() {
  onMount(() => {
    loadGlobalSettings();
  });

  return (
    <div class={pageRoot}>
      <div class={settingContainer}>
        <EditorSettings />
      </div>
    </div>
  );
}
