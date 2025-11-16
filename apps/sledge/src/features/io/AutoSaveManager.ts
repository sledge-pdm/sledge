import { saveProject } from '~/features/io/project/out/save';
import { fileStore } from '~/stores/EditorStores';

/**
 * @deprecated use AutoSnapshotManager instead
 */
export class AutoSaveManager {
  private static instance: AutoSaveManager;
  private currentInterval: number | undefined = undefined;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): AutoSaveManager {
    if (!AutoSaveManager.instance) {
      AutoSaveManager.instance = new AutoSaveManager();
    }
    return AutoSaveManager.instance;
  }

  public getCurrentInterval(): number | undefined {
    return this.currentInterval;
  }

  public startAutoSave(interval: number): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.currentInterval = interval;
    this.intervalId = setInterval(async () => {
      if (fileStore.savedLocation.name && fileStore.savedLocation.path) {
        await saveProject(fileStore.savedLocation.name, fileStore.savedLocation.path);
      } else {
        console.warn('Auto-save skipped: No valid file location.');
      }
    }, interval * 1000);
  }

  public stopAutoSave(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
