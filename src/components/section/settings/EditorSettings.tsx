import { Component } from 'solid-js';
import Dropdown, { DropdownOption } from '../../common/Dropdown';
import ToggleSwitch from '../../common/ToggleSwitch';
import { saveGlobalSettings } from '~/io/global/globalIO';
import { CanvasRenderingMode, globalStore, setGlobalStore } from '~/stores/global/globalStore';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section_global.css';

const renderingOptions: DropdownOption<CanvasRenderingMode>[] = [
  { label: 'adaptive', value: 'adaptive' },
  { label: 'pixelated', value: 'pixelated' },
  { label: 'crispEdges', value: 'crispEdges' },
];

const EditorSettings: Component<{}> = (props) => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>editor.</p>
      <div class={sectionContent} style={{ gap: '8px' }}>
        <ToggleSwitch
          checked={globalStore.showDirtyRects}
          onChange={(e) => setGlobalStore('showDirtyRects', e)}
        >
          <p style={{ 'font-size': '0.5rem' }}> autosave.</p>
        </ToggleSwitch>

        <p>canvas rendering.</p>

        <Dropdown
          selected={globalStore.canvasRenderingMode}
          value={globalStore.canvasRenderingMode}
          options={renderingOptions}
          onChange={(v) => {
            setGlobalStore('canvasRenderingMode', v);
            saveGlobalSettings();
          }}
        />
      </div>
    </div>
  );
};

export default EditorSettings;
