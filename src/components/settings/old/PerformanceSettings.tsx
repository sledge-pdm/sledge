import { Component } from 'solid-js';
import Checkbox from '~/components/common/basics/Checkbox';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/components/globals/section_global.css';

const PerformanceSettings: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>performance.</p>
      <div class={sectionContent} style={{ gap: '8px' }}>
        <Checkbox
          label='show dirtyrects.'
          checked={globalConfig.debug.showDirtyRects}
          onChange={(e) => setGlobalConfig('debug', 'showDirtyRects', e)}
        />
        <Checkbox
          label='performance monitor.'
          checked={globalConfig.debug.showPerfMonitor}
          onChange={(e) => setGlobalConfig('debug', 'showPerfMonitor', e)}
        />
        <Checkbox
          label='enable webgl render.'
          checked={globalConfig.editor.enableGLRender}
          onChange={(e) => setGlobalConfig('performance', 'enableGLRender', e)}
        />
      </div>
    </div>
  );
};

export default PerformanceSettings;
