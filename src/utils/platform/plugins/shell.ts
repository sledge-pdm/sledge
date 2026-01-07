export interface ShellPlatform {
  open(target: string): Promise<void>;
}
