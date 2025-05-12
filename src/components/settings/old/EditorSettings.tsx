import { Component } from 'solid-js';
import { CanvasRenderingMode } from '~/models/canvas/Canvas';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/components/globals/section_global.css';
import { vars } from '~/styles/global.css';
import { flexRow } from '~/styles/snippets.css';
import { Consts } from '~/utils/consts';
import Dropdown, { DropdownOption } from '../../common/basics/Dropdown';

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
              value={globalConfig.newProject.canvasSize.width}
              onInput={(e) => {
                setGlobalConfig('newProject', 'canvasSize', 'width', Number(e.target.value));
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
              value={globalConfig.newProject.canvasSize.height}
              onInput={(e) => {
                setGlobalConfig('newProject', 'canvasSize', 'height', Number(e.target.value));
              }}
              style={{ 'font-size': '10px' }}
              required
            />
          </div>
        </div>

        <p>canvas rendering (temp not works).</p>
        <Dropdown
          value={globalConfig.editor.canvasRenderingMode}
          options={renderingOptions}
          onChange={(v) => {
            setGlobalConfig('performance', 'canvasRenderingMode', v);
          }}
        />
      </div>
    </div>
  );
};

export default EditorSettings;
