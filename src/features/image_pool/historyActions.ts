import { HistoryContext, ImagePoolEntry, ImagePoolImage } from '@sledge-pdm/core';
import { historyManager } from '~/features/history';
import { FrascoLayerCommand, ImagePoolAddCommand, ImagePoolPropsCommand, ImagePoolRemoveCommand } from '~/features/history/commands';
import { CommandsHistoryEntry } from '~/features/history/entry/CommandsHistoryEntry';
import { cloneEntry } from './service';

const isSameEntryProps = (a: ImagePoolEntry, b: ImagePoolEntry): boolean => {
  if (a.id !== b.id) return false;
  if (a.opacity !== b.opacity) return false;
  if (a.visible !== b.visible) return false;
  if ((a.descriptionName ?? '') !== (b.descriptionName ?? '')) return false;
  if (a.base.width !== b.base.width || a.base.height !== b.base.height) return false;
  if (
    a.transform.x !== b.transform.x ||
    a.transform.y !== b.transform.y ||
    a.transform.scaleX !== b.transform.scaleX ||
    a.transform.scaleY !== b.transform.scaleY ||
    a.transform.rotation !== b.transform.rotation ||
    a.transform.flipX !== b.transform.flipX ||
    a.transform.flipY !== b.transform.flipY
  ) {
    return false;
  }
  return true;
};

export function registerImagePoolAddHistory(entry: ImagePoolEntry, image: ImagePoolImage, index: number) {
  historyManager.addEntry(
    new CommandsHistoryEntry(
      new ImagePoolAddCommand({
        entry: cloneEntry(entry),
        image,
        index,
      })
    )
  );
}

export function registerImagePoolRemoveHistory(entry: ImagePoolEntry, image: ImagePoolImage | undefined, index: number) {
  historyManager.addEntry(
    new CommandsHistoryEntry(
      new ImagePoolRemoveCommand({
        entry: cloneEntry(entry),
        image,
        index,
      })
    )
  );
}

export function registerEntryUpdate(id: string, before: ImagePoolEntry, after: ImagePoolEntry, options?: { context?: HistoryContext }) {
  if (isSameEntryProps(before, after)) return;

  historyManager.addEntry(
    new CommandsHistoryEntry(
      new ImagePoolPropsCommand({
        entryId: id,
        before,
        after,
      }),
      options?.context
    )
  );
}

export function registerTransferHistory(layerId: string) {
  historyManager.addEntry(
    new CommandsHistoryEntry(
      new FrascoLayerCommand({
        layerId,
        context: { tool: 'image' },
      })
    )
  );
}
