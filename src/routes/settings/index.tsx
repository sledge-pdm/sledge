import { onCleanup, onMount } from 'solid-js';
import EditorSettings from '~/components/section/settings/EditorSettings';
import PerformanceSettings from '~/components/section/settings/PerformanceSettings';
import { loadGlobalSettings, saveGlobalSettings } from '~/io/global_setting/globalSettings';
import { pageRoot } from '~/styles/global.css';
import { WindowOptionsProp } from '~/utils/windowUtils';
import { settingContainer } from './settings.css';

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
        <EditorSettings />
        <PerformanceSettings />
        {/* <button
          onClick={() => {
            console.log('[globalIO] 設定保存完了');
            saveGlobalSettings();
          }}
        >
          save.
        </button> */}
      </form>
    </div>
  );
}
