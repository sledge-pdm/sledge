export interface ProcessPlatform {
  exit(code?: number): Promise<void>;
  relaunch(): Promise<void>;
}
