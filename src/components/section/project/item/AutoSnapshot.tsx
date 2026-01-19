import { css } from '@acab/ecsstatic';
import { Dropdown, DropdownOption, ToggleSwitch } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import { escapeCurrentAutosave } from '~/features/snapshot';
import { AutoSnapshotManager } from '~/features/snapshot/AutoSnapshotManager';
import { projectStoreFormer, setProjectStoreFormer } from '~/stores/ProjectStores';

const caption = css`
  font-family: ZFB03;
  font-size: var(--text-sm);
  opacity: 0.8;
`;
const container = css`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;
const intervalControlsStyle = css`
  display: flex;
  align-items: center;
`;

const autoSnapshotIntervalOptions: DropdownOption<number>[] = [
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
];

const AutoSnapshot: Component = () => {
  return (
    <>
      <p class={caption}>Auto Snapshot.</p>
      <div class={container}>
        <ToggleSwitch
          checked={projectStoreFormer.autoSnapshotEnabled || false}
          onChange={(checked: boolean) => {
            setProjectStoreFormer('autoSnapshotEnabled', checked);
            if (checked) {
              escapeCurrentAutosave();
              AutoSnapshotManager.getInstance().doSave();
            }
          }}
          id='auto-snapshot-enabled'
          name='auto-snapshot-enabled'
          labelMode='right'
        >
          {projectStoreFormer.autoSnapshotEnabled ? 'enabled' : 'disabled'}
        </ToggleSwitch>

        <div
          class={intervalControlsStyle}
          style={{
            opacity: projectStoreFormer.autoSnapshotEnabled ? 1 : 0.5,
            'pointer-events': projectStoreFormer.autoSnapshotEnabled ? 'auto' : 'none',
          }}
        >
          <Dropdown
            options={autoSnapshotIntervalOptions}
            value={projectStoreFormer.autoSnapshotInterval ?? 15}
            wheelSpin={false}
            disabled={!projectStoreFormer.autoSnapshotEnabled}
            onChange={(value) => {
              setProjectStoreFormer('autoSnapshotInterval', value);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AutoSnapshot;
