import { Component } from 'solid-js';
import { saveGlobalSettings } from '~/io/global/globalIO';
import { globalStore, setGlobalStore } from '~/stores/global/globalStore';
import {
  sectionCaption,
  sectionContent,
  sectionRoot,
} from '~/styles/section_global.css';
import { CanvasRenderingMode } from '~/types/Canvas';
import Dropdown, { DropdownOption } from '../../common/Dropdown';
import ToggleSwitch from '../../common/ToggleSwitch';
import Checkbox from '~/components/common/Checkbox';
import RadioButton from '~/components/common/RadioButton';

const renderingOptions: DropdownOption<CanvasRenderingMode>[] = [
  { label: 'adaptive', value: 'adaptive' },
  { label: 'pixelated', value: 'pixelated' },
  { label: 'crispEdges', value: 'crispEdges' },
];

const EditorSettings: Component = () => {
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

        <div>
          <p>autosave span.</p>
          <input type='number' name='width' min={0} max={10000} required />
        </div>
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

        <Checkbox label='chexkbox.' />

        <RadioButton label='radiobutton.' name='some' />
      </div>
    </div>
  );
};

export default EditorSettings;
