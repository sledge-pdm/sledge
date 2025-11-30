import { rawToWebp } from '@sledge/anvil';
import { Size2D } from '@sledge/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createUniqueId } from 'solid-js';
import { canvasThumbnailGenerator } from '~/features/canvas/CanvasThumbnailGenerator';
import { loadProjectJson } from '~/features/io/project/in/load';
import { dumpProjectJson } from '~/features/io/project/out/dump';
import { logSystemError } from '~/features/log/service';
import { AUTOSAVE_SNAPSHOT_NAME } from '~/features/snapshot/AutoSnapshotManager';
import { ProjectSnapshot } from '~/stores/project/SnapshotStore';
import { canvasStore, setSnapshotStore, snapshotStore } from '~/stores/ProjectStores';
import { updateLayerPreviewAll, updateWebGLCanvas } from '~/webgl/service';

export async function createCurrentProjectSnapshot(name?: string): Promise<ProjectSnapshot> {
  try {
    const canvasSize: Size2D = { ...canvasStore.canvas };
    // create thumbnail (actual size)
    const thumbnailImageData = canvasThumbnailGenerator.generateCanvasThumbnail(canvasSize.width, canvasSize.height);

    const now = new Date();
    const snapshot: ProjectSnapshot = {
      createdAt: Date.now(),
      id: createUniqueId(),
      name: name ?? `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      description: undefined,
      snapshot: await dumpProjectJson(),
      thumbnail: thumbnailImageData
        ? {
            webpBuffer: rawToWebp(thumbnailImageData.data, thumbnailImageData.width, thumbnailImageData.height),
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
  const confirmResult = await confirm(`Sure to delete snapshot "${snapshot.name}"?`, {
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
    const confirmResult = await confirm(
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
  await loadProjectJson(snapshot.snapshot);

  setSnapshotStore(savedSnapshotStore);
  updateWebGLCanvas(false, 'snapshot loaded');
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
