import { ToggleSwitch } from '@sledge-pdm/ui';
import { Component } from 'solid-js';
import ConfigItem from '~/components/config/ConfigItem';
import { configFormFieldControlLabel, configFormFieldHeader } from '~/components/config/ConfigStyles';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

const ProtectionConfigSection: Component = () => {
  return (
    <>
      <p class={configFormFieldHeader}>LAYER.</p>
      <ConfigItem label='confirm before remove' tips='require confirm before removing layer. if disabled, skip confirm.'>
        <ToggleSwitch
          labelMode='none'
          checked={globalConfig.editor.requireConfirmBeforeLayerRemove}
          onChange={(v) => setGlobalConfig('editor', 'requireConfirmBeforeLayerRemove', v)}
        />
        <label class={configFormFieldControlLabel} style={{ 'padding-left': 'var(--spacing-sm)' }}>
          {globalConfig.editor.requireConfirmBeforeLayerRemove ? 'enabled' : 'disabled'}.
        </label>
      </ConfigItem>
      <ConfigItem label='confirm before clear' tips='require confirm before clearing layer. if disabled, skip confirm.'>
        <ToggleSwitch
          labelMode='none'
          checked={globalConfig.editor.requireConfirmBeforeLayerClear}
          onChange={(v) => setGlobalConfig('editor', 'requireConfirmBeforeLayerClear', v)}
        />
        <label class={configFormFieldControlLabel} style={{ 'padding-left': 'var(--spacing-sm)' }}>
          {globalConfig.editor.requireConfirmBeforeLayerClear ? 'enabled' : 'disabled'}.
        </label>
      </ConfigItem>
    </>
  );
};

export default ProtectionConfigSection;
