import { color } from '@sledge/theme';
import { SectionSide } from '~/config/SectionTabConfig';

type Id = string;

interface UseSideControlReorderOptions {
  getItemsBySide: (side: SectionSide) => Id[];
  longPressMs?: number; // default 350ms
  onDrop: (params: { id: Id; fromSide: SectionSide; toSide: SectionSide; fromIndex: number; toIndex: number }) => void;
}

export interface SideControlReorderApi {
  registerContainer: (side: SectionSide, el: HTMLElement | null) => void;
  registerItem: (side: SectionSide, el: HTMLElement | null, id: Id) => void;
  onPointerDown: (e: PointerEvent, side: SectionSide, id: Id) => void;
  shouldSuppressClick: () => boolean;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Copy bitmap contents from canvases in srcRoot to canvases in dstRoot without encoding.
function copyCanvases(srcRoot: HTMLElement, dstRoot: HTMLElement) {
  const src = Array.from(srcRoot.querySelectorAll('canvas')) as HTMLCanvasElement[];
  const dst = Array.from(dstRoot.querySelectorAll('canvas')) as HTMLCanvasElement[];
  const n = Math.min(src.length, dst.length);
  for (let i = 0; i < n; i++) {
    const s = src[i];
    const d = dst[i];
    const w = s.width | 0;
    const h = s.height | 0;
    if (!w || !h) continue;
    try {
      if (d.width !== w) d.width = w;
      if (d.height !== h) d.height = h;
      const ctx = d.getContext('2d');
      if (ctx) ctx.drawImage(s, 0, 0, w, h);
    } catch (_e) {
      // ignore draw failures (e.g., security restrictions)
    }
  }
}

export function createSideControlReorder(options: UseSideControlReorderOptions): SideControlReorderApi {
  const LONG_PRESS_MS = options.longPressMs ?? 350;
  const MOVE_CANCEL_PX = 8;

  let pointerId: number | null = null;
  let pressTimer: number | null = null;
  let startX = 0;
  let startY = 0;
  let lastClientX = 0;
  let lastClientY = 0;
  let dragging = false;
  let sourceId: Id | null = null;
  let sourceSide: SectionSide | null = null;
  let sourceEl: HTMLElement | null = null;
  let sourceRect: DOMRect | null = null;
  let offsetX = 0;
  let offsetY = 0;
  let ghostEl: HTMLDivElement | null = null;
  const dropLineEls: Partial<Record<SectionSide, HTMLDivElement>> = {};
  let cursorStyleEl: HTMLStyleElement | null = null;
  let currentPointerSide: SectionSide | null = null;
  let justDropped = false;

  const itemMap = new Map<Id, { el: HTMLElement; side: SectionSide }>();
  const containerMap = new Map<SectionSide, HTMLElement>();

  const clearTimer = () => {
    if (pressTimer !== null) {
      window.clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const removeDropLines = () => {
    (Object.keys(dropLineEls) as SectionSide[]).forEach((side) => {
      const el = dropLineEls[side];
      if (el && el.parentElement) el.parentElement.removeChild(el);
      delete dropLineEls[side];
    });
  };

  const cleanupDrag = () => {
    clearTimer();
    if (ghostEl && ghostEl.parentElement) ghostEl.parentElement.removeChild(ghostEl);
    ghostEl = null;
    removeDropLines();
    if (sourceEl) {
      sourceEl.style.opacity = '';
      sourceEl.style.backgroundColor = '';
      sourceEl.style.pointerEvents = '';
      sourceEl = null;
    }
    (document.body as any).style.userSelect = '';
    (document.body as any).style.cursor = '';
    containerMap.forEach((container) => container.classList.remove('sledge-dnd-grabbing'));
    if (cursorStyleEl && cursorStyleEl.parentElement) cursorStyleEl.parentElement.removeChild(cursorStyleEl);
    cursorStyleEl = null;
    pointerId = null;
    dragging = false;
    sourceId = null;
    sourceSide = null;
    sourceRect = null;
    offsetX = offsetY = 0;
    currentPointerSide = null;

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerCancel);
  };

  const ensureDropLine = (side: SectionSide, index: number) => {
    const container = containerMap.get(side);
    if (!container) return null;
    if (!dropLineEls[side]) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.left = '0';
      line.style.height = '2px';
      line.style.background = color.accent;
      line.style.opacity = '0.5';
      line.style.borderRadius = '2px';
      line.style.pointerEvents = 'none';
      const cs = window.getComputedStyle(container);
      if (cs.position === 'static') container.style.position = 'relative';
      container.appendChild(line);
      dropLineEls[side] = line;
    }
    const line = dropLineEls[side]!;
    if (index !== 0) {
      line.style.marginTop = '3px';
    } else {
      line.style.marginTop = '-1px';
    }
    return line;
  };

  const startDrag = (e: PointerEvent) => {
    if (!sourceId || !sourceSide) return;
    const item = itemMap.get(sourceId);
    if (!item) return;
    sourceEl = item.el;
    sourceRect = item.el.getBoundingClientRect();
    offsetX = e.clientX - sourceRect.left;
    offsetY = e.clientY - sourceRect.top;

    ghostEl = document.createElement('div');
    ghostEl.className = 'sledge-dnd-ghost';
    ghostEl.style.position = 'fixed';
    ghostEl.style.left = `${e.clientX - offsetX}px`;
    ghostEl.style.top = `${e.clientY - offsetY}px`;
    ghostEl.style.width = `${sourceRect.width}px`;
    ghostEl.style.height = `${sourceRect.height}px`;
    ghostEl.style.opacity = '0.6';
    ghostEl.style.pointerEvents = 'none';
    ghostEl.style.zIndex = '9999';
    ghostEl.style.boxSizing = 'border-box';
    ghostEl.style.transform = 'translateZ(0)';
    ghostEl.style.background = window.getComputedStyle(item.el).backgroundColor || 'transparent';
    ghostEl.style.cursor = 'grabbing';
    const clone = item.el.cloneNode(true) as HTMLElement;
    clone.style.pointerEvents = 'none';
    clone.style.margin = '0';
    clone.style.width = '100%';
    clone.style.height = '100%';
    ghostEl.appendChild(clone);
    document.body.appendChild(ghostEl);

    copyCanvases(item.el, clone);

    item.el.style.opacity = '0.5';
    item.el.style.backgroundColor = color.surface;
    item.el.style.pointerEvents = 'none';
    (document.body as any).style.userSelect = 'none';
    (document.body as any).style.cursor = 'grabbing';
    if (!cursorStyleEl) {
      cursorStyleEl = document.createElement('style');
      cursorStyleEl.id = 'sledge-dnd-cursor-style';
      cursorStyleEl.textContent = `.sledge-dnd-grabbing, .sledge-dnd-grabbing * { cursor: grabbing !important; }`;
      document.head.appendChild(cursorStyleEl);
    }
    containerMap.forEach((container) => container.classList.add('sledge-dnd-grabbing'));
    dragging = true;

    updateDropTarget(e.clientX, e.clientY);
  };

  const detectSideFromPoint = (clientX: number, clientY: number): SectionSide | null => {
    for (const [side, container] of containerMap.entries()) {
      const rect = container.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return side;
      }
    }
    return null;
  };

