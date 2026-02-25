import { ImagePoolEntry } from '@sledge-pdm/core';
import { MenuListOption, showContextMenu } from '@sledge-pdm/ui';
import { ContextMenuItems } from '~/utils/ContextMenuItems';
import { hideEntry, removeEntry, showEntry } from './entryActions';
import { transferToCurrentLayer } from './transferActions';

export interface BuildImagePoolEntryMenuOptions {
  onHide?: () => void;
  onShow?: () => void;
}

const getImagePoolEntryLabel = (entry: ImagePoolEntry): string => {
  let label = entry.descriptionName ?? '[ unknown ]';
  if (!entry.visible) label += ' (hidden)';
  return label;
};

export const buildImagePoolEntryContextMenu = (
  entry: ImagePoolEntry,
  options?: BuildImagePoolEntryMenuOptions
): Parameters<typeof showContextMenu>[0] => {
  const showHideItem: MenuListOption = entry.visible
    ? {
        ...ContextMenuItems.BaseImageHide,
        onSelect: () => {
          hideEntry(entry.id);
          options?.onHide?.();
        },
      }
    : {
        ...ContextMenuItems.BaseImageShow,
        onSelect: () => {
          showEntry(entry.id);
          options?.onShow?.();
        },
      };

  return [
    { type: 'label', label: getImagePoolEntryLabel(entry) },
    showHideItem,
    {
      ...ContextMenuItems.BaseTransfer,
      onSelect: () => transferToCurrentLayer(entry.id, false),
    },
    {
      ...ContextMenuItems.BaseTransferRemove,
      onSelect: () => transferToCurrentLayer(entry.id, true),
    },
    {
      ...ContextMenuItems.BaseRemove,
      label: 'Remove from pool',
      onSelect: () => removeEntry(entry.id),
    },
  ];
};
