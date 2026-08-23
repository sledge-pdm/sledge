import { getProjectAdapter, gzipDeflate, ProjectBase, ProjectSnapshot, Size2D } from '@sledge-pdm/core';
import { batch, createUniqueId } from 'solid-js';
import { canvasThumbnailGenerator } from '~/features/canvas/CanvasThumbnailGenerator';
import { logSystemError, logSystemWarn, logUserError } from '~/features/log/service';
import { markProjectSaved } from '~/features/project';
import { ioStore } from '~/stores/EditorStores';
import { getProjectFromRuntime } from '~/stores/RuntimeProject';
import { projectStore, setProjectStore } from '~/stores/RuntimeProjectStore';
import { normalizeJoin } from '~/utils/FileUtils';
import { unpackFromPath } from '~/utils/msgpackr';
import { dialog } from '~/utils/platform';
import { calcThumbnailSize } from '~/utils/ThumbnailUtils';
import { updateFrascoCanvas } from '~/webgl/service';
import { ProjectLoader } from '../io/project/ProjectLoader';
import { RuntimeProjectSnapshot } from './types';

const SNAPSHOT_LOG_LABEL = 'Snapshot';

/**
 * @description read + unpack the saved project file and collect snapshot bodies as id -> project.
 *   both are heavy operations against the whole project, so callers must share a single result
 *   instead of doing this per snapshot.
 *
 *   a file that cannot be read or unpacked throws rather than coming back empty: the only copy of every
 *   snapshot body is in that file, and a caller that is about to overwrite it must not treat "read failed"
 *   as "there were none". callers that are not writing anything catch this themselves.
 */
async function loadStoredSnapshotProjects(): Promise<Map<string, ProjectBase> | undefined> {
  const projectLoc = ioStore.savedLocation;
  if (!projectLoc || !projectLoc.path || !projectLoc.name) return undefined;

  const rootProject = await unpackFromPath(normalizeJoin(projectLoc.path, projectLoc.name));
  if (!rootProject) return undefined;
  const adapter = getProjectAdapter(rootProject);
  if (!adapter) return undefined;
  const snapshots = await adapter.getSnapshots();
  const stored = new Map<string, ProjectBase>();
  snapshots?.forEach((s) => {
    if (s.project) stored.set(s.id, s.project);
  });
  return stored;
}

export async function getAllFullSnapshots(): Promise<ProjectSnapshot[]> {
  const snapshots = projectStore.snapshots;
  if (snapshots.length === 0) return [];

  // snapshots without a body have to be restored from the saved file. read it once, not once per snapshot.
  const stored = snapshots.some((s) => !s.project) ? await loadStoredSnapshotProjects() : undefined;

  const fullSnapshots: ProjectSnapshot[] = [];
  for (const snapshot of snapshots) {
    if (snapshot.project) {
      fullSnapshots.push(snapshot as ProjectSnapshot);
      continue;
    }
    const project = stored?.get(snapshot.id);
    // a single unrestorable snapshot must not fail the whole save.
    if (!project) {
      logSystemWarn(`Snapshot "${snapshot.name}" could not be restored and is excluded from this save.`, {
        label: SNAPSHOT_LOG_LABEL,
        details: [snapshot.id],
      });
      continue;
    }
    fullSnapshots.push({ ...snapshot, project });
  }

  return fullSnapshots;
}

export function makeSnapshotsAllRuntime() {
  batch(() => {
    projectStore.snapshots.forEach((_s, i) => {
      setProjectStore('snapshots', i, 'project', undefined);
    });
  });
}

export async function loadFullSnapshot(snapshot: ProjectSnapshot | RuntimeProjectSnapshot): Promise<ProjectSnapshot | undefined> {
  if (snapshot.project) return snapshot;

  // restoring one snapshot for the user writes nothing, and the caller reports the failure, so a file that
  // cannot be read is answered with "not restorable" rather than thrown at them.
  let stored: Map<string, ProjectBase> | undefined;
  try {
    stored = await loadStoredSnapshotProjects();
  } catch (error) {
    logSystemError('Failed to read snapshots from saved project.', { label: SNAPSHOT_LOG_LABEL, details: [error] });
    return undefined;
  }
  const project = stored?.get(snapshot.id);
  if (!project) return undefined;

  return {
    ...snapshot,
    project,
  };
}

export async function createCurrentProjectSnapshot(name?: string): Promise<ProjectSnapshot> {
  try {
    const canvasSize: Size2D = { ...projectStore.canvas.size };
    const thumbSize = calcThumbnailSize(canvasSize.width, canvasSize.height);
    const thumbnailImageData = canvasThumbnailGenerator.generateCanvasThumbnail(thumbSize.width, thumbSize.height);

    const now = new Date();
    // snapshots are dropped right below, so don't pay for restoring them in the first place.
    const currentProject = await getProjectFromRuntime({ includeSnapshots: false });
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

  const savedSnapshotStore = [...projectStore.snapshots];

  const fullSnapshot = await loadFullSnapshot(snapshot);
  if (!fullSnapshot) {
    logUserError(`Failed to load project (failed to load full snapshot from file.)`);
    return;
  }
  // load snapshot
  await ProjectLoader.fromProjectObj({ project: fullSnapshot.project, locationOverride: { ...ioStore.savedLocation } }).load();

  markProjectSaved();

  setProjectStore('snapshots', savedSnapshotStore);
  updateFrascoCanvas('snapshot loaded');
}
