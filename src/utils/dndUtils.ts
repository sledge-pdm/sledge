import { color } from '@sledge/theme';

type GetItemId = (el: HTMLElement) => string | undefined;

export const getDropCandidates = (containerEl: HTMLElement, selector: string, sourceId: string, getItemId: GetItemId) => {
  return Array.from(containerEl.querySelectorAll<HTMLElement>(selector)).filter((el) => {
    const id = getItemId(el);
    return id && id !== sourceId;
  });
};

export const getDropIndex = (candidates: HTMLElement[], clientY: number) => {
  let index = candidates.length;
  for (let i = 0; i < candidates.length; i++) {
    const rect = candidates[i].getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    if (clientY < mid) {
      index = i;
      break;
    }
  }
  return index;
};

export const ensureDropLine = (containerEl: HTMLElement, existing?: HTMLDivElement | null) => {
  if (existing && existing.parentElement === containerEl) return existing;
  const line = document.createElement('div');
  line.style.position = 'absolute';
  line.style.left = '0';
  line.style.height = '2px';
  line.style.background = color.accent;
  line.style.opacity = '0.5';
  line.style.borderRadius = '2px';
  line.style.pointerEvents = 'none';
  line.style.width = '100%';
  line.style.display = 'none';
  containerEl.appendChild(line);
  return line;
};

export const updateDropLine = (lineEl: HTMLDivElement, containerEl: HTMLElement, candidates: HTMLElement[], toIndex: number, yOffset: number = 0) => {
  const containerRect = containerEl.getBoundingClientRect();
  let y = containerRect.top;
  if (toIndex <= 0) {
    y = candidates[0]?.getBoundingClientRect().top ?? containerRect.top;
  } else if (toIndex >= candidates.length) {
    y = candidates[candidates.length - 1]?.getBoundingClientRect().bottom ?? containerRect.bottom;
  } else {
    y = candidates[toIndex - 1].getBoundingClientRect().bottom;
  }

  lineEl.style.top = `${y - containerRect.top - 2 + yOffset}px`;
  lineEl.style.display = 'block';
};

export const hideDropLine = (lineEl?: HTMLDivElement | null) => {
  if (lineEl) lineEl.style.display = 'none';
};

let cursorStyleEl: HTMLStyleElement | null = null;
const ensureCursorStyle = () => {
  if (cursorStyleEl) return;
  cursorStyleEl = document.createElement('style');
  cursorStyleEl.id = 'sledge-dnd-cursor-style';
  cursorStyleEl.textContent = `.sledge-dnd-grabbing, .sledge-dnd-grabbing * { cursor: grabbing !important; }`;
  document.head.appendChild(cursorStyleEl);
};

export const setDraggingCursor = (active: boolean) => {
  if (active) {
    ensureCursorStyle();
    document.body.classList.add('sledge-dnd-grabbing');
    (document.body as any).style.userSelect = 'none';
    (document.body as any).style.cursor = 'grabbing';
  } else {
    document.body.classList.remove('sledge-dnd-grabbing');
    (document.body as any).style.userSelect = '';
    (document.body as any).style.cursor = '';
  }
};
