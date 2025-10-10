import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { Consts } from '~/Consts';
import { ToolCategoryId, ToolPresets } from '~/features/tools/Tools';
import { setFileStore, setToolStore, toolStore } from '~/stores/EditorStores';
import { eventBus } from '~/utils/EventBus';
import { pathToFileLocation } from '~/utils/FileUtils';

export function setLocation(path: string) {
  const fileLocation = pathToFileLocation(path);
  if (!fileLocation) return;
  setFileStore('savedLocation', fileLocation);
}

// make app config path (%APPDATA%/Roaming/com.innsbluck.sledge/) if not exists
export async function ensureAppConfigPath() {
  if (!(await exists('', { baseDir: BaseDirectory.AppConfig }))) {
    await mkdir('', { baseDir: BaseDirectory.AppConfig, recursive: true });
  }
}

interface PresetRecord {
  toolId: ToolCategoryId;
  presets: ToolPresets;
}

export async function saveToolPresets() {
  await ensureAppConfigPath();

  const settings = toolStore.tools;
  console.log(settings);
  const presets: PresetRecord[] = Object.values(settings)
    .map((tool) => {
      if (!tool.presets) return null;
      return {
        toolId: tool.id,
        presets: tool.presets,
      };
    })
    .filter((preset): preset is PresetRecord => preset !== null);

  console.log(presets);

  await writeTextFile(Consts.toolPresetsConfigFileName, JSON.stringify(presets, null, 2), {
    baseDir: BaseDirectory.AppConfig,
    create: true,
  });
}

export async function loadToolPresets() {
  await ensureAppConfigPath();

  try {
    const settings = await readTextFile(Consts.toolPresetsConfigFileName, {
      baseDir: BaseDirectory.AppConfig,
    });

    const parsed = JSON.parse(settings) as PresetRecord[];
    if (!Array.isArray(parsed)) return;

    console.log('tool settings loaded:', parsed);

    parsed.forEach((record) => {
      setToolStore('tools', record.toolId, 'presets', record.presets);
      eventBus.emit('tools:presetLoaded', { toolId: record.toolId });
    });

    console.log('presets updated: ', toolStore.tools);
  } catch (e) {
    console.error('tool settings load failed.', e);
    return;
  }
}
