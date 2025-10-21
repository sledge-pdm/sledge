import { css } from '@acab/ecsstatic';
import { Dropdown, DropdownOption, ToggleSwitch } from '@sledge/ui';
import { Component } from 'solid-js';
import { AutoSnapshotManager } from '~/features/snapshot/AutoSnapshotManager';
import { projectStore, setProjectStore } from '~/stores/ProjectStores';

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
          checked={projectStore.autoSnapshotEnabled || false}
          onChange={(checked: boolean) => {
            setProjectStore('autoSnapshotEnabled', checked);
            if (checked) {
              AutoSnapshotManager.getInstance().doSave();
            }
          }}
          id='auto-snapshot-enabled'
          name='auto-snapshot-enabled'
          labelMode='right'
        >
          {projectStore.autoSnapshotEnabled ? 'enabled' : 'disabled'}
        </ToggleSwitch>

        <div
          class={intervalControlsStyle}
          style={{
            opacity: projectStore.autoSnapshotEnabled ? 1 : 0.5,
            'pointer-events': projectStore.autoSnapshotEnabled ? 'auto' : 'none',
          }}
        >
          <Dropdown
            options={autoSnapshotIntervalOptions}
            value={projectStore.autoSnapshotInterval ?? 15}
            wheelSpin={false}
            disabled={!projectStore.autoSnapshotEnabled}
            onChange={(value) => {
              setProjectStore('autoSnapshotInterval', value);
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AutoSnapshot;
