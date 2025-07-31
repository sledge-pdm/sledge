import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { ToggleSwitch } from '@sledge/ui';
import { Component, Show } from 'solid-js';
import { fileStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/ProjectStores';
import { sectionCaption, sectionContent, sectionRoot, sectionSubCaption } from '~/styles/section/section_item.css';

const AutoSave: Component = () => {
  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>Auto Save.</p>
      <div class={sectionContent} style={{ 'padding-left': '8px', gap: '6px', 'margin-bottom': '8px' }}>
        {/* <p>configure periodic save.</p> */}
        <ToggleSwitch
          checked={projectStore.autoSaveEnabled || false}
          onChange={(checked) => setProjectStore('autoSaveEnabled', checked)}
          id='auto-save-enabled'
          name='auto-save-enabled'
          labelMode='right'
        >
          Enable Auto Save
        </ToggleSwitch>
        <Show when={projectStore.autoSaveEnabled && (fileStore.location.name === undefined || fileStore.location.path === undefined)}>
          <p style={{ color: vars.color.warn, 'margin-top': '8px', 'line-height': 1.1 }}>
            autosave stops.
            <br />
            save to start autosave.
          </p>
        </Show>
        <p class={sectionSubCaption}>interval. (15 - 300 sec)</p>
        <div
          class={flexRow}
          style={{
            'align-items': 'baseline',
            gap: '4px',
            'padding-left': '4px',
            'margin-top': '-6px',
            opacity: projectStore.autoSaveEnabled ? 1 : 0.3,
            'pointer-events': projectStore.autoSaveEnabled ? 'auto' : 'none',
          }}
        >
          <input
            style={{ 'font-size': vars.text.xl, 'max-width': '40px' }}
            value={projectStore.autoSaveInterval}
            type='number'
            placeholder='30'
            onBlur={(e) => {
              const value = Number(e.currentTarget.value);
              const clampedValue = Math.min(Math.max(value, 15), 300);
              setProjectStore('autoSaveInterval', clampedValue);
              e.currentTarget.value = String(clampedValue);
            }}
          />
          <p>seconds</p>
        </div>
      </div>
    </div>
  );
};

export default AutoSave;
