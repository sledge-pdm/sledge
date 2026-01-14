export interface AppPlatform {
  getTauriVersion(): Promise<string>;
  getVersion(): Promise<string>;
}
