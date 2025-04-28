import { LayerHistory } from '~/types/LayerHistory';
import { layerHistoryStore, layerListStore } from '../ProjectStores';

// image
export type LayerHistoryStore = Record<string, LayerHistory>;

export const canUndo = (): boolean => layerHistoryStore[layerListStore.activeLayerId]?.undoStack.length > 0;
export const canRedo = (): boolean => layerHistoryStore[layerListStore.activeLayerId]?.redoStack.length > 0;
