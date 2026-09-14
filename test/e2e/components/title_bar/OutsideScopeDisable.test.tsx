import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TopMenuBarItem } from '~/components/global/title_bar/TopMenuBarItem';
import { runExclusive } from '~/features/busy';

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * the busy modal is scoped to the editor pane, so nothing above it - the title bar and its menus - is made
 * inert by the browser. those have to turn themselves off, or they stay a way into the project while an
 * operation is reading it.
 */
describe('title bar disabling outside the modal scope (e2e)', () => {
  let dispose: (() => void) | undefined;
  let root: HTMLDivElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => {
    dispose?.();
    document.body.innerHTML = '';
  });

  const whileRunning = async (body: () => Promise<void> | void) => {
    await runExclusive('save', async () => {
      await settled();
      await body();
    });
    await settled();
  };

  it('does not run a top menu action while an operation is running', async () => {
    const action = vi.fn();
    dispose = render(() => <TopMenuBarItem label='Files.' action={action} disabled={false} />, root);
    const link = root.querySelector('a') as HTMLAnchorElement;

    link.click();
    await settled();
    expect(action).toHaveBeenCalledTimes(1);

    dispose();
    dispose = render(() => <TopMenuBarItem label='Files.' action={action} disabled={true} />, root);
    const disabledLink = root.querySelector('a') as HTMLAnchorElement;

    disabledLink.click();
    await settled();
    // still one: the disabled item swallowed the click rather than acting on it
    expect(action).toHaveBeenCalledTimes(1);
    expect(getComputedStyle(disabledLink).pointerEvents).toBe('none');
  });

  it('closes a top menu that was open when the operation started', async () => {
    const menu = () => [{ type: 'item' as const, label: 'open recent', onSelect: () => {} }];
    let busy = false;
    dispose = render(() => <TopMenuBarItem label='Files.' action={() => {}} menu={menu} disabled={busy} />, root);

    const link = root.querySelector('a') as HTMLAnchorElement;
    link.click();
    await settled();
    expect(root.querySelector('.menu-list-root, ul')).not.toBeNull();

    // the operation starts with the menu already down
    dispose();
    busy = true;
    dispose = render(() => <TopMenuBarItem label='Files.' action={() => {}} menu={menu} disabled={busy} />, root);
    await settled();

    expect(root.querySelector('ul')).toBeNull();
  });

  it('turns the canvas controls off for the length of an operation', async () => {
    const CanvasControlMenu = (await import('~/components/global/title_bar/CanvasControlMenu')).default;
    dispose = render(() => <CanvasControlMenu />, root);
    await settled();

    const items = () => Array.from(root.querySelectorAll<HTMLElement>(':scope > div'));
    // nothing is off to begin with, apart from "reset orientation" which needs something to reset
    const activeBefore = items().filter((el) => getComputedStyle(el).pointerEvents !== 'none');
    expect(activeBefore.length).toBeGreaterThan(0);

    await whileRunning(() => {
      // every control, including "rotate clockwise" which was the one left wired up wrong
      const stillActive = items().filter((el) => getComputedStyle(el).pointerEvents !== 'none');
      expect(stillActive).toEqual([]);
    });

    expect(items().filter((el) => getComputedStyle(el).pointerEvents !== 'none').length).toBe(activeBefore.length);
  });
});
