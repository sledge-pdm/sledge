// Image pool feature - Main public interface

export type { ImagePoolEntry } from './model';

export {
  addImagesFromLocal,
  getEntry,
  hideEntry,
  insertEntry,
  removeEntry,
  selectEntry,
  showEntry,
  transferToCurrentLayer,
  updateEntryPartial,
} from './service';
