import { createCurrentProjectSnapshot, overwriteSnapshotWithName } from '~/features/snapshot/service';

export class AutoSnapshotManager {
  private static instance: AutoSnapshotManager;
  private currentInterval: number | undefined = undefined;
  private intervalId: NodeJS.Timeout | null = null;

  private readonly SNAPSHOT_NAME = 'auto-saved';

  private constructor() {}

  public static getInstance(): AutoSnapshotManager {
    if (!AutoSnapshotManager.instance) {
      AutoSnapshotManager.instance = new AutoSnapshotManager();
    }
    return AutoSnapshotManager.instance;
  }

  public getCurrentInterval(): number | undefined {
    return this.currentInterval;
  }

  public start(interval: number): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.currentInterval = interval;
    this.intervalId = setInterval(async () => {
      await this.doSave();
    }, interval * 1000);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async doSave() {
    overwriteSnapshotWithName(this.SNAPSHOT_NAME, await createCurrentProjectSnapshot(this.SNAPSHOT_NAME));
  }
}
