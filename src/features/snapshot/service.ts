import { getProjectAdapter, gzipDeflate, Size2D } from '@sledge-pdm/core';
import { createUniqueId } from 'solid-js';
import { canvasThumbnailGenerator } from '~/features/canvas/CanvasThumbnailGenerator';
import { logSystemError, logUserError } from '~/features/log/service';
import { AUTOSAVE_SNAPSHOT_NAME } from '~/features/snapshot/AutoSnapshotManager';
import { ioStore, setIOStore } from '~/stores/EditorStores';
import { getProjectFromRuntime } from '~/stores/RuntimeProject';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { normalizeJoin } from '~/utils/FileUtils';
import { unpackFromPath } from '~/utils/msgpackr';
import { dialog } from '~/utils/platform';
import { calcThumbnailSize } from '~/utils/ThumbnailUtils';
import { updateLayerPreviewAll, updateWebGLCanvas } from '~/webgl/service';
import { ProjectLoader } from '../io/project/ProjectLoader';
import { ProjectSnapshot, RuntimeProjectSnapshot } from './types';

export async function getAllFullSnapshots(): Promise<ProjectSnapshot[]> {
  const fullSnapshots = await Promise.all(projectStore.snapshots.map(async (s) => await loadFullSnapshot(s)));
  return fullSnapshots.filter((item): item is Exclude<typeof item, undefined> => item !== undefined);
}

export function makeSnapshotsAllRuntime() {
  setProjectStore('snapshots', (snapshots) => {
    return snapshots.map((snapshot) => {
      return { ...snapshot, project: undefined } as RuntimeProjectSnapshot;
    });
  });
}

export async function loadFullSnapshot(snapshot: ProjectSnapshot | RuntimeProjectSnapshot): Promise<ProjectSnapshot | undefined> {
  if (snapshot.project) return snapshot;

  const projectLoc = ioStore.savedLocation;
  if (!projectLoc || !projectLoc.path || !projectLoc.name) return undefined;
  const rootProject = await unpackFromPath(normalizeJoin(projectLoc.path, projectLoc.name));
  if (!rootProject) return undefined;
  const adapter = getProjectAdapter(rootProject);
  if (!adapter) return undefined;
  const snapshots = await adapter.getSnapshots();
  const matched: ProjectSnapshot | undefined = snapshots?.find((s) => s.id === snapshot.id);
  if (!matched) return undefined;

  return {
    ...snapshot,
    project: matched.project,
  };
}

export async function createCurrentProjectSnapshot(name?: string): Promise<ProjectSnapshot> {
  try {
    const canvasSize: Size2D = { ...projectStore.canvas.size };
    const thumbSize = calcThumbnailSize(canvasSize.width, canvasSize.height);
    const thumbnailImageData = canvasThumbnailGenerator.generateCanvasThumbnail(thumbSize.width, thumbSize.height);

    const now = new Date();
    const currentProject = await getProjectFromRuntime();
    currentProject.snapshots = []; // for memory optimization
    const snapshot: ProjectSnapshot = {
      createdAt: Date.now(),
      id: createUniqueId(),
      name: name ?? `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      description: undefined,
      project: currentProject,
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

export async function registerCurrentProjectSnapshot(name?: string): Promise<ProjectSnapshot | RuntimeProjectSnapshot> {
  const snapshot = await createCurrentProjectSnapshot(name);
  if (snapshot) {
    setProjectStore('snapshots', [...projectStore.snapshots, snapshot]);
  }
  return snapshot;
}

export function addSnapshot(snapshot: ProjectSnapshot | RuntimeProjectSnapshot) {
  setProjectStore('snapshots', [...projectStore.snapshots, snapshot]);
}

export function overwriteSnapshotWithName(name: string, snapshot: ProjectSnapshot | RuntimeProjectSnapshot) {
  const old = projectStore.snapshots.find((s) => s.name === name);
  if (old) {
    setProjectStore('snapshots', (snapshots: (ProjectSnapshot | RuntimeProjectSnapshot)[]) => snapshots.map((s) => (s.name === name ? snapshot : s)));
  } else {
    addSnapshot(snapshot);
  }
}

export async function deleteSnapshot(snapshot: ProjectSnapshot | RuntimeProjectSnapshot) {
  const confirmResult = await dialog.confirm(`Sure to delete snapshot "${snapshot.name}"?`, {
    cancelLabel: 'Cancel',
    okLabel: 'Delete',
    kind: 'info',
    title: 'Delete Snapshot',
  });

  if (!confirmResult) return;

  setProjectStore('snapshots', (snapshots: (ProjectSnapshot | RuntimeProjectSnapshot)[]) =>
    snapshots.filter((s) => {
      return s.id !== snapshot.id;
    })
  );
}

export async function loadSnapshot(
  snapshot: ProjectSnapshot | RuntimeProjectSnapshot,
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

  setProjectStore('snapshots', (snapshots: (ProjectSnapshot | RuntimeProjectSnapshot)[]) => {
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

  const savedSnapshotStore = [...projectStore.snapshots];

  const fullSnapshot = await loadFullSnapshot(snapshot);
  if (!fullSnapshot) {
    logUserError(`Failed to load project (failed to load full snapshot from file.)`);
    return;
  }
  // load snapshot
  await ProjectLoader.fromProject({ project: fullSnapshot.project }).load();

  setIOStore('isProjectChangedAfterSave', false);

  setProjectStore('snapshots', savedSnapshotStore);
  updateWebGLCanvas('snapshot loaded');
  updateLayerPreviewAll();
}

export function escapeCurrentAutosave() {
  setProjectStore('snapshots', (snapshots: (ProjectSnapshot | RuntimeProjectSnapshot)[]) => {
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
