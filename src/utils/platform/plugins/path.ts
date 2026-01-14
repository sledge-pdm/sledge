export interface PathPlatform {
  BaseDirectory?: Record<string, unknown>;
  homeDir(): Promise<string>;
  pictureDir(): Promise<string>;
  appConfigDir(): Promise<string>;
  appDataDir(): Promise<string>;
}
