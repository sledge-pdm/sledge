import { toolStore } from '~/stores/EditorStores';

export const currentTool = () => toolStore.tools[toolStore.usingIndex];
