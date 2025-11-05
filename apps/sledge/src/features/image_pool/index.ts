// Image pool feature - Main public interface

export type { ImagePoolEntry } from './model';

export {
  addImagesFromLocal,
  addImagesFromRawBuffer,
  createEntryFromLocalImage,
  createEntryFromRawBuffer,
  getEntry,
  hideEntry,
  insertEntry,
  removeEntry,
  selectEntry,
  showEntry,
  transferToCurrentLayer,
  updateEntryPartial,
} from './service';
