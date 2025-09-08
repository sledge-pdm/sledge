// Image pool feature - Main public interface

export type { ImagePoolEntry } from './model';

export {
  setImagePool,
  getEntries,
  getEntry,
  insertEntry,
  setEntry,
  updateEntryPartial,
  removeEntry,
  replaceAllEntries,
  addToImagePool,
  relinkEntry,
  transferToCurrentLayer,
  selectEntry,
  showEntry,
  hideEntry,
} from './service';
