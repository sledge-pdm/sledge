import { color } from '@sledge/theme';

type ContainerId = string;
type ItemId = string;

export interface ReorderOptions<C = ContainerId, I = ItemId> {
  getItems: (container: C) => I[];
  longPressMs?: number;
  onDrop: (params: { id: I; fromContainer: C; toContainer: C; fromIndex: number; toIndex: number }) => void;
}

export interface ReorderApi<C = ContainerId, I = ItemId> {
  registerContainer: (container: C, el: HTMLElement | null) => void;
  registerItem: (container: C, el: HTMLElement | null, id: I) => void;
  onPointerDown: (e: PointerEvent, container: C, id: I) => void;
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

// A shared reorder controller for vertical lists (single or multi container).
export function createReorder<C = ContainerId, I = ItemId>(options: ReorderOptions<C, I>): ReorderApi<C, I> {
  const LONG_PRESS_MS = options.longPressMs ?? 350;
  const MOVE_CANCEL_PX = 10; // a bit larger to be pen-friendly

  const itemMap = new Map<I, { el: HTMLElement; container: C }>();
  const containerMap = new Map<C, HTMLElement>();
  const dropLineMap = new Map<C, HTMLDivElement>();

  let pointerId: number | null = null;
  let pressClearTimeout: NodeJS.Timeout | null = null;
  let startX = 0;
  let startY = 0;
  let lastClientX = 0;
  let lastClientY = 0;
  let dragging = false;
  let sourceId: I | null = null;
  let sourceContainer: C | null = null;
  let sourceEl: HTMLElement | null = null;
  let sourceRect: DOMRect | null = null;
  let offsetX = 0;
  let offsetY = 0;
  let ghostEl: HTMLDivElement | null = null;
  let cursorStyleEl: HTMLStyleElement | null = null;
  let currentTargetContainer: C | null = null;
  let lastKnownContainer: C | null = null;
  let justDropped = false;
  let capturedEl: HTMLElement | null = null;

  const clearPressTimer = () => {
    if (pressClearTimeout) {
      clearTimeout(pressClearTimeout);
      pressClearTimeout = null;
    }
  };

  const removeDropLines = () => {
    dropLineMap.forEach((line) => {
      if (line.parentElement) line.parentElement.removeChild(line);
    });
    dropLineMap.clear();
  };

  const cleanupDrag = () => {
    clearPressTimer();
    if (ghostEl && ghostEl.parentElement) ghostEl.parentElement.removeChild(ghostEl);
    ghostEl = null;
    removeDropLines();
    if (sourceEl) {
      sourceEl.style.opacity = '';
      sourceEl.style.backgroundColor = '';
      sourceEl.style.pointerEvents = '';
      sourceEl = null;
    }
    if (sourceContainer) {
      const containerEl = containerMap.get(sourceContainer);
      if (containerEl) containerEl.style.touchAction = '';
    }
    (document.body as any).style.userSelect = '';
    (document.body as any).style.cursor = '';
    containerMap.forEach((container) => container.classList.remove('sledge-dnd-grabbing'));
    if (cursorStyleEl && cursorStyleEl.parentElement) cursorStyleEl.parentElement.removeChild(cursorStyleEl);
    cursorStyleEl = null;
    if (capturedEl && pointerId !== null && capturedEl.releasePointerCapture) {
      capturedEl.releasePointerCapture(pointerId);
    }
    capturedEl = null;
    pointerId = null;
    dragging = false;
    sourceId = null;
    sourceContainer = null;
    sourceRect = null;
    offsetX = offsetY = 0;
    currentTargetContainer = null;
    lastKnownContainer = null;

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerCancel);
  };

