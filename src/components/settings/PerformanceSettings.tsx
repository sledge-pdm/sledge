import { Component } from 'solid-js';
import Checkbox from '~/components/common/basics/Checkbox';
import { globalStore, setGlobalStore } from '~/stores/GlobalStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/components/globals/section_global.css';

const PerformanceSettings: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>performance.</p>
      <div class={sectionContent} style={{ gap: '8px' }}>
        <Checkbox
          label='show dirtyrects.'
          checked={globalStore.showDirtyRects}
          onChange={(e) => setGlobalStore('showDirtyRects', e)}
        />
        <Checkbox
          label='performance monitor.'
          checked={globalStore.showPerfMonitor}
          onChange={(e) => setGlobalStore('showPerfMonitor', e)}
        />
        <Checkbox
          label='enable webgl render.'
          checked={globalStore.enableGLRender}
          onChange={(e) => setGlobalStore('enableGLRender', e)}
        />
      </div>
    </div>
  );
};

export default PerformanceSettings;
