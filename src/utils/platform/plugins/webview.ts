export type WebviewOptions = Record<string, unknown>;

export interface Webview {
  label: string;
  setZoom(zoom: number): Promise<void>;
  clearAllBrowsingData(): Promise<void>;
}

export interface WebviewPlatform {
  getCurrentWebview(): Webview;
}
