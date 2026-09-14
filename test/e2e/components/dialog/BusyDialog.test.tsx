import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import BusyDialog from '~/components/global/dialog/busy/BusyDialog';
import { runExclusive, setBusyProgress } from '~/features/busy';

/** let solid flush the render effects a store write scheduled. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * the busy dialog is modal over the editor pane it sits in, and nothing else. what is outside that pane -
 * the title bar - stays live on purpose and disables itself.
 */
describe('BusyDialog (e2e)', () => {
  let dispose: (() => void) | undefined;
  let root: HTMLDivElement;
  /** stands in for the title bar: outside the pane, so the dialog must not touch it. */
  let outside: HTMLButtonElement;
  /** stands in for the editor content: inside the pane, so the dialog must make it inert. */
  let inside: HTMLDivElement;

  const host = () => root.querySelector('.modal-dialog-host') as HTMLElement | null;
  const box = () => root.querySelector('.dialog-content-root') as HTMLElement | null;
  const shown = () => {
    const el = host();
    return !!el && getComputedStyle(el).display !== 'none';
  };

  beforeEach(() => {
    outside = document.createElement('button');
    outside.textContent = 'title bar';
    document.body.appendChild(outside);

    // the editor pane: positioned, with content of its own beside the dialog
    root = document.createElement('div');
    root.style.cssText = 'position: relative; width: 300px; height: 200px';
    document.body.appendChild(root);

    inside = document.createElement('div');
    inside.appendChild(document.createElement('button'));
    root.appendChild(inside);

    dispose = render(() => <BusyDialog />, root);
  });

  afterEach(() => {
    dispose?.();
    document.body.innerHTML = '';
  });

  /** @description hold the window for the length of `body`, the way a real operation does. */
  const whileRunning = async (operation: Parameters<typeof runExclusive>[0], body: () => Promise<void> | void) => {
    await runExclusive(operation, async () => {
      await settled();
      await body();
    });
    await settled();
  };

  it('shows nothing while nothing is running', () => {
    expect(shown()).toBe(false);
    expect(inside.hasAttribute('inert')).toBe(false);
  });

  it('covers the pane for as long as the operation holds the window', async () => {
    await whileRunning('save', () => {
      expect(shown()).toBe(true);
      // not the top layer: that is what would take it out of the pane and dim the whole window
      expect(box()?.closest('dialog')).toBeNull();
    });

    expect(shown()).toBe(false);
  });

  it('restricts the pane and leaves the title bar alone', async () => {
    await whileRunning('save', () => {
      expect(inside.hasAttribute('inert')).toBe(true);

      // outside the pane is deliberately untouched - the title bar disables itself
      outside.focus();
      expect(document.activeElement).toBe(outside);
    });

    expect(inside.hasAttribute('inert')).toBe(false);
  });

  it('offers no way out of it', async () => {
    await whileRunning('save', () => {
      expect(box()?.querySelector('button')).toBeNull();
      // no titlebar either: nothing to grab, nothing to close
      expect(box()?.querySelector('.dialog-titlebar')).toBeNull();
    });
  });

  it('goes away even when the operation fails', async () => {
    await expect(
      runExclusive('save', async () => {
        await settled();
        expect(shown()).toBe(true);
        throw new Error('disk full');
      })
    ).rejects.toThrow('disk full');
    await settled();

    expect(shown()).toBe(false);
    expect(inside.hasAttribute('inert')).toBe(false);
  });

  it("names what is running, and counts the save's phases", async () => {
    await whileRunning('save', async () => {
      expect(host()?.textContent).toContain('saving project');

      setBusyProgress({ phase: 'layers', done: 3, total: 12 });
      await settled();
      expect(host()?.textContent).toContain('layers 3/12');
      expect(root.querySelector('.loading-bar-fill')).not.toBeNull();

      // a phase with a single step has no count worth showing
      setBusyProgress({ phase: 'pack', done: 0, total: 1 });
      await settled();
      expect(host()?.textContent).toContain('pack');
      expect(host()?.textContent).not.toContain('0/1');
    });
  });

  it('runs the bar with no fixed length when there is nothing to count', async () => {
    await whileRunning('imageImport', () => {
      expect(host()?.textContent).toContain('importing image');
      expect(root.querySelector('.loading-bar-indeterminate')).not.toBeNull();
      expect(root.querySelector('.loading-bar-fill')).toBeNull();
    });
  });

  it('gives focus back to where it was', async () => {
    outside.focus();
    expect(document.activeElement).toBe(outside);

    await whileRunning('save', () => {
      expect(document.activeElement).not.toBe(outside);
    });

    expect(document.activeElement).toBe(outside);
  });

  it('does not reach for an element that is gone by the time it closes', async () => {
    outside.focus();

    await whileRunning('projectLoad', () => {
      // what loading a project does: what was focused before may be replaced while the dialog is up
      outside.remove();
    });

    expect(shown()).toBe(false);
  });
});
