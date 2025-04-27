import { Component } from 'solid-js';
import CanvasSettings from './section/CanvasSettings';
import Color from './section/Color';
import LayerList from './section/LayerList';
import ToolConfig from './section/ToolConfig';
import Project from './section/Project';

import { sideAreaContent } from '~/styles/components/side_sections.css';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const SideSections: Component = () => {
  return (
    <div class={sideAreaContent}>
      <a onClick={() => getCurrentWebviewWindow().close()}>&lt; back</a>
      <Project />
      <Color />
      <ToolConfig />
      <LayerList />
      <CanvasSettings />
      {/* <button
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
      </button> */}
      {/* <GlobalSettings /> */}
    </div>
  );
};

export default SideSections;
