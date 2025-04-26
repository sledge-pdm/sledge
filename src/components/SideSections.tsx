import { Component } from 'solid-js';
import CanvasSettings from './section/CanvasSettings';
import Color from './section/Color';
import LayerList from './section/LayerList';
import PenConfig from './section/PenConfig';
import Project from './section/Project';

import { SettingsWindowOptions } from '~/routes/settings';
import { sideAreaContent } from '~/styles/global.css';
import { openSingletonWindow } from '~/utils/windowUtils';

const SideSections: Component<{}> = (props) => {
  return (
    <div class={sideAreaContent}>
      {/* <a onClick={() => (window.location.href = "/")}>&lt; back</a> */}
      <Project />
      <Color />
      <PenConfig />
      <LayerList />
      <CanvasSettings />
      <button onClick={() => openSingletonWindow('settings', SettingsWindowOptions)}>
        settings.
      </button>
      {/* <GlobalSettings /> */}
    </div>
  );
};

export default SideSections;
