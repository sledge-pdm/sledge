import { showContextMenu as showContextMenuFromUi } from '@sledge-pdm/ui';
import { closeContextMenu, setOpenContextMenu } from './store';

type ShowArgs = Parameters<typeof showContextMenuFromUi>;

/**
 * @description show a context menu and remember it.
 *
 *   the ui builder mounts its menu on `document.body`, which is outside the editor pane a modal covers - so
 *   a menu left standing when an exclusive operation starts stays clickable where the modal does not reach.
 *   every call goes through here so that `closeContextMenu` has something to close; importing the builder
 *   from `@sledge-pdm/ui` directly leaves the menu behind.
 *
 *   `closeContextMenu` is not re-exported from here on purpose: it lives in `./store`, which pulls in no ui
 *   components, and that is what callers wanting only to close one should import.
 */
export function showContextMenu(options: ShowArgs[0], position: ShowArgs[1], opts?: ShowArgs[2]): ReturnType<typeof showContextMenuFromUi> {
  // only one menu is ever open, so whatever is still up belongs to a gesture this one replaces.
  closeContextMenu();

  const handle = showContextMenuFromUi(options, position, {
    ...opts,
    onClose: () => {
      setOpenContextMenu(undefined);
      opts?.onClose?.();
    },
  });
  setOpenContextMenu(handle);
  return handle;
}
