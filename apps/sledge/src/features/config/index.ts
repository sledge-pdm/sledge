import { setFileStore } from '~/stores/EditorStores';
import { pathToFileLocation } from '~/utils/FileUtils';

export function setLocation(path: string) {
  const fileLocation = pathToFileLocation(path);
  if (!fileLocation) return;
  setFileStore('savedLocation', fileLocation);
}
