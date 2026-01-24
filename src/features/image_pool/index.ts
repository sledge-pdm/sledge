// Image pool feature - Main public interface

export type { ImagePoolEntry, ImagePoolImage, ImagePoolState } from './model';

export {
  addImagesFromFiles,
  addImagesFromLocal,
  addImagesFromRawBuffer,
  createEntryFromFile,
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
