export interface OpenerPlatform {
  revealItemInDir(path: string): Promise<void>;
}
