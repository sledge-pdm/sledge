import { css } from '@acab/ecsstatic';
import { Nothing, themeOptions } from '@sledge-pdm/ui';
import { Show } from 'solid-js';
import { ConfigSections, FieldMeta } from '~/config/ConfigMeta';
import { saveGlobalSettings } from '~/features/io/config/save';

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
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
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
          <Show when={versions.length > 0} fallback={<Nothing>no skipped versions.</Nothing>}>
            <p>{versions.join(', ')}</p>
            <button type='button' class={resetSkippedVersionsLink} onClick={handleClick}>
              reset.
            </button>
          </Show>
        </div>
      );
    },
    tips: 'reset skipped update / versions state.',
  },
];
