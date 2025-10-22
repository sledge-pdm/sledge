import { MenuListOption } from '@sledge/ui';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { projectHistoryController } from '~/features/history';
import { saveProject } from '~/features/io/project/out/save';
import { openDevTools } from '~/utils/WindowUtils';

export const ContextMenuItems: { [key: string]: MenuListOption } = {
  DevRefresh: {
    type: 'item',
    label: '[dev] Refresh',
    icon: '/icons/context_menu/refresh.png',
    onSelect: () => {
      location.reload();
    },
  },
  DevOpenDevTools: {
    type: 'item',
    label: '[dev] Open DevTools',
    icon: '/icons/context_menu/devtools.png',
    onSelect: async () => {
      await openDevTools(getCurrentWebview().label);
    },
  },
  Undo: {
    type: 'item',
    label: 'Undo',
    icon: '/icons/context_menu/undo.png',
    onSelect: () => {
      projectHistoryController.undo();
    },
  },
  Redo: {
    type: 'item',
    label: 'Redo',
    icon: '/icons/context_menu/redo.png',
    onSelect: () => {
      projectHistoryController.redo();
    },
  },
  Save: {
    type: 'item',
    label: 'Save Project',
    icon: '/icons/context_menu/save.png',
    onSelect: async () => {
      await saveProject();
    },
  },
  // BaseXxx = only label and icon. Use like: {...BaseXxx, onSelect: () => {} }
  // Registration for label+icon combinations only.
  BaseRemove: {
    type: 'item',
    label: 'Remove',
    icon: '/icons/context_menu/remove.png',
  },
  BaseDuplicate: {
    type: 'item',
    label: 'Duplicate',
    icon: '/icons/context_menu/duplicate.png',
  },
  BaseClear: {
    type: 'item',
    label: 'Clear',
    icon: '/icons/context_menu/clear.png',
  },
  BaseMergeDown: {
    type: 'item',
    label: 'Merge Down',
    icon: '/icons/context_menu/merge_down.png',
  },
  BaseImageShow: {
    type: 'item',
    label: 'Show',
    icon: '/icons/context_menu/show_image.png',
  },
  BaseImageHide: {
    type: 'item',
    label: 'Hide',
    icon: '/icons/context_menu/hide_image.png',
  },
  BaseTransfer: {
    type: 'item',
    label: 'Transfer to layer',
    icon: '/icons/context_menu/transfer.png',
  },
  BaseTransferRemove: {
    type: 'item',
    label: 'Transfer and Remove',
    icon: '/icons/context_menu/transfer_and_remove.png',
  },
};
