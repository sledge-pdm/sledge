import { css } from '@acab/ecsstatic';
import { themeOptions } from '@sledge/theme';
import { Show } from 'solid-js';
import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';
import { saveGlobalSettings } from '~/features/io/config/save';

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
    kind: 'header',
    header: 'theme',
  },
  {
    section: ConfigSections.General,
    path: 'general/theme',
    label: 'global theme',
    component: 'Dropdown',
    props: {
      options: themeOptions,
    },
    tips: 'global theme of sledge.',
  },
  {
    section: ConfigSections.General,
    kind: 'header',
    header: 'versions',
  },
  {
    section: ConfigSections.General,
    path: 'general/skippedVersions',
    label: 'skipped versions',
    component: ({ value, onChange }) => {
      const handleClick = async () => {
        onChange([]);
        await saveGlobalSettings(true);
        alert('Reset all skipped versions.');
      };

      const versions = value() as string[];

      return (
        <div class={skippedVersionsContainer}>
          <Show when={versions.length > 0} fallback={<p class={noSkippedVesionsText}>[ No skipped versions. ]</p>}>
            <p class={skippedVesionsText}>{versions.join(', ')}</p>
            <a class={resetSkippedVersionsLink} onClick={handleClick}>
              reset.
            </a>
          </Show>
        </div>
      );
    },
    tips: 'reset skipped update / versions state.',
  },
];
