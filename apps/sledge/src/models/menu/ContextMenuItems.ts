import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getActiveAgent } from '~/controllers/layer/LayerAgentManager';
import { saveProject } from '~/io/project/out/save';
import { openDevTools } from '~/utils/WindowUtils';

export const ContextMenuItems = {
  DevRefresh: {
    label: '[dev] Refresh',
    icon: '/icons/misc/refresh.png',
    onSelect: () => {
      location.reload();
    },
  },
  DevOpenDevTools: {
    label: '[dev] Open DevTools',
    icon: '/icons/misc/devtools.png',
    onSelect: async () => {
      await openDevTools(getCurrentWebview().label);
    },
  },
  Undo: {
    label: 'Undo',
    icon: '/icons/misc/undo.png',
    onSelect: () => {
      getActiveAgent()?.undo();
    },
  },
  Redo: {
    label: 'Redo',
    icon: '/icons/misc/redo.png',
    onSelect: () => {
      getActiveAgent()?.redo();
    },
  },
  Save: {
    label: 'Save Project',
    icon: '/icons/misc/save.png',
    onSelect: () => {
      saveProject();
    },
  },
  // BaseXxx = only label and icon. use like: {...BaseXxx, onSelect: () => {} }
  // ラベルとアイコンの組み合わせの登録のみ
  BaseRemove: {
    label: 'Remove',
    icon: '/icons/misc/remove.png',
  },
  BaseDuplicate: {
    label: 'Duplicate',
    icon: '/icons/misc/duplicate.png',
  },
  BaseClear: {
    label: 'Clear',
    icon: '/icons/misc/clear.png',
  },
  BaseTransfer: {
    label: 'Transfer',
    icon: '/icons/misc/transfer.png',
  },
  BaseTransferRemove: {
    label: 'Transfer and Remove',
    icon: '/icons/misc/transfer_and_remove.png',
  },
};
