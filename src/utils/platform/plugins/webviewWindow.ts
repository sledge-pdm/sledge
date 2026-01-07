export interface WebviewWindow {
  label: string;
  close(): Promise<void>;
  destroy(): Promise<void>;
}

export interface WebviewWindowPlatform {
  getAllWebviewWindows(): Promise<WebviewWindow[]>;
}
