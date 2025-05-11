import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { onMount } from 'solid-js';
import EditorSettings from '~/components/settings/EditorSettings';
import KeyConfigSettings from '~/components/settings/KeyConfigSettings';
import PerformanceSettings from '~/components/settings/PerformanceSettings';
import { loadGlobalSettings, saveGlobalSettings } from '~/io/global_config/globalSettings';
import { pageRoot } from '~/styles/global.css';
import { flexCol, flexRow } from '~/styles/snippets.css';
import { emitGlobalEvent } from '~/utils/TauriUtils';
import { WindowOptionsProp } from '~/utils/WindowUtils';
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
  onMount(async () => {
    await loadGlobalSettings();
    getCurrentWebviewWindow().onCloseRequested(async () => {
      await saveGlobalSettings();
      await emitGlobalEvent("onSettingsSaved");
    })
  });

  return (
    <div class={pageRoot}>
      <div class={settingContainer}>
        <div class={flexRow} style={{ 'flex-grow': 1, gap: '16px' }}>
          <div class={flexCol} style={{ 'flex-grow': 1, gap: '16px' }}>
            <EditorSettings />
            <PerformanceSettings />
          </div>
          <div class={flexCol} style={{ 'flex-grow': 1, gap: '16px' }}>
            <KeyConfigSettings />
          </div>
        </div>
      </div>
    </div>
  );
}
