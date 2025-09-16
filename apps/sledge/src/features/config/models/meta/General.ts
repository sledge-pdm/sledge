import { themeOptions } from '@sledge/theme';
import { FieldMeta } from '~/features/config/models/GlobalConfig';
import { Sections } from '~/features/config/models/Sections';
import { saveGlobalSettings } from '~/io/config/save';
import { globalConfig, setGlobalConfig } from '~/stores/GlobalStores';

export const generalMetas: FieldMeta[] = [
  {
    section: Sections.General,
    path: ['appearance', 'theme'],
    label: 'global theme',
    component: 'Dropdown',
    props: {
      options: themeOptions,
    },
    tips: 'global theme of sledge.',
  },
  {
    section: Sections.General,
    path: ['appearance', 'resetSkippedVersions'],
    label: 'reset skipped versions',
    component: 'Button',
    props: {
      preContent: () => {
        if (globalConfig.misc.skippedVersions.length === 0) {
          return '[ No skipped versions. ]';
        }
        return 'Skipped Versions: ' + globalConfig.misc.skippedVersions.join(', ');
      },
      content: 'reset skipped versions',
      onClick: async () => {
        setGlobalConfig('misc', 'skippedVersions', []);
        await saveGlobalSettings(true);
        alert('Reset all skipped versions.');
      },
    },
    tips: 'reset skipped update / versions state.',
  },
];
