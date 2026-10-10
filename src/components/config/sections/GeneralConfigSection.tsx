import { css } from '@acab/ecsstatic';
import { Dropdown, Nothing, Theme, themeOptions } from '@sledge-pdm/ui';
import { Component, Show } from 'solid-js';
import ConfigItem from '~/components/config/ConfigItem';
import { configFormFieldHeader } from '~/components/config/ConfigStyles';
import { saveGlobalSettings } from '~/features/io/config/save';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

const skippedVersionsContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
`;

const resetSkippedVersionsLink = css`
  font-family: ZFB03;
  color: var(--color-muted);
  width: fit-content;
  align-self: flex-end;
`;

const GeneralConfigSection: Component = () => {
  const resetSkippedVersions = async () => {
    setGlobalConfig('general', 'skippedVersions', []);
    await saveGlobalSettings(true);
    alert('Reset all skipped versions.');
  };

  return (
    <>
      <p class={configFormFieldHeader}>THEME.</p>
      <ConfigItem label='global theme' tips='global theme of sledge.'>
        <Dropdown value={globalConfig.general.theme} options={themeOptions} onChange={(v) => setGlobalConfig('general', 'theme', v as Theme)} />
      </ConfigItem>

      <p class={configFormFieldHeader}>VERSIONS.</p>
      <ConfigItem label='skipped versions' tips='reset skipped update / versions state.'>
        <div class={skippedVersionsContainer}>
          <Show when={globalConfig.general.skippedVersions.length > 0} fallback={<Nothing>no skipped versions.</Nothing>}>
            <p>{globalConfig.general.skippedVersions.join(', ')}</p>
            <a class={resetSkippedVersionsLink} onClick={resetSkippedVersions}>
              reset.
            </a>
          </Show>
        </div>
      </ConfigItem>
    </>
  );
};

export default GeneralConfigSection;
