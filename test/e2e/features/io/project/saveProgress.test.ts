import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelSave, isSaveInProgress, saveProject } from '~/features/io/project/ProjectSave';
import { layerManager } from '~/features/layer/frasco/LayerManager';
import { isProjectChanged, markProjectChanged } from '~/features/project';
import { CURRENT_PROJECT_VERSION } from '~/features/project/Consts';
import { ioStore, logStore, setIOStore } from '~/stores/EditorStores';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
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

  /** what the bottom bar read at each tick. the line is written before the event, so it is this tick's. */
  const collectBottomBar = () => {
    const seen: string[] = [];
    const listener = () => {
      if (seen[seen.length - 1] !== logStore.bottomBarText) seen.push(logStore.bottomBarText);
    };
    eventBus.on('project:saveProgress', listener as any);
    return {
      seen,
      stop: () => eventBus.off('project:saveProgress', listener as any),
    };
  };

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
    const order = ['layers', 'history', 'snapshots', 'pack', 'write'];
    order.forEach((phase) => expect(phases).toContain(phase));
    // phases never interleave, so the first sighting of each keeps the running order
    const firstSeen = order.map((phase) => phases.indexOf(phase));
    expect(firstSeen).toEqual([...firstSeen].sort((a, b) => a - b));
  });

  it('leaves no silent stretch between history and pack', async () => {
    const progress = collectProgress();

    await saveProject('demo.sledge', 'C:/work');
    progress.stop();

    // restoring snapshot bodies rereads the whole saved file. without a phase of its own the display
    // would sit at history 100% for the length of that read.
    const phases = progress.seen.map((p) => p.phase);
    expect(phases[phases.lastIndexOf('history') + 1]).toBe('snapshots');
    expect(phases[phases.lastIndexOf('snapshots') + 1]).toBe('pack');
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

  it('walks the bottom bar through the phases, then reports the result', async () => {
    const bottomBar = collectBottomBar();

    await saveProject('demo.sledge', 'C:/work');
    bottomBar.stop();

    expect(bottomBar.seen[0]).toBe('saving project... [layers 0/2]');
    expect(bottomBar.seen).toContain('saving project... [pack]');
    expect(bottomBar.seen).toContain('saving project... [write]');
    expect(logStore.bottomBarText).toBe('project saved.');
  });

  it('says a cancelled save was cancelled', async () => {
    markProjectChanged();

    const running = saveProject('demo.sledge', 'C:/work');
    cancelSave();
    await running;

    expect(logStore.bottomBarText).toBe('project save cancelled.');
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

  it('gives up before rereading the saved file', async () => {
    markProjectChanged();
    const progress = collectProgress();

    const running = saveProject('demo.sledge', 'C:/work');
    cancelSave();
    await running;
    progress.stop();

    // the snapshot restore and the pack both sit behind an abort check, so neither runs
    const phases = progress.seen.map((p) => p.phase);
    expect(phases).toContain('layers');
    expect(phases).not.toContain('snapshots');
    expect(phases).not.toContain('pack');
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

  it('shares a repeat of the running save and turns down one aimed elsewhere', async () => {
    const running = saveProject('demo.sledge', 'C:/work');
    // the same request again: Ctrl+S held down, or the button and the shortcut together
    const repeat = saveProject('demo.sledge', 'C:/work');
    // Save As while that runs. sharing would answer it with a file it never asked for
    const elsewhere = saveProject();
    expect(logStore.bottomBarText).toBe('another save is still running.');

    expect(await elsewhere).toBe(false);
    expect(await repeat).toBe(true);
    expect(await running).toBe(true);
    // the picker for the other target never opened
    expect(platform.dialog.save).not.toHaveBeenCalled();
  });

  it('reads the app version before the write, not after the abort check', async () => {
    const calls: string[] = [];
    platform.app.getVersion = vi.fn(async () => {
      calls.push('getVersion');
      return '1.2.3';
    }) as any;
    platform.fs.writeFile = vi.fn(async () => {
      calls.push('writeFile');
    }) as any;

    expect(await saveProject('demo.sledge', 'C:/work')).toBe(true);

    // the abort check after the write is what stops a finished save from applying its location and snapshots
    // to a project loaded meanwhile. anything that yields between it and that state - getVersion is an IPC
    // round-trip - reopens the window it was put there to close.
    expect(calls.lastIndexOf('getVersion')).toBeLessThan(calls.indexOf('writeFile'));
  });

  it('does not apply the result of a save cancelled during the write', async () => {
    markProjectChanged();
    // the project is replaced while the bytes are on their way to disk
    platform.fs.writeFile = vi.fn(async () => {
      cancelSave();
    }) as any;
    const emit = vi.spyOn(eventBus, 'emit');

    const result = await saveProject('demo.sledge', 'C:/work');

    expect(result).toBe(false);
    // the file itself is complete - it is only the state describing the replaced project that is skipped
    expect(platform.fs.rename).toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith('project:saveCancelled', {});
    expect(ioStore.recentFiles).toEqual([]);
    expect(projectStore.project.lastSavedAt).toBeUndefined();
    expect(isProjectChanged()).toBe(true);
  });
});
