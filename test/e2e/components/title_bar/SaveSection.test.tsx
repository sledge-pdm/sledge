import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SaveSection from '~/components/global/title_bar/SaveSection';
import { runExclusive } from '~/features/busy';
import { setIOStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';

const mocks = vi.hoisted(() => ({
  saveProject: vi.fn(async () => true),
}));

vi.mock('~/features/io/project/ProjectSave', () => ({
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

  /** @description hold the window for the length of `body`, the way a real operation does. */
  const whileRunning = (operation: Parameters<typeof runExclusive>[0], body: () => Promise<void>) =>
    runExclusive(operation, async () => {
      await settled();
      await body();
    });

  it('follows a save it did not start', async () => {
    expect(button().textContent).toBe('save');
    expect(button().disabled).toBe(false);

    // what a Ctrl+S save looks like from here: this button was never clicked, the window was just taken
    await whileRunning('save', async () => {
      expect(button().textContent).toBe('saving...');
      expect(button().disabled).toBe(true);
      // what the save is doing belongs to the bottom bar; this section only keeps the last save's age
      expect(texts()).toEqual(['3 hours ago']);
    });
  });

  it('returns to idle once the operation releases the window', async () => {
    await whileRunning('save', async () => {
      expect(button().disabled).toBe(true);
    });
    await settled();

    expect(button().textContent).toBe('save');
    expect(button().disabled).toBe(false);
  });

  it('returns to idle when a save fails', async () => {
    await expect(
      runExclusive('save', async () => {
        await settled();
        expect(button().disabled).toBe(true);
        throw new Error('nope');
      })
    ).rejects.toThrow('nope');
    await settled();

    expect(button().disabled).toBe(false);
  });

  it('is out of use while an operation that is not a save is running', async () => {
    await whileRunning('imageImport', async () => {
      // there is no saving over an import, but this button must not claim to be the thing running either
      expect(button().disabled).toBe(true);
      expect(button().textContent).toBe('save');
    });
  });

  it('cannot start a second save while one is running', async () => {
    button().click();
    await settled();
    expect(mocks.saveProject).toHaveBeenCalledTimes(1);

    await whileRunning('save', async () => {
      button().click();
      await settled();
    });

    expect(mocks.saveProject).toHaveBeenCalledTimes(1);
  });
});
