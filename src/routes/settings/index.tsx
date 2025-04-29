import { onCleanup, onMount } from 'solid-js';
import EditorSettings from '~/components/section/settings/EditorSettings';
import KeyConfigSettings from '~/components/section/settings/KeyConfigSettings';
import PerformanceSettings from '~/components/section/settings/PerformanceSettings';
import { loadGlobalSettings, saveGlobalSettings } from '~/io/global_config/globalSettings';
import { pageRoot } from '~/styles/global.css';
import { flexCol, flexRow } from '~/styles/snippets.css';
import { WindowOptionsProp } from '~/utils/windowUtils';
import { settingContainer } from './settings.css';

export const SettingsWindowOptions: WindowOptionsProp = {
  url: '/settings',
  width: 500,
  height: 300,
  resizable: false,
  decorations: false,
  minimizable: false,
  maximizable: false,
  closable: true,
  acceptFirstMouse: true,
  focus: true,
  skipTaskbar: true,
  alwaysOnTop: true,
};

export default function Settings() {
  onMount(() => {
    loadGlobalSettings();
  });

  onCleanup(async () => {
    await saveGlobalSettings();
  });

  return (
    <div class={pageRoot}>
      <form
        class={settingContainer}
        onChange={(e) => {
          saveGlobalSettings();
        }}
      >
        <div class={flexRow} style={{ 'flex-grow': 1, gap: '16px' }}>
          <div class={flexCol} style={{ 'flex-grow': 1, gap: '16px' }}>
            <EditorSettings />
            <PerformanceSettings />
          </div>
          <div class={flexCol} style={{ 'flex-grow': 1, gap: '16px' }}>
            <KeyConfigSettings />
          </div>
        </div>
      </form>
    </div>
  );
}
