import { setLogStore } from '~/stores/EditorStores';

export function setBottomBarText(text: string) {
  setLogStore('bottomBarText', text);
}
