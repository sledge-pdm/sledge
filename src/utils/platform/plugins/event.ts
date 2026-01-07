export type UnlistenFn = () => void;

export declare enum TauriEvent {
  WINDOW_RESIZED = 'tauri://resize',
  WINDOW_MOVED = 'tauri://move',
  WINDOW_CLOSE_REQUESTED = 'tauri://close-requested',
  WINDOW_DESTROYED = 'tauri://destroyed',
  WINDOW_FOCUS = 'tauri://focus',
  WINDOW_BLUR = 'tauri://blur',
  WINDOW_SCALE_FACTOR_CHANGED = 'tauri://scale-change',
  WINDOW_THEME_CHANGED = 'tauri://theme-changed',
  WINDOW_CREATED = 'tauri://window-created',
  WEBVIEW_CREATED = 'tauri://webview-created',
  DRAG_ENTER = 'tauri://drag-enter',
  DRAG_OVER = 'tauri://drag-over',
  DRAG_DROP = 'tauri://drag-drop',
  DRAG_LEAVE = 'tauri://drag-leave',
}
export type EventName = `${TauriEvent}` | (string & Record<never, never>);

export interface Event<T> {
  /** Event name */
  event: EventName;
  /** Event identifier used to unlisten */
  id: number;
  /** Event payload */
  payload: T;
}
export type EventCallback<T> = (event: Event<T>) => void;

export interface EventPlatform {
  listen(event: string, handler: EventCallback<unknown>): Promise<UnlistenFn>;
}
