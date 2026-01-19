import { gzipDeflate, Size2D } from '@sledge-pdm/core';
import { createUniqueId } from 'solid-js';
import { canvasThumbnailGenerator } from '~/features/canvas/CanvasThumbnailGenerator';
import { loadProject } from '~/features/io/project/in/load';
import { logSystemError } from '~/features/log/service';
import { AUTOSAVE_SNAPSHOT_NAME } from '~/features/snapshot/AutoSnapshotManager';
import { ProjectSnapshot } from '~/stores/project/SnapshotStore';
import { setSnapshotStore, snapshotStore } from '~/stores/ProjectStores';
import { getProjectFromRuntime, projectStore } from '~/stores/RuntimeProject';
import { dialog } from '~/utils/platform';
import { updateLayerPreviewAll, updateWebGLCanvas } from '~/webgl/service';

export async function createCurrentProjectSnapshot(name?: string): Promise<ProjectSnapshot> {
  try {
    const canvasSize: Size2D = { ...projectStore.canvas.size };
    // create thumbnail (actual size)
    const thumbnailImageData = canvasThumbnailGenerator.generateCanvasThumbnail(canvasSize.width, canvasSize.height);

    const now = new Date();
    const snapshot: ProjectSnapshot = {
      createdAt: Date.now(),
      id: createUniqueId(),
      name: name ?? `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      description: undefined,
      snapshot: await getProjectFromRuntime(),
      thumbnail: thumbnailImageData
        ? {
            packedBuffer: gzipDeflate(thumbnailImageData.data),
            width: thumbnailImageData.width,
            height: thumbnailImageData.height,
          }
        : undefined,
    };
    return snapshot;
  } catch (error) {
    logSystemError('Failed to create snapshot.', { label: 'Snapshot', details: [error] });
    throw new Error('スナップショットの作成に失敗しました');
  }
}

export async function registerCurrentProjectSnapshot(name?: string): Promise<ProjectSnapshot> {
  const snapshot = await createCurrentProjectSnapshot(name);
  if (snapshot) {
    setSnapshotStore('snapshots', [...snapshotStore.snapshots, snapshot]);
  }
  return snapshot;
}

export function addSnapshot(snapshot: ProjectSnapshot) {
  setSnapshotStore('snapshots', [...snapshotStore.snapshots, snapshot]);
}

export function overwriteSnapshotWithName(name: string, snapshot: ProjectSnapshot) {
  const old = snapshotStore.snapshots.find((s) => s.name === name);
  if (old) {
    setSnapshotStore(
      'snapshots',
      snapshotStore.snapshots.map((s) => (s.name === name ? snapshot : s))
    );
  } else {
    addSnapshot(snapshot);
  }
}

export async function deleteSnapshot(snapshot: ProjectSnapshot) {
  const confirmResult = await dialog.confirm(`Sure to delete snapshot "${snapshot.name}"?`, {
    cancelLabel: 'Cancel',
    okLabel: 'Delete',
    kind: 'info',
    title: 'Delete Snapshot',
  });

  if (!confirmResult) return;

  setSnapshotStore(
    'snapshots',
    snapshotStore.snapshots.filter((s) => {
      return s.id !== snapshot.id;
    })
  );
}

export async function loadSnapshot(
  snapshot: ProjectSnapshot,
  option?: {
    backup?: boolean;
  }
) {
  if (option?.backup) {
    // backup current state
    const created = await registerCurrentProjectSnapshot('backup: ' + new Date().toLocaleDateString() + '-' + new Date().toLocaleTimeString());
    if (!created) return;
  } else {
    const confirmResult = await dialog.confirm(
      `Sure to load snapshot "${snapshot.name}"?
This will NOT backup your current state (unless you did manually backup.)`,
      {
        cancelLabel: 'Cancel',
        okLabel: 'Discard and Load',
        kind: 'info',
        title: 'Load Snapshot',
      }
    );

    if (!confirmResult) return;
  }

  setSnapshotStore('snapshots', (snapshots) => {
    const filtered = snapshots.map((snapshot) => {
      if (snapshot.name === AUTOSAVE_SNAPSHOT_NAME) {
        const now = new Date();
        return {
          ...snapshot,
          name: `${snapshot.name} (${now.toLocaleDateString()} ${now.toLocaleTimeString()})`,
        };
      }
      return snapshot;
    });
    return filtered;
  });

  escapeCurrentAutosave();

  const savedSnapshotStore = { ...snapshotStore };
  // load snapshot
  await loadProject(snapshot.snapshot);

  setSnapshotStore(savedSnapshotStore);
  updateWebGLCanvas('snapshot loaded');
  updateLayerPreviewAll();
}

export function escapeCurrentAutosave() {
  setSnapshotStore('snapshots', (snapshots) => {
    const filtered = snapshots.map((snapshot) => {
      if (snapshot.name === AUTOSAVE_SNAPSHOT_NAME) {
        const now = new Date();
        return {
          ...snapshot,
          name: `${snapshot.name} (${now.toLocaleDateString()} ${now.toLocaleTimeString()})`,
        };
      }
      return snapshot;
    });
    return filtered;
  });
}
