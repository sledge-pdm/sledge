import { rawToWebp } from '@sledge/anvil';
import { Size2D } from '@sledge/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { createUniqueId } from 'solid-js';
import { ThumbnailGenerator } from '~/features/canvas/ThumbnailGenerator';
import { loadProjectJson } from '~/features/io/project/in/load';
import { dumpProjectJson } from '~/features/io/project/out/dump';
import { ProjectSnapshot } from '~/stores/editor/SnapshotStore';
import { setSnapshotStore, snapshotStore } from '~/stores/EditorStores';
import { canvasStore } from '~/stores/ProjectStores';

export async function createCurrentProjectSnapshot(name?: string): Promise<ProjectSnapshot> {
  try {
    const canvasSize: Size2D = { ...canvasStore.canvas };
    // create thumbnail (actual size)
    const thumbnailImageData = new ThumbnailGenerator().generateCanvasThumbnail(canvasSize.width, canvasSize.height);

    const now = new Date();
    const snapshot: ProjectSnapshot = {
      createdAt: Date.now(),
      id: createUniqueId(),
      name: name ?? `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      description: undefined,
      snapshot: await dumpProjectJson(),
      thumbnail: thumbnailImageData
        ? {
            webpBuffer: rawToWebp(new Uint8Array(thumbnailImageData.data.buffer), thumbnailImageData.width, thumbnailImageData.height),
            width: thumbnailImageData.width,
            height: thumbnailImageData.height,
          }
        : undefined,
    };
    return snapshot;
  } catch (error) {
    console.error('Failed to create snapshot:', error);
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
    const confirmResult = await confirm(
      `Sure to load snapshot "${snapshot.name}"?
Current state will be saved as backup.`,
      {
        cancelLabel: 'Cancel',
        okLabel: 'Backup and Load',
        kind: 'info',
        title: 'Load Snapshot',
      }
    );

    if (!confirmResult) return;

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

  const savedSnapshotStore = { ...snapshotStore };
  // load snapshot
  await loadProjectJson(snapshot.snapshot);

  setSnapshotStore(savedSnapshotStore);
}
