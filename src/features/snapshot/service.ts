import { gzipDeflate, Size2D } from '@sledge-pdm/core';
import { createUniqueId } from 'solid-js';
import { canvasThumbnailGenerator } from '~/features/canvas/CanvasThumbnailGenerator';
import { logSystemError } from '~/features/log/service';
import { AUTOSAVE_SNAPSHOT_NAME } from '~/features/snapshot/AutoSnapshotManager';
import { getProjectFromRuntime, initRuntimeProject } from '~/stores/RuntimeProject';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { dialog } from '~/utils/platform';
import { updateLayerPreviewAll, updateWebGLCanvas } from '~/webgl/service';
import { ProjectSnapshot } from './types';

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
    setProjectStore('snapshots', [...projectStore.snapshots, snapshot]);
  }
  return snapshot;
}

export function addSnapshot(snapshot: ProjectSnapshot) {
  setProjectStore('snapshots', [...projectStore.snapshots, snapshot]);
}

export function overwriteSnapshotWithName(name: string, snapshot: ProjectSnapshot) {
  const old = projectStore.snapshots.find((s) => s.name === name);
  if (old) {
    setProjectStore('snapshots', (snapshots: ProjectSnapshot[]) => snapshots.map((s) => (s.name === name ? snapshot : s)));
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

  setProjectStore('snapshots', (snapshots: ProjectSnapshot[]) =>
    snapshots.filter((s) => {
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

  setProjectStore('snapshots', (snapshots: ProjectSnapshot[]) => {
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

  const savedSnapshotStore = { ...projectStore.snapshots };
  // load snapshot
  initRuntimeProject(snapshot.snapshot);

  setProjectStore('snapshots', savedSnapshotStore);
  updateWebGLCanvas('snapshot loaded');
  updateLayerPreviewAll();
}

export function escapeCurrentAutosave() {
  setProjectStore('snapshots', (snapshots: ProjectSnapshot[]) => {
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
