import type { UnlistenFn } from './event';

export type WindowOptions = Record<string, unknown>;

export type CloseRequestedEvent = {
  preventDefault(): void;
};

export type ScaleChangedEvent = {
  payload: {
    scaleFactor: number;
    size?: unknown;
  };
};

export type FocusChangedEvent = {
  payload: boolean;
};

export interface AppWindow {
  label: string;
  scaleFactor(): Promise<number>;
  isMaximized(): Promise<boolean>;
  isDecorated(): Promise<boolean>;
  isMaximizable(): Promise<boolean>;
  isMinimizable(): Promise<boolean>;
  isClosable(): Promise<boolean>;
  title(): Promise<string>;
  setTitle(title: string): Promise<void>;
  show(): Promise<void>;
  close(): Promise<void>;
  destroy(): Promise<void>;
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  onResized(handler: (event: unknown) => void): Promise<UnlistenFn>;
  onScaleChanged(handler: (event: ScaleChangedEvent) => void): Promise<UnlistenFn>;
  onCloseRequested(handler: (event: CloseRequestedEvent) => void): Promise<UnlistenFn>;
  onFocusChanged(handler: (event: FocusChangedEvent) => void): Promise<UnlistenFn>;
}

export interface WindowPlatform {
  getCurrentWindow(): AppWindow;
}
