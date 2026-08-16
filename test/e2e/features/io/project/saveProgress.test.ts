import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_PROJECT_VERSION } from '~/features/io/project/Project';
import { cancelSave, isSaveInProgress, saveProject } from '~/features/io/project/save';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { isProjectChanged, markProjectChanged, setIOStore } from '~/stores/EditorStores';
import { setProjectStore } from '~/stores/RuntimeProjectStore';
import { eventBus } from '~/utils/EventBus';
import { setPlatform } from '~/utils/platform';
import { TestMockPlatform } from '~/utils/platform/TestMockPlatform';
import { buildLayer, registerLayers, resetStore, setupWebGL } from '../../history/helpers';

const SIZE = 8;

describe('io/project/save progress and cancellation (e2e)', () => {
  let platform: TestMockPlatform;

  beforeEach(() => {
    platform = new TestMockPlatform();
    setPlatform(platform);
    platform.core.isTauri = vi.fn(() => true) as any;

    setupWebGL();
    const layers = [buildLayer('a'), buildLayer('b')];
    resetStore(layers, { width: SIZE, height: SIZE });
    registerLayers(layers, SIZE, SIZE);

    setIOStore('openAs', 'project');
    setIOStore('savedLocation', { path: 'C:/work', name: 'demo.sledge' });
    setIOStore('loadProjectVersion', { project: CURRENT_PROJECT_VERSION, sledge: '1.0.0' });
    setIOStore('recentFiles', []);
    setProjectStore('project', 'lastSavedAt', undefined);

    platform.dialog.save = vi.fn(async () => 'C:/work/demo.sledge') as any;
    platform.dialog.confirm = vi.fn(async () => true) as any;
    platform.fs.writeFile = vi.fn(async () => undefined) as any;
    platform.fs.exists = vi.fn(async () => false) as any;
    platform.fs.mkdir = vi.fn(async () => undefined) as any;
    platform.fs.rename = vi.fn(async () => undefined) as any;
    platform.fs.remove = vi.fn(async () => undefined) as any;
    platform.path.appDataDir = vi.fn(async () => 'C:/AppData') as any;
    platform.app.getVersion = vi.fn(async () => '1.2.3') as any;
  });

  const collectProgress = () => {
    const seen: { phase: string; done: number; total: number }[] = [];
    const listener = (e: { phase: string; done: number; total: number }) => seen.push({ ...e });
    eventBus.on('project:saveProgress', listener as any);
    return {
      seen,
      stop: () => eventBus.off('project:saveProgress', listener as any),
    };
  };

  it('reports every phase in order', async () => {
    const progress = collectProgress();

    const result = await saveProject('demo.sledge', 'C:/work');
    progress.stop();

    expect(result).toBe(true);
    const phases = progress.seen.map((p) => p.phase);
    expect(phases).toContain('layers');
    expect(phases).toContain('history');
    expect(phases).toContain('pack');
    expect(phases).toContain('write');
    // phases never interleave, so the first sighting of each keeps the running order
    const firstSeen = ['layers', 'history', 'pack', 'write'].map((phase) => phases.indexOf(phase));
    expect(firstSeen).toEqual([...firstSeen].sort((a, b) => a - b));
  });

  it('counts layers up to the number actually compressed', async () => {
    const progress = collectProgress();

    await saveProject('demo.sledge', 'C:/work');
    progress.stop();

    const layerSteps = progress.seen.filter((p) => p.phase === 'layers');
    expect(layerSteps[0]).toEqual({ phase: 'layers', done: 0, total: 2 });
    expect(layerSteps[layerSteps.length - 1]).toEqual({ phase: 'layers', done: 2, total: 2 });
  });

  it('skips cached layers in the count on the second save', async () => {
    await saveProject('demo.sledge', 'C:/work');

    layerManager.getLayer('a').clear([255, 0, 0, 255]);
    const progress = collectProgress();
    await saveProject('demo.sledge', 'C:/work');
    progress.stop();

    // only the edited layer needs compressing, so that is all the progress covers
    const layerSteps = progress.seen.filter((p) => p.phase === 'layers');
    expect(layerSteps[0].total).toBe(1);
  });

  it('reports no save in progress once it settles', async () => {
    const running = saveProject('demo.sledge', 'C:/work');
    expect(isSaveInProgress()).toBe(true);

    await running;
    expect(isSaveInProgress()).toBe(false);
  });

  it('cancels without writing and leaves the project unsaved', async () => {
    const emit = vi.spyOn(eventBus, 'emit');
    markProjectChanged();

    const running = saveProject('demo.sledge', 'C:/work');
    cancelSave();
    const result = await running;

    expect(result).toBe(false);
    // the write only starts once every buffer is in hand, so a cancel cannot leave a partial file
    expect(platform.fs.writeFile).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith('project:saveCancelled', {});
    expect(emit).not.toHaveBeenCalledWith('project:saveFailed', expect.anything());
    // nothing reached the disk, so the changes are still only in the runtime
    expect(isProjectChanged()).toBe(true);
  });

  it('leaves the cache usable after a cancel', async () => {
    markProjectChanged();
    const running = saveProject('demo.sledge', 'C:/work');
    cancelSave();
    await running;

    // whatever finished compressing before the cancel is still valid, and the next save completes
    const result = await saveProject('demo.sledge', 'C:/work');

    expect(result).toBe(true);
    expect(isProjectChanged()).toBe(false);
  });
});
