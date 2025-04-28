import { Component } from 'solid-js';
import CanvasSettings from '../section/CanvasSettings';
import Color from '../section/Color';
import LayerList from '../section/LayerList';
import Project from '../section/Project';
import ToolConfig from '../section/ToolConfig';

import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { sideAreaContent } from '~/styles/components/side_sections.css';

const SideSections: Component = () => {
  return (
    <div class={sideAreaContent}>
      <a onClick={() => getCurrentWebviewWindow().close()}>&lt; back</a>
      <Project />
      <Color />
      <ToolConfig />
      <LayerList />
      <CanvasSettings />
    </div>
  );
};

export default SideSections;
