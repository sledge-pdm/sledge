export interface CorePlatform {
  invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T>;
  transformCallback<T = unknown>(callback?: ((response: T) => void) | undefined, once?: boolean | undefined): number;
  convertFileSrc(path: string): string;
  isTauri(): boolean;
}
