import { Component, Show } from 'solid-js';
import CanvasSettings from '../section/CanvasSettings';
import Color from '../section/Color';
import LayerList from '../section/LayerList';
import Project from '../section/Project';
import ToolConfig from '../section/ToolConfig';

import { appearanceStore } from '~/stores/EditorStores';
import { sideAreaContent, sideAreaMenu, sideAreaRoot } from '~/styles/components/globals/side_sections.css';
import SectionTopMenu from './SectionTopMenu';

const SideSections: Component = () => {
  return (
    <div class={sideAreaRoot}>
      <div class={sideAreaMenu}>
        <SectionTopMenu />
      </div>
      <div class={sideAreaContent}>
        {/* <a onClick={() => getCurrentWebviewWindow().close()}>&lt; back</a> */}
        <Show when={appearanceStore.sideAppearanceMode === 'editor'}>
          <Color />
          <ToolConfig />
          <LayerList />
        </Show>
        <Show when={appearanceStore.sideAppearanceMode === 'project'}>
          <Project />
          <CanvasSettings />
        </Show>
      </div>
    </div>
  );
};

export default SideSections;