  const findInsertIndex = (side: SectionSide, clientY: number) => {
    const items = options.getItemsBySide(side);
    const entries: { id: Id; el: HTMLElement; rect: DOMRect }[] = [];
    items.forEach((id) => {
      const item = itemMap.get(id);
      if (!item || item.side !== side) return;
      entries.push({ id, el: item.el, rect: item.el.getBoundingClientRect() });
    });

    let index = entries.length;
    for (let i = 0; i < entries.length; i++) {
      const { rect, id } = entries[i];
      if (id === sourceId) continue;
      const mid = rect.top + rect.height / 2;
      if (clientY < mid) {
        index = i;
        break;
      }
    }

    return clamp(index, 0, entries.length);
  };

  const updateDropTarget = (clientX: number, clientY: number) => {
    const targetSide = detectSideFromPoint(clientX, clientY);
    currentPointerSide = targetSide;

    (Object.keys(dropLineEls) as SectionSide[]).forEach((side) => {
      if (dropLineEls[side]) dropLineEls[side]!.style.display = 'none';
    });

    if (!dragging || !targetSide) return;

    const items = options.getItemsBySide(targetSide);
    if (!items.length) return;
    const ids = items;
    const idx = findInsertIndex(targetSide, clientY);
    const line = ensureDropLine(targetSide, idx);
    if (!line) return;

    const fromIndex = sourceId && sourceSide === targetSide ? ids.indexOf(sourceId) : -1;
    if (fromIndex < 0) {
      line.style.display = 'block';
    } else {
      const adjusted = idx > fromIndex ? idx - 1 : idx;
      line.style.display = adjusted === fromIndex ? 'none' : 'block';
    }

    const container = containerMap.get(targetSide);
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    let y = containerRect.top;
    if (idx === 0) {
      y = containerRect.top;
    } else if (idx >= ids.length) {
      const lastItem = itemMap.get(ids[ids.length - 1]);
      if (lastItem) {
        const r = lastItem.el.getBoundingClientRect();
        y = r.bottom;
      } else {
        y = containerRect.bottom;
      }
    } else {
      const prevItem = itemMap.get(ids[idx - 1]);
      if (prevItem) {
        const r = prevItem.el.getBoundingClientRect();
        y = r.bottom;
      }
    }

    line.style.top = `${y - containerRect.top - 2}px`;
    line.style.width = '100%';
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    if (!dragging) {
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
        clearTimer();
      }
      return;
    }
    if (ghostEl) {
      ghostEl.style.top = `${e.clientY - offsetY}px`;
      ghostEl.style.left = `${e.clientX - offsetX}px`;
    }
    updateDropTarget(e.clientX, e.clientY);
  };

  const finishDrop = () => {
    if (!sourceId || !sourceSide) return;
    const targetSide = currentPointerSide;
    if (!targetSide) return;
    const targetItems = options.getItemsBySide(targetSide);
    const sourceItems = options.getItemsBySide(sourceSide);
    const fromIndex = sourceItems.indexOf(sourceId);
    if (fromIndex === -1) return;
    const toIndex = findInsertIndex(targetSide, lastClientY);
    options.onDrop({
      id: sourceId,
      fromSide: sourceSide,
      toSide: targetSide,
      fromIndex,
      toIndex,
    });
    justDropped = true;
    setTimeout(() => {
      justDropped = false;
    }, 50);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (pointerId !== null && e.pointerId !== pointerId) {
      return;
    }
    if (dragging) {
      e.preventDefault();
      finishDrop();
    }
    cleanupDrag();
  };

  const handlePointerCancel = (_e: PointerEvent) => {
    cleanupDrag();
  };

  const onPointerDown = (e: PointerEvent, side: SectionSide, id: Id) => {
    if (e.button !== 0) return;
    sourceId = id;
    sourceSide = side;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    clearTimer();
    pressTimer = window.setTimeout(() => startDrag(e), LONG_PRESS_MS) as unknown as number;

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
  };

  const registerContainer = (side: SectionSide, el: HTMLElement | null) => {
    if (!el) {
      containerMap.delete(side);
      return;
    }
    containerMap.set(side, el);
  };

  const registerItem = (side: SectionSide, el: HTMLElement | null, id: Id) => {
    if (!el) {
      itemMap.delete(id);
      return;
    }
    itemMap.set(id, { el, side });
  };

  return {
    registerContainer,
    registerItem,
    onPointerDown,
    shouldSuppressClick: () => dragging || justDropped,
  };
}

const singleton = createSideControlReorder;
export const sideControlReorder = (() => {
  let instance: SideControlReorderApi | null = null;
  return (options: UseSideControlReorderOptions) => {
    if (!instance) instance = singleton(options);
    return instance;
  };
})();

export default sideControlReorder;
