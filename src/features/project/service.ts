import { ioStore, setIOStore } from '~/stores/EditorStores';

/** @description whether the runtime holds changes that the file on disk does not. */
export const isProjectChanged = () => ioStore.projectRevision !== ioStore.savedRevision;

/** @description record a change that saving would persist. */
export const markProjectChanged = () => setIOStore('projectRevision', (revision) => revision + 1);

/**
 * @description record that the file on disk now holds `revision`.
 *   savers pass the revision they read before assembling their bytes, so anything changed after that
 *   point stays unsaved rather than being cleared by the write completing.
 */
export const markProjectSaved = (revision: number = ioStore.projectRevision) => setIOStore('savedRevision', revision);
