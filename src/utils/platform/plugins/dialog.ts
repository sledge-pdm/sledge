export interface DialogPlatform {
  confirm(message: string, options?: Record<string, unknown>): Promise<boolean>;
  message(message: string, options?: Record<string, unknown>): Promise<unknown>;
  open(options?: Record<string, unknown>): Promise<string | string[] | null>;
  save(options?: Record<string, unknown>): Promise<string | null>;
}
