// Image pool feature - Main public interface

export type { ImagePoolEntry } from './model';

export {
  addToImagePool,
  getEntries,
  getEntry,
  hideEntry,
  insertEntry,
  relinkEntry,
  removeEntry,
  replaceAllEntries,
  selectEntry,
  setEntry,
  setImagePool,
  showEntry,
  transferToCurrentLayer,
  updateEntryPartial,
} from './service';
