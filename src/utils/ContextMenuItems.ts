import { MenuListOption } from '@sledge-pdm/ui';
import { tryRedo, tryUndo } from '~/features/history';
import { saveProject } from '~/features/io/project/save';
import { webview } from '~/utils/platform';
import { openDevTools } from '~/utils/WindowUtils';

export const ContextMenuItems: { [key: string]: MenuListOption } = {
  DevRefresh: {
    type: 'item',
    label: '[dev] Refresh',
    icon: '/assets/icons/context_menu/refresh.png',
    onSelect: () => {
      location.reload();
    },
  },
  DevOpenDevTools: {
    type: 'item',
    label: '[dev] Open DevTools',
    icon: '/assets/icons/context_menu/devtools.png',
    onSelect: async () => {
      await openDevTools(webview.getCurrentWebview().label);
    },
  },
  Undo: {
    type: 'item',
    label: 'Undo.',
    icon: '/assets/icons/context_menu/undo.png',
    onSelect: () => {
      tryUndo();
    },
  },
  Redo: {
    type: 'item',
    label: 'Redo.',
    icon: '/assets/icons/context_menu/redo.png',
    onSelect: () => {
      tryRedo();
    },
  },
  Save: {
    type: 'item',
    label: 'Save Project.',
    icon: '/assets/icons/context_menu/save.png',
    onSelect: async () => {
      await saveProject();
    },
  },
  // BaseXxx = only label and icon. Use like: {...BaseXxx, onSelect: () => {} }
  // Registration for label+icon combinations only.
  BaseCopy: {
    type: 'item',
    label: 'Copy.',
    icon: '/assets/icons/context_menu/copy.png',
  },
  BaseCut: {
    type: 'item',
    label: 'Cut.',
    icon: '/assets/icons/context_menu/cut.png',
  },
  BasePaste: {
    type: 'item',
    label: 'Paste.',
    icon: '/assets/icons/context_menu/paste.png',
  },
  BaseRemove: {
    type: 'item',
    label: 'Remove.',
    icon: '/assets/icons/context_menu/remove.png',
  },
  BaseDuplicate: {
    type: 'item',
    label: 'Duplicate.',
    icon: '/assets/icons/context_menu/duplicate.png',
  },
  BaseClear: {
    type: 'item',
    label: 'Clear.',
    icon: '/assets/icons/context_menu/clear.png',
  },
  BaseMergeDown: {
    type: 'item',
    label: 'Merge Down.',
    icon: '/assets/icons/context_menu/merge_down.png',
  },
  BaseImageShow: {
    type: 'item',
    label: 'Show.',
    icon: '/assets/icons/context_menu/show_image.png',
  },
  BaseImageHide: {
    type: 'item',
    label: 'Hide.',
    icon: '/assets/icons/context_menu/hide_image.png',
  },
  BaseTransfer: {
    type: 'item',
    label: 'Transfer to layer.',
    icon: '/assets/icons/context_menu/transfer.png',
  },
  BaseTransferRemove: {
    type: 'item',
    label: 'Transfer and Remove.',
    icon: '/assets/icons/context_menu/transfer_and_remove.png',
  },
  BaseSelectionConvertToImage: {
    type: 'item',
    label: 'Convert to image.',
    icon: '/assets/icons/context_menu/convert_to_image.png',
  },
  BaseSelectionCopyAsImage: {
    type: 'item',
    label: 'Copy as image.',
    icon: '/assets/icons/context_menu/copy_as_image.png',
  },
  BaseInvertSelection: {
    type: 'item',
    label: 'Invert Selection.',
    icon: '/assets/icons/context_menu/invert.png',
  },
  BaseColorSelection: {
    type: 'item',
    label: 'Color Selection.',
    icon: '/assets/icons/context_menu/color_selection.png',
  },
} as const;
