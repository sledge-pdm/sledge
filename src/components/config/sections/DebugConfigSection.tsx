import { css } from '@acab/ecsstatic';
import { Dropdown, ToggleSwitch } from '@sledge-pdm/ui';
import { Component, Show } from 'solid-js';
import ConfigItem from '~/components/config/ConfigItem';
import { configFormFieldControlLabel, configFormFieldHeader } from '~/components/config/ConfigStyles';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';
import { flexCol } from '~/styles/styles';

const devWarnText = css`
  color: var(--color-warn);
`;

const DebugConfigSection: Component = () => {
  return (
    <>
      <p class={configFormFieldHeader}>MONITOR.</p>
      <ConfigItem label='show performance monitor' tips='show performance monitor.'>
        <ToggleSwitch
          labelMode='none'
          checked={globalConfig.debug.showPerformanceMonitor}
          onChange={(v) => setGlobalConfig('debug', 'showPerformanceMonitor', v)}
        />
        <label class={configFormFieldControlLabel} style={{ 'padding-left': 'var(--spacing-sm)' }}>
          {globalConfig.debug.showPerformanceMonitor ? 'enabled' : 'disabled'}.
        </label>
      </ConfigItem>

      <p class={configFormFieldHeader}>UPDATES.</p>
      <ConfigItem label='update channel' tips='preferred update channel.'>
        <div class={flexCol} style={{ gap: '8px' }}>
          <Dropdown
            value={globalConfig.debug.updateChannel}
            options={[
              { label: 'stable', value: 'stable' },
              { label: 'stable + dev', value: 'stable|dev' },
              { label: 'dev only', value: 'dev' },
            ]}
            onChange={(v) => setGlobalConfig('debug', 'updateChannel', v)}
          />
          <Show when={globalConfig.debug.updateChannel.includes('dev')}>
            <p class={devWarnText}>
              Dev builds can be unstable and may put your computer or projects at risk.
              <br />
              Use at your own risk!
            </p>
          </Show>
        </div>
      </ConfigItem>
    </>
  );
};

export default DebugConfigSection;
