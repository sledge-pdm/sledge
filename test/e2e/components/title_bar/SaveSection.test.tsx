import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SaveSection from '~/components/global/title_bar/SaveSection';
import { setIOStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { eventBus } from '~/utils/EventBus';

const mocks = vi.hoisted(() => ({
  saveProject: vi.fn(async () => true),
}));

vi.mock('~/features/io/project/save', () => ({
  saveProject: mocks.saveProject,
}));

/** let solid flush the render effects the emit above scheduled. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('SaveSection (e2e)', () => {
  let dispose: (() => void) | undefined;
  let root: HTMLDivElement;
  const button = () => document.querySelector('button') as HTMLButtonElement;
  /** the section's own paragraphs: the ago text is the only one, whether a save is running or not. */
  const texts = () => Array.from(root.firstElementChild!.querySelectorAll(':scope > p')).map((p) => p.textContent);

  beforeEach(() => {
    mocks.saveProject.mockClear();

    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { name: 'demo.sledge', path: 'C:/work' });
    setProjectStore('project', 'lastSavedAt', new Date(Date.now() - 3 * 60 * 60 * 1000));

    root = document.createElement('div');
    document.body.appendChild(root);
    dispose = render(() => SaveSection({}), root);
  });

  afterEach(() => {
    dispose?.();
    document.body.innerHTML = '';
  });

  it('follows a save it did not start', async () => {
    expect(button().textContent).toBe('save');
    expect(button().disabled).toBe(false);

    // what a Ctrl+S save looks like from here: this button was never clicked, only the stream moved
    eventBus.emit('project:saveProgress', { phase: 'layers', done: 1, total: 4 });
    await settled();
    expect(button().textContent).toBe('saving...');
    expect(button().disabled).toBe(true);
    // what the save is doing belongs to the bottom bar; this section only keeps the last save's age
    expect(texts()).toEqual(['3 hours ago']);
  });

  it('returns to idle once the write finishes', async () => {
    eventBus.emit('project:saveProgress', { phase: 'layers', done: 0, total: 2 });
    eventBus.emit('project:saveProgress', { phase: 'write', done: 1, total: 1 });
    await settled();

    expect(button().textContent).toBe('save');
    expect(button().disabled).toBe(false);
  });

  it('returns to idle when a save fails or is cancelled', async () => {
    eventBus.emit('project:saveProgress', { phase: 'history', done: 1, total: 3 });
    eventBus.emit('project:saveCancelled', {});
    await settled();
    expect(button().disabled).toBe(false);

    eventBus.emit('project:saveProgress', { phase: 'history', done: 1, total: 3 });
    eventBus.emit('project:saveFailed', { error: new Error('nope') });
    await settled();
    expect(button().disabled).toBe(false);
  });

  it('cannot start a second save while one is running', async () => {
    button().click();
    await settled();
    expect(mocks.saveProject).toHaveBeenCalledTimes(1);

    eventBus.emit('project:saveProgress', { phase: 'layers', done: 0, total: 2 });
    await settled();
    button().click();
    await settled();

    expect(mocks.saveProject).toHaveBeenCalledTimes(1);
  });
});
