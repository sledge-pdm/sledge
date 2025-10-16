import { ExportSettings } from '~/components/section/export/ExportContent';

export type LastSettingsStore = {
  exportSettings: ExportSettings;
  exportedDirPaths: string[];
};

export const defaultLastSettingsStore: LastSettingsStore = {
  exportSettings: {
    dirPath: undefined,
    fileName: '',
    exportOptions: {
      perLayer: false,
      format: 'png',
      quality: 95,
      scale: 1,
    },
    showDirAfterSave: false,
  },
  exportedDirPaths: [],
};
