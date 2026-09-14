/**
 * @description what a shown menu gives back, narrowed to the one thing anything here needs of it.
 *   spelled out rather than taken from `@sledge-pdm/ui`, so that closing a menu costs nothing more than
 *   this file - see the note on `closeContextMenu`.
 */
export interface OpenContextMenu {
  close: () => void;
}

/** @description the menu currently on screen, so something other than the user can take it down. */
let current: OpenContextMenu | undefined;

/** @description called by `showContextMenu` once a menu is up. nothing else should be setting this. */
export function setOpenContextMenu(menu: OpenContextMenu | undefined): void {
  current = menu;
}

/**
 * @description take down the menu that is up, if there is one.
 *
 *   kept apart from `showContextMenu` because this is what an exclusive operation calls: importing that
 *   would pull `@sledge-pdm/ui` - and the components it mounts on `window` - into every module that only
 *   wants a menu gone.
 *
 *   `close` is the same path the builder runs when the user clicks outside or presses Escape: it disposes
 *   the rendered tree, which removes the portal contents and the document listeners with it.
 */
export function closeContextMenu(): void {
  // `close` calls back into the `onClose` that `showContextMenu` wrapped, which is what clears `current`.
  current?.close();
  current = undefined;
}
