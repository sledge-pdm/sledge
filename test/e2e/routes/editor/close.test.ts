import { beforeEach, describe, expect, it, vi } from 'vitest';
import { markProjectChanged, markProjectSaved } from '~/features/project';
import { handleCloseRequest } from '~/routes/editor/close';
import { setIOStore } from '~/stores/EditorStores';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';

const mocks = vi.hoisted(() => ({
  saveProject: vi.fn(),
}));

vi.mock('~/features/io/project/ProjectSave', () => ({
  saveProject: mocks.saveProject,
}));

describe('routes/editor/close (e2e)', () => {
  let platform: TestMockPlatform;
  const closeEvent = () => ({ preventDefault: vi.fn() });

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    mocks.saveProject.mockReset();

    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    markProjectChanged();
    platform.dialog.message = vi.fn(async () => 'Save and Quit') as any;
  });

  it('closes when the save cleared the changes', async () => {
    mocks.saveProject.mockImplementation(async () => {
      markProjectSaved();
      return true;
    });
    const event = closeEvent();

    await handleCloseRequest(event as any);

    expect(mocks.saveProject).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('saves again when the finished save left changes behind', async () => {
    // what a save already running when the prompt appeared looks like from here: it succeeds, but its bytes
    // were assembled before the changes this prompt is about
    mocks.saveProject
      .mockImplementationOnce(async () => true)
      .mockImplementationOnce(async () => {
        markProjectSaved();
        return true;
      });
    const event = closeEvent();

    await handleCloseRequest(event as any);

    expect(mocks.saveProject).toHaveBeenCalledTimes(2);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('keeps the window open when it is still unsaved after the retry', async () => {
    mocks.saveProject.mockImplementation(async () => true);
    const event = closeEvent();

    await handleCloseRequest(event as any);

    // one retry, then the existing failure path rather than trying forever
    expect(mocks.saveProject).toHaveBeenCalledTimes(2);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('closes without saving when the changes are discarded', async () => {
    platform.dialog.message = vi.fn(async () => 'Discard and Quit') as any;
    const event = closeEvent();

    await handleCloseRequest(event as any);

    expect(mocks.saveProject).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
