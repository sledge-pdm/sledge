import { css } from '@acab/ecsstatic';
import { themeOptions } from '@sledge/theme';
import { Show } from 'solid-js';
import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';
import { saveGlobalSettings } from '~/features/io/config/save';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

const skippedVersionsContainer = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
`;

const skippedVesionsText = css``;
const noSkippedVesionsText = css`
  color: var(--color-muted);
`;
const resetSkippedVersionsLink = css`
  font-family: ZFB03;
  color: var(--color-muted);
  width: fit-content;
  align-self: flex-end;
`;

export const generalMetas: FieldMeta[] = [
  {
    section: ConfigSections.General,
    path: ['general', 'theme'],
    label: 'global theme',
    component: 'Dropdown',
    props: {
      options: themeOptions,
    },
    tips: 'global theme of sledge.',
  },
  {
    section: ConfigSections.General,
    path: ['general', 'skippedVersions'],
    label: 'skipped versions',
    component: 'Custom',
    props: {
      content: () => {
        const handleClick = async () => {
          setGlobalConfig('general', 'skippedVersions', []);
          await saveGlobalSettings(true);
          alert('Reset all skipped versions.');
        };

        const versions = globalConfig.general.skippedVersions;

        return (
          <div class={skippedVersionsContainer}>
            <Show when={versions.length > 0} fallback={<p class={noSkippedVesionsText}>[ No skipped versions. ]</p>}>
              <p class={skippedVesionsText}>{globalConfig.general.skippedVersions.join(', ')}</p>
              <a class={resetSkippedVersionsLink} onClick={handleClick}>
                reset.
              </a>
            </Show>
          </div>
        );
      },
    },
    tips: 'reset skipped update / versions state.',
  },
];
