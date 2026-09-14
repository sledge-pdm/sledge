import { afterEach, describe, expect, it } from 'vitest';
import { runExclusive } from '~/features/busy';
import { showContextMenu } from '~/utils/contextMenu';
import { closeContextMenu } from '~/utils/contextMenu/store';

/**
 * the builder mounts the menu on `document.body`, outside the editor pane the busy modal covers - so this
 * counts what is in the document rather than what is inside any particular container. `ul.menu` is what
 * MenuList renders: the `context-menu` class the builder passes is overwritten by MenuList's own `class`.
 */
const menusInDocument = () => document.querySelectorAll('ul.menu').length;

const openMenu = async () => {
  showContextMenu([{ type: 'item', label: 'delete layer', onSelect: () => {} }], { x: 10, y: 10 });
  // the list mounts synchronously, but its position is settled in a microtask
  await Promise.resolve();
};

describe('features/busy and the context menu (e2e)', () => {
  afterEach(() => closeContextMenu());

  it('takes down a menu that was open when an operation starts', async () => {
    await openMenu();
    expect(menusInDocument()).toBe(1);

    await runExclusive('save', async () => {
      // gone before the body runs, not merely once the operation is over: the modal it would outlive is up
      // for the whole of this, and every item on it edits the project being read.
      expect(menusInDocument()).toBe(0);
    });

    expect(menusInDocument()).toBe(0);
  });

  it('leaves a menu alone for a step running inside an operation that already holds the window', async () => {
    await runExclusive('snapshotLoad', async () => {
      await openMenu();
      expect(menusInDocument()).toBe(1);

      // `inherit` is the inner step of an operation whose own acquisition already closed what was open
      await runExclusive('projectLoad', async () => {}, { mode: 'inherit' });
      expect(menusInDocument()).toBe(1);
    });
  });

  it('keeps only the newest menu, so an earlier one cannot be left holding the document', async () => {
    await openMenu();
    await openMenu();

    expect(menusInDocument()).toBe(1);
  });

  it('removes the menu from the document rather than only forgetting it', async () => {
    await openMenu();
    closeContextMenu();

    expect(menusInDocument()).toBe(0);
    // a second close with nothing open is not an error
    expect(() => closeContextMenu()).not.toThrow();
  });

  it('handles an item whose own selection starts an exclusive operation', async () => {
    // MenuList runs `onSelect` and closes the menu after it, so an item that starts an operation has its
    // menu taken down mid-click - and the close MenuList does next lands on a menu already gone.
    let ranInside = false;
    showContextMenu(
      [
        {
          type: 'item',
          label: 'transfer to layer',
          onSelect: () => {
            void runExclusive('imageTransfer', async () => {
              ranInside = true;
            });
          },
        },
      ],
      { x: 10, y: 10 }
    );
    await Promise.resolve();

    (document.querySelector('li.menu-item') as HTMLElement).click();
    await Promise.resolve();

    expect(ranInside).toBe(true);
    expect(menusInDocument()).toBe(0);
  });
});
