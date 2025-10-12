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

export async function createSnapshotFromCurrentState(name?: string): Promise<ProjectSnapshot> {
  try {
    const canvasSize: Size2D = { ...canvasStore.canvas };
    // create thumbnail (actual size)
    const thumbnailImageData = new ThumbnailGenerator().generateCanvasThumbnail(canvasSize.width, canvasSize.height);

    const now = new Date();
    const snapShot: ProjectSnapshot = {
      createdAt: Date.now(),
      id: createUniqueId(),
      name: name ?? `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      description: undefined,
      snapShot: await dumpProjectJson(),
      thumbnail: thumbnailImageData
        ? {
            webpBuffer: rawToWebp(new Uint8Array(thumbnailImageData.data.buffer), thumbnailImageData.width, thumbnailImageData.height),
            width: thumbnailImageData.width,
            height: thumbnailImageData.height,
          }
        : undefined,
    };
    const newSnapshots = new Map(snapshotStore.snapShots);
    newSnapshots.set(snapShot.id, snapShot);
    setSnapshotStore('snapShots', newSnapshots);

    return snapShot;
  } catch (error) {
    console.error('Failed to create snapshot:', error);
    throw new Error('スナップショットの作成に失敗しました');
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

  const newSnapshots = new Map(snapshotStore.snapShots);
  newSnapshots.delete(snapshot.id);
  setSnapshotStore('snapShots', newSnapshots);
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
    const created = await createSnapshotFromCurrentState('backup: ' + new Date().toLocaleDateString() + '-' + new Date().toLocaleTimeString());
    if (!created) return;
  } else {
    const confirmResult = await confirm(
      `Sure to load snapshot "${snapshot.name}"?
Current state will discarded.`,
      {
        cancelLabel: 'Cancel',
        okLabel: 'Load',
        kind: 'info',
        title: 'Load Snapshot',
      }
    );

    if (!confirmResult) return;
  }

  // load snapshot
  const snapshotData = { ...snapshot.snapShot };
  // preserve current snapshots state (avoid circular reference)
  snapshotData.snapshots.store = snapshotStore;
  // load snapshot
  await loadProjectJson(snapshotData);
}