  const ensureDropLine = (container: C, index: number) => {
    const el = containerMap.get(container);
    if (!el) return null;
    if (!dropLineMap.has(container)) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.left = '0';
      line.style.height = '2px';
      line.style.background = color.accent;
      line.style.opacity = '0.5';
      line.style.borderRadius = '2px';
      line.style.pointerEvents = 'none';
      const cs = window.getComputedStyle(el);
      if (cs.position === 'static') el.style.position = 'relative';
      el.appendChild(line);
      dropLineMap.set(container, line);
    }
    const line = dropLineMap.get(container)!;
    line.style.marginTop = index === 0 ? '-1px' : '3px';
    return line;
  };

  const detectContainerFromPoint = (clientX: number, clientY: number): C | null => {
    for (const [container, el] of containerMap.entries()) {
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        return container;
      }
    }
    return null;
  };

  const findInsertIndex = (container: C, clientY: number) => {
    const items = options.getItems(container);
    const entries: { id: I; el: HTMLElement; rect: DOMRect }[] = [];
    items.forEach((id) => {
      const entry = itemMap.get(id);
      if (!entry || entry.container !== container) return;
      entries.push({ id, el: entry.el, rect: entry.el.getBoundingClientRect() });
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
    const detected = detectContainerFromPoint(clientX, clientY);
    if (detected) {
      currentTargetContainer = detected;
      lastKnownContainer = detected;
    }
    const targetContainer = currentTargetContainer ?? lastKnownContainer;

    dropLineMap.forEach((line) => (line.style.display = 'none'));

    if (!dragging || !targetContainer) return;

    const items = options.getItems(targetContainer);
    if (!items.length) return;
    const idx = findInsertIndex(targetContainer, clientY);
    const line = ensureDropLine(targetContainer, idx);
    if (!line) return;

    const fromIndex = sourceId && sourceContainer === targetContainer ? items.indexOf(sourceId) : -1;
    if (fromIndex < 0) {
      line.style.display = 'block';
    } else {
      const adjusted = idx > fromIndex ? idx - 1 : idx;
      line.style.display = adjusted === fromIndex ? 'none' : 'block';
    }

    const containerEl = containerMap.get(targetContainer);
    if (!containerEl) return;
    const containerRect = containerEl.getBoundingClientRect();

    let y = containerRect.top;
    if (idx === 0) {
      y = containerRect.top;
    } else if (idx >= items.length) {
      const lastItem = itemMap.get(items[items.length - 1]);
      if (lastItem) {
        const r = lastItem.el.getBoundingClientRect();
        y = r.bottom;
      } else {
        y = containerRect.bottom;
      }
    } else {
      const prevItem = itemMap.get(items[idx - 1]);
      if (prevItem) {
        const r = prevItem.el.getBoundingClientRect();
        y = r.bottom;
      }
    }

    line.style.top = `${y - containerRect.top - 2}px`;
    line.style.width = '100%';
  };

  const startDrag = (e: PointerEvent) => {
    if (!sourceId || !sourceContainer) return;
    const entry = itemMap.get(sourceId);
    if (!entry) return;

    sourceEl = entry.el;
    sourceRect = entry.el.getBoundingClientRect();
    offsetX = e.clientX - sourceRect.left;
    offsetY = e.clientY - sourceRect.top;
    currentTargetContainer = sourceContainer;
    lastKnownContainer = sourceContainer;

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
    ghostEl.style.background = window.getComputedStyle(entry.el).backgroundColor || 'transparent';
    ghostEl.style.cursor = 'grabbing';
    const clone = entry.el.cloneNode(true) as HTMLElement;
    clone.style.pointerEvents = 'none';
    clone.style.margin = '0';
    clone.style.width = '100%';
    clone.style.height = '100%';
    ghostEl.appendChild(clone);
    document.body.appendChild(ghostEl);

    copyCanvases(entry.el, clone);

    entry.el.style.opacity = '0.5';
    entry.el.style.backgroundColor = color.surface;
    entry.el.style.pointerEvents = 'none';
    (document.body as any).style.userSelect = 'none';
    (document.body as any).style.cursor = 'grabbing';

    const containerEl = containerMap.get(sourceContainer);
    if (containerEl) {
      containerEl.style.touchAction = 'none';
      if (!cursorStyleEl) {
        cursorStyleEl = document.createElement('style');
        cursorStyleEl.id = 'sledge-dnd-cursor-style';
        cursorStyleEl.textContent = `.sledge-dnd-grabbing, .sledge-dnd-grabbing * { cursor: grabbing !important; }`;
        document.head.appendChild(cursorStyleEl);
      }
      containerEl.classList.add('sledge-dnd-grabbing');
    }
    containerMap.forEach((container) => container.classList.add('sledge-dnd-grabbing'));
    dragging = true;

    updateDropTarget(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    if (!dragging) {
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      const cancelThreshold = e.pointerType === 'pen' ? MOVE_CANCEL_PX + 4 : MOVE_CANCEL_PX;
      if (dx > cancelThreshold || dy > cancelThreshold) {
        clearPressTimer();
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
    if (!sourceId || !sourceContainer) return;
    const targetContainer = currentTargetContainer ?? lastKnownContainer;
    if (!targetContainer) return;
    const targetItems = options.getItems(targetContainer);
    const sourceItems = options.getItems(sourceContainer);
    const fromIndex = sourceItems.indexOf(sourceId);
    if (fromIndex === -1) return;
    const toIndex = clamp(findInsertIndex(targetContainer, lastClientY), 0, targetItems.length);
    options.onDrop({
      id: sourceId,
      fromContainer: sourceContainer,
      toContainer: targetContainer,
      fromIndex,
      toIndex,
    });
    justDropped = true;
    setTimeout(() => {
      justDropped = false;
    }, 80);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    if (dragging) {
      e.preventDefault();
      finishDrop();
    }
    cleanupDrag();
  };

  const handlePointerCancel = (_e: PointerEvent) => {
    cleanupDrag();
  };

  const onPointerDown = (e: PointerEvent, container: C, id: I) => {
    if (e.button !== 0) return;
    e.preventDefault();
    sourceId = id;
    sourceContainer = container;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    clearPressTimer();
    pressClearTimeout = setTimeout(() => startDrag(e), LONG_PRESS_MS);

    const target = e.currentTarget as HTMLElement | null;
    if (target && target.setPointerCapture) {
      target.setPointerCapture(e.pointerId);
      capturedEl = target;

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerCancel);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
  };

  const registerContainer = (container: C, el: HTMLElement | null) => {
    if (!el) {
      containerMap.delete(container);
      return;
    }
    containerMap.set(container, el);
  };

  const registerItem = (container: C, el: HTMLElement | null, id: I) => {
    if (!el) {
      itemMap.delete(id);
      return;
    }
    itemMap.set(id, { el, container });
  };

  return {
    registerContainer,
    registerItem,
    onPointerDown,
    shouldSuppressClick: () => dragging || justDropped,
  };
}

const singleton = createReorder;
export const useReorder = (() => {
  let instance: ReorderApi<any, any> | null = null;
  return <C = ContainerId, I = ItemId>(options: ReorderOptions<C, I>) => {
    if (!instance) instance = singleton(options as ReorderOptions<any, any>);
    return instance as ReorderApi<C, I>;
  };
})();

export default useReorder;
