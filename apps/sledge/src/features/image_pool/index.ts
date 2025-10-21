// Image pool feature - Main public interface

export type { ImagePoolEntry } from './model';

export {
  addToImagePool,
  getEntry,
  hideEntry,
  insertEntry,
  removeEntry,
  selectEntry,
  setEntry,
  showEntry,
  transferToCurrentLayer,
  updateEntryPartial,
} from './service';
