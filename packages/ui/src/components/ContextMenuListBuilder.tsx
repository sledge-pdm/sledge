import { render } from 'solid-js/web';
import ContextMenuList from './ContextMenuList';
import type { MenuListOption } from './MenuList';

export type ContextMenuCoords = { x: number; y: number };
export type PositionLike = ContextMenuCoords | MouseEvent | PointerEvent | { clientX: number; clientY: number };

function toCoords(pos: PositionLike): ContextMenuCoords {
  if (typeof (pos as MouseEvent).clientX === 'number' && typeof (pos as MouseEvent).clientY === 'number') {
    const p = pos as { clientX: number; clientY: number };
    return { x: p.clientX, y: p.clientY };
  }
  const c = pos as ContextMenuCoords;
  return { x: c.x, y: c.y };
}

export interface ShowMenuOptions {
  closeByOutsideClick?: boolean;
  onClose?: () => void;
}

export interface ContextMenuController {
  close: () => void;
}

export function showContextMenu(
  title: string | undefined,
  options: MenuListOption[],
  position: PositionLike,
  opts?: ShowMenuOptions
): ContextMenuController {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.inset = '0 0 0 0';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  const pos = toCoords(position);
  const closeByOutsideClick = opts?.closeByOutsideClick ?? true;

  let disposed = false;
  const dispose = render(
    () => (
      <ContextMenuList
        title={title}
        options={options}
        open={true}
        position={pos}
        closeByOutsideClick={closeByOutsideClick}
        onClose={() => {
          if (disposed) return;
          disposed = true;
          dispose();
          host.remove();
          opts?.onClose?.();
        }}
      />
    ),
    host
  );

  return {
    close: () => {
      if (disposed) return;
      disposed = true;
      dispose();
      host.remove();
      opts?.onClose?.();
    },
  };
}
