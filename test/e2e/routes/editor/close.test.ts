import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runExclusive } from '~/features/busy';
import { markProjectChanged, markProjectSaved } from '~/features/project';
import { handleCloseRequest } from '~/routes/editor/close';
import { setIOStore } from '~/stores/EditorStores';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

const mocks = vi.hoisted(() => ({
  saveProject: vi.fn(),
  cancelSave: vi.fn(() => true),
  /** whether the running save is still before its write. */
  cancellable: true,
}));

vi.mock('~/features/io/project/ProjectSave', () => ({
  saveProject: mocks.saveProject,
  cancelSave: mocks.cancelSave,
  isSaveCancellable: () => mocks.cancellable,
}));

describe('routes/editor/close (e2e)', () => {
  let platform: TestMockPlatform;
  const closeEvent = () => ({ preventDefault: vi.fn() });
  /** the options the last native dialog was raised with. */
  const lastDialogOptions = () => (platform.dialog.message as any).mock.calls.at(-1)?.[1];

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    mocks.saveProject.mockReset();
    mocks.cancelSave.mockClear();
    mocks.cancellable = true;

    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    markProjectChanged();
    platform.dialog.message = vi.fn(async () => 'Save and Quit') as any;
  });

  it('closes when the save cleared the changes', async () => {
    mocks.saveProject.mockImplementation(async () => {
      markProjectSaved();
      return 'saved';
    });
    const event = closeEvent();

    await handleCloseRequest(event as any);

    expect(mocks.saveProject).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('saves once, inside the period the prompt is already holding', async () => {
    mocks.saveProject.mockImplementation(async () => {
      markProjectSaved();
      return 'saved';
    });
    const event = closeEvent();

    await handleCloseRequest(event as any);

    expect(mocks.saveProject).toHaveBeenCalledTimes(1);
    // the prompt and the save are one operation, so the save runs inside the window quitting already holds
    expect(mocks.saveProject).toHaveBeenCalledWith('demo.sledge', 'C:/work', { busy: 'inherit' });
  });

  it('keeps the window open when the save left changes behind', async () => {
    // a save that reports success but leaves the project dirty. nothing could have edited it while the
    // prompt was up, so there is nothing a second attempt would pick up - the quit is refused instead.
    mocks.saveProject.mockImplementation(async () => 'saved');
    const event = closeEvent();

    await handleCloseRequest(event as any);

    expect(mocks.saveProject).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('says the save failed when it failed', async () => {
    mocks.saveProject.mockImplementation(async () => 'failed');
    const event = closeEvent();

    await handleCloseRequest(event as any);

    expect(event.preventDefault).toHaveBeenCalled();
    expect((platform.dialog.message as any).mock.calls.at(-1)?.[0]).toContain('Save failed');
  });

  it('says nothing about failure when the save was cancelled', async () => {
    // the user stopped the save themselves, or declined the dialog asking where to write. nothing went
    // wrong, and the cancellation was already reported - telling them it failed would contradict it.
    mocks.saveProject.mockImplementation(async () => 'cancelled');
    const event = closeEvent();

    await handleCloseRequest(event as any);

    expect(event.preventDefault).toHaveBeenCalled();
    // only the unsaved-changes prompt itself
    expect(platform.dialog.message).toHaveBeenCalledTimes(1);
  });

  it('refuses the quit while an operation is running, and says so where the button was', async () => {
    const event = closeEvent();
    platform.dialog.message = vi.fn(async () => 'Wait') as any;

    await runExclusive('save', async () => {
      await handleCloseRequest(event as any);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    // the unsaved-changes prompt is never reached: the refusal comes first
    expect(mocks.saveProject).not.toHaveBeenCalled();
    // told in a native dialog rather than the bottom bar, which is the far corner from the close button
    expect(platform.dialog.message).toHaveBeenCalledTimes(1);
    const text = (platform.dialog.message as any).mock.calls[0][0];
    expect(text).toContain('Cannot quit while an operation is running');
    // the label is a field value, not a sentence fragment left dangling under the message
    expect(text).toContain('Operation: saving project');
    // and the button's name could be read as "stop, then quit", so the text says it does not
    expect(text).toContain('does not quit');
    expect(lastDialogOptions()?.buttons).toEqual({ yes: 'Stop Saving', no: 'Wait' });
  });

  it('stops the save when the user asks, without quitting', async () => {
    const event = closeEvent();
    platform.dialog.message = vi.fn(async () => 'Stop Saving') as any;

    await runExclusive('save', async () => {
      await handleCloseRequest(event as any);
    });

    expect(mocks.cancelSave).toHaveBeenCalledTimes(1);
    // stopping the save clears the way; it does not itself quit
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('leaves the save alone when the user waits', async () => {
    platform.dialog.message = vi.fn(async () => 'Wait') as any;

    await runExclusive('save', async () => {
      await handleCloseRequest(closeEvent() as any);
    });

    expect(mocks.cancelSave).not.toHaveBeenCalled();
  });

  it('offers no button once the save has started writing', async () => {
    mocks.cancellable = false;
    platform.dialog.message = vi.fn(async () => undefined) as any;

    await runExclusive('save', async () => {
      await handleCloseRequest(closeEvent() as any);
    });

    // the write cannot be interrupted, so there is nothing to offer - just the message
    expect(lastDialogOptions()?.buttons).toBeUndefined();
    expect(mocks.cancelSave).not.toHaveBeenCalled();
  });

  it('offers no button for an operation that has no way to stop', async () => {
    // no save is in flight during an import, so the real isSaveCancellable answers false here
    mocks.cancellable = false;
    platform.dialog.message = vi.fn(async () => undefined) as any;

    await runExclusive('imageImport', async () => {
      await handleCloseRequest(closeEvent() as any);
    });

    const text = (platform.dialog.message as any).mock.calls[0][0];
    expect(text).toContain('Operation: importing image');
    // nothing to stop, so the line about stopping is left out entirely
    expect(text).not.toContain('does not quit');
    expect(lastDialogOptions()?.buttons).toBeUndefined();
  });

  it('closes without saving when the changes are discarded', async () => {
    platform.dialog.message = vi.fn(async () => 'Discard and Quit') as any;
    const event = closeEvent();

    await handleCloseRequest(event as any);

    expect(mocks.saveProject).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
