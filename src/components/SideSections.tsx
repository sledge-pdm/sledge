import { Component } from 'solid-js';
import CanvasSettings from './section/CanvasSettings';
import Color from './section/Color';
import LayerList from './section/LayerList';
import PenConfig from './section/PenConfig';
import Project from './section/Project';

import { loadGlobalSettings } from '~/io/global/globalIO';
import { SettingsWindowOptions } from '~/routes/settings';
import { sideAreaContent } from '~/styles/components/side_sections.css';
import { openSingletonWindow } from '~/utils/windowUtils';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const SideSections: Component = () => {
  return (
    <div class={sideAreaContent}>
      <a onClick={() => getCurrentWebviewWindow().close()}>&lt; back</a>
      <Project />
      <Color />
      <PenConfig />
      <LayerList />
      <CanvasSettings />
      <button
        onClick={async () => {
          const settingsWin = await openSingletonWindow(
            'settings',
            SettingsWindowOptions
          );
          settingsWin.onCloseRequested(() => {
            loadGlobalSettings();
          });
        }}
      >
        settings.
      </button>
      {/* <GlobalSettings /> */}
    </div>
  );
};

export default SideSections;
