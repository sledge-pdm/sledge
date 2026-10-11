import { render } from 'solid-js/web';
import { afterEach, describe, expect, it } from 'vitest';
import ConfigForm from '~/components/config/ConfigForm';
import { getDefaultSettings } from '~/features/io/config/set';
import { resetPlatform, setPlatform, type EventCallback } from '~/utils/platform';
import { createTestMockPlatform } from '~/utils/platform/TestMockPlatform';

/** every file write takes this long, so a reload that writes the config back stays in flight for a while. */
const WRITE_DELAY_MS = 30;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** @description an in-memory config file, and a global event that comes back to this window like the real one does. */
const usePlatform = (settings = getDefaultSettings()) => {
  let file = JSON.stringify(settings);
  const listeners = new Map<string, EventCallback<unknown>[]>();

  const platform = createTestMockPlatform();
  platform.fs.exists = async () => true;
  platform.fs.readTextFile = async () => file;
  platform.fs.writeTextFile = async (_path: string, content: string) => {
    await wait(WRITE_DELAY_MS);
    file = content;
  };
  platform.core.isTauri = () => true;
  platform.core.invoke = async <T,>(cmd: string, args?: any) => {
    if (cmd === 'emit_global_event') {
      for (const handler of listeners.get(args.event) ?? []) setTimeout(() => handler({ event: args.event, id: 0, payload: args.msg }), 0);
    }
    return undefined as T;
  };
  platform.event.listen = async (name: string, handler: EventCallback<unknown>) => {
    listeners.set(name, [...(listeners.get(name) ?? []), handler]);
    return () => {};
  };
  setPlatform(platform);
};

describe('ConfigForm (e2e)', () => {
  let dispose: (() => void) | undefined;

  const mount = async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    dispose = render(() => ConfigForm({}), root);
    await wait(WRITE_DELAY_MS * 4);
  };

  const link = (text: string) => Array.from(document.querySelectorAll('a')).find((a) => a.textContent === text)!;
  const saveButton = () => Array.from(document.querySelectorAll('button')).find((b) => /save|no changes/.test(b.textContent ?? ''))!;
  const firstToggle = () => document.querySelector('input[type=checkbox]') as HTMLInputElement;

  /** @description every state the save button area goes through, including ones that only last until the next write returns. */
  const recordStates = () => {
    const states: string[] = [];
    const snapshot = () => {
      const saved = Array.from(document.querySelectorAll('p')).some((p) => p.textContent === 'SAVED!');
      const state = `${saveButton().textContent}${saved ? ' [SAVED!]' : ''}`;
      if (states[states.length - 1] !== state) states.push(state);
    };
    snapshot();
    const observer = new MutationObserver(snapshot);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    return () => {
      observer.disconnect();
      snapshot();
      return states;
    };
  };

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    document.body.innerHTML = '';
    resetPlatform();
  });

  it('an edit marks the form dirty', async () => {
    usePlatform();
    await mount();
    link('CANVAS.').click();
    await wait(10);

    const stop = recordStates();
    firstToggle().click();
    await wait(10);

    expect(stop()).toEqual(['no changes.', 'save.']);
  });

  it('stays saved while the saved config is reloaded', async () => {
    usePlatform();
    await mount();
    link('CANVAS.').click();
    await wait(10);
    firstToggle().click();
    await wait(10);

    const stop = recordStates();
    saveButton().click();
    await wait(WRITE_DELAY_MS * 8);

    expect(stop()).toEqual(['save.', 'no changes. [SAVED!]']);
  });

  it('does not show the reset defaults as unsaved while they are written', async () => {
    const settings = getDefaultSettings();
    settings.globalConfigStore.editor.showPointedPixel = !settings.globalConfigStore.editor.showPointedPixel;
    usePlatform(settings);
    await mount();

    const stop = recordStates();
    link('reset to default.').click();
    await wait(WRITE_DELAY_MS * 8);

    expect(stop()).toEqual(['no changes.']);
  });
});
