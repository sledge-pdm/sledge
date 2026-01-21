import { Consts } from '~/Consts';
import { saveGlobalSettings } from '~/features/io/config/save';
import { getDefaultSettings, getFallbackedSettings } from '~/features/io/config/set';
import { ErrorTypes, LoadError } from '~/features/io/project/ProjectLoader';
import { logSystemError, logSystemInfo, logSystemWarn } from '~/features/log/service';
import { loadConfigToGlobalStore } from '~/stores/GlobalStores';
import { fs } from '~/utils/platform';
import { Config } from '../types/Config';

const LOG_LABEL = 'ConfigLoader';
const getErrorStacktrace = (e: unknown): string | undefined => (e instanceof Error ? e.stack : undefined);

export const GLOBAL_CONFIG_ERROR_FILE_NOT_FOUND = 'GlobalConfig file not found.';
export const GLOBAL_CONFIG_ERROR_FAILED_FILE_READ = 'Failed to read GlobalConfig file.';
export const GLOBAL_CONFIG_ERROR_FAILED_PARSE_JSON = 'Failed to parse GlobalConfig JSON.';
export const GLOBAL_CONFIG_ERROR_INTERNAL = 'Internal error while loading GlobalConfig.';

/**
 * Optimistic load for GlobalConfig. If file not found, returns default settings.
 */
export async function loadGlobalConfig(): Promise<{
  store: Config;
  error?: LoadError;
}> {
  const baseDir = fs.BaseDirectory?.AppConfig;
  const defaultSettings = getDefaultSettings();
  try {
    let isConfigExists = false;
    try {
      isConfigExists = baseDir ? await fs.exists(Consts.globalConfigFileName, { baseDir }) : await fs.exists(Consts.globalConfigFileName);
    } catch (_e) {
      // Let pass through as not existing
    }

    if (!isConfigExists) {
      logSystemWarn('No global settings found, create one with default values.', { label: LOG_LABEL });
      loadConfigToGlobalStore(defaultSettings);
      await saveGlobalSettings(false);
      return {
        store: defaultSettings,
        error: {
          type: ErrorTypes.FILE_NOT_FOUND,
          detail: GLOBAL_CONFIG_ERROR_FILE_NOT_FOUND,
        },
      };
    }

    let configData: string | undefined;
    try {
      configData = await fs.readTextFile(Consts.globalConfigFileName, baseDir ? { baseDir } : undefined);
    } catch (e) {
      logSystemError(GLOBAL_CONFIG_ERROR_FAILED_FILE_READ, { label: LOG_LABEL, details: [e] });
      loadConfigToGlobalStore(defaultSettings);
      await saveGlobalSettings(false);
      return {
        store: defaultSettings,
        error: {
          type: ErrorTypes.INTERNAL_ERROR,
          detail: GLOBAL_CONFIG_ERROR_FAILED_FILE_READ,
          stacktrace: getErrorStacktrace(e),
        },
      };
    }

    try {
      const configJson = JSON.parse(configData);
      logSystemInfo('json data loaded from file.', { label: LOG_LABEL, debugOnly: true });
      const fallbackedConfigJson = getFallbackedSettings(configJson);
      loadConfigToGlobalStore(fallbackedConfigJson);
      await saveGlobalSettings(false);
      return {
        store: fallbackedConfigJson,
        error: undefined,
      };
    } catch (e) {
      logSystemError(GLOBAL_CONFIG_ERROR_FAILED_PARSE_JSON, { label: LOG_LABEL, details: [e] });
      logSystemWarn('create config with default values.', { label: LOG_LABEL });
      loadConfigToGlobalStore(defaultSettings);
      await saveGlobalSettings(false);
      return {
        store: defaultSettings,
        error: {
          type: ErrorTypes.INTERNAL_ERROR,
          detail: GLOBAL_CONFIG_ERROR_FAILED_PARSE_JSON,
          stacktrace: getErrorStacktrace(e),
        },
      };
    }
  } catch (e) {
    // fallback to default
    loadConfigToGlobalStore(defaultSettings);
    await saveGlobalSettings(false);
    return {
      store: defaultSettings,
      error: {
        type: ErrorTypes.INTERNAL_ERROR,
        detail: GLOBAL_CONFIG_ERROR_INTERNAL,
        stacktrace: getErrorStacktrace(e),
      },
    };
  }
}
