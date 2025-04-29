import { Component } from 'solid-js';
import { globalStore, setGlobalStore } from '~/stores/GlobalStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/components/globals/section_global.css';
import { vars } from '~/styles/global.css';
import { flexRow } from '~/styles/snippets.css';
import { CanvasRenderingMode } from '~/types/Canvas';
import { Consts } from '~/utils/consts';
import Dropdown, { DropdownOption } from '../common/basics/Dropdown';

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
        <div>
          <p>default canvas size.</p>
          <div class={flexRow} style={{ gap: vars.spacing.xs, 'margin-top': vars.spacing.sm, 'align-items': 'center' }}>
            <input
              type='number'
              name='width'
              min={Consts.minCanvasWidth}
              max={Consts.maxCanvasWidth}
              value={globalStore.newProjectCanvasSize.width}
              onChange={(e) => {
                setGlobalStore('newProjectCanvasSize', 'width', Number(e.target.value));
              }}
              style={{ 'font-size': '10px' }}
              required
            />
            <p>x</p>
            <input
              type='number'
              name='height'
              min={Consts.minCanvasHeight}
              max={Consts.maxCanvasHeight}
              value={globalStore.newProjectCanvasSize.height}
              onChange={(e) => {
                setGlobalStore('newProjectCanvasSize', 'height', Number(e.target.value));
              }}
              style={{ 'font-size': '10px' }}
              required
            />
          </div>
        </div>

        <div>
          <p>autosave span (wip).</p>
          <input type='number' name='width' min={100} max={1000000} required />
        </div>

        <p>canvas rendering (temp not works).</p>
        <Dropdown
          selected={globalStore.canvasRenderingMode}
          value={globalStore.canvasRenderingMode}
          options={renderingOptions}
          onChange={(v) => {
            setGlobalStore('canvasRenderingMode', v);
          }}
        />
      </div>
    </div>
  );
};

export default EditorSettings;
