import { ExportSettings } from '~/components/section/export/ExportContent';

export type LastSettingsStore = {
  exportSettings: ExportSettings;
  exportedFolderPaths: string[];
};

export const defaultLastSettingsStore: LastSettingsStore = {
  exportSettings: {
    folderPath: undefined,
    fileName: '',
    exportOptions: {
      perLayer: false,
      format: 'png',
      quality: 95,
      scale: 1,
    },
    showDirAfterSave: false,
  },
  exportedFolderPaths: [],
};
