import { beforeEach, describe, expect, it } from 'vitest';
import { addSnapshot, makeSnapshotsAllRuntime, overwriteSnapshotWithName } from '~/features/snapshot/service';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';

const snapshot = (id: string, name: string, withProject = true) =>
  ({
    id,
    name,
    createdAt: 1,
    project: withProject ? ({ version: 'v' } as any) : undefined,
    thumbnail: undefined,
  }) as any;

describe('snapshot service', () => {
  beforeEach(() => {
    setProjectStore('snapshots', []);
  });

  it('addSnapshot appends a snapshot entry', () => {
    addSnapshot(snapshot('s1', 'snap 1'));
    expect(projectStore.snapshots).toHaveLength(1);
    expect(projectStore.snapshots[0].id).toBe('s1');
  });

  it('overwriteSnapshotWithName replaces existing snapshot by name', () => {
    setProjectStore('snapshots', [snapshot('s1', 'same-name'), snapshot('s2', 'other')]);
    overwriteSnapshotWithName('same-name', snapshot('s3', 'same-name', false));

    expect(projectStore.snapshots).toHaveLength(2);
    expect(projectStore.snapshots[0].id).toBe('s3');
    expect(projectStore.snapshots[1].id).toBe('s2');
  });

  it('overwriteSnapshotWithName appends when name does not exist', () => {
    setProjectStore('snapshots', [snapshot('s1', 'one')]);
    overwriteSnapshotWithName('new', snapshot('s2', 'new'));

    expect(projectStore.snapshots).toHaveLength(2);
    expect(projectStore.snapshots[1].id).toBe('s2');
  });

  it('makeSnapshotsAllRuntime drops in-memory project payload from each snapshot', () => {
    setProjectStore('snapshots', [snapshot('s1', 'one', true), snapshot('s2', 'two', true)]);

    makeSnapshotsAllRuntime();

    expect(projectStore.snapshots[0].project).toBeUndefined();
    expect(projectStore.snapshots[1].project).toBeUndefined();
  });
});
