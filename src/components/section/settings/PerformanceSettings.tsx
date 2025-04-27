import { Component } from 'solid-js';
import { saveGlobalSettings } from '~/io/global/globalIO';
import { globalStore, setGlobalStore } from '~/stores/global/globalStore';
import {
  sectionCaption,
  sectionContent,
  sectionRoot,
} from '~/styles/section_global.css';
import Checkbox from '~/components/common/Checkbox';

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
      </div>
    </div>
  );
};

export default PerformanceSettings;
