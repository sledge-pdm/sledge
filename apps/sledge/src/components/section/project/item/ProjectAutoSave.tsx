import { css } from '@acab/ecsstatic';
import { Dropdown, DropdownOption, ToggleSwitch } from '@sledge/ui';
import { Component } from 'solid-js';
import { projectStore, setProjectStore } from '~/stores/ProjectStores';
import { sectionSubCaption, sectionSubContent } from '../../SectionStyles';

const autoSaveContentStyle = css`
  gap: 12px;
  margin-top: 8px;
`;

const intervalContainerStyle = css`
  display: flex;
`;

const intervalControlsStyle = css`
  display: flex;
  align-items: center;
  box-sizing: border-box;
`;

const intervalLabelStyle = css`
  color: var(--color-on-background);
  width: 72px;
`;

const autoSaveIntervalOptions: DropdownOption<number>[] = [
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
];

const ProjectAutoSave: Component = () => {
  return (
    <>
      <p class={sectionSubCaption}>Auto Save.</p>
      <div class={sectionSubContent}>
        <ToggleSwitch
          checked={projectStore.autoSaveEnabled || false}
          onChange={(checked: boolean) => setProjectStore('autoSaveEnabled', checked)}
          id='auto-save-enabled'
          name='auto-save-enabled'
          labelMode='right'
        >
          {projectStore.autoSaveEnabled ? (projectStore.lastSavedAt ? 'enabled' : 'suspended (save to start)') : 'disabled'}
        </ToggleSwitch>

        <div
          class={intervalContainerStyle}
          style={{
            opacity: projectStore.autoSaveEnabled ? 1 : 0.5,
          }}
        >
          <div
            class={intervalControlsStyle}
            style={{
              'pointer-events': projectStore.autoSaveEnabled ? 'auto' : 'none',
            }}
          >
            <p class={intervalLabelStyle}>interval.</p>
            <Dropdown
              options={autoSaveIntervalOptions}
              value={projectStore.autoSaveInterval ?? 15}
              wheelSpin={false}
              disabled={!projectStore.autoSaveEnabled}
              onChange={(value) => {
                setProjectStore('autoSaveInterval', value);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectAutoSave;
