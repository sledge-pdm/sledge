import { HistoryContext, ImagePoolEntry, ImagePoolImage } from '@sledge-pdm/core';
import { FrascoLayerCommand } from '~/features/history/command/frasco/FrascoLayerCommand';
import { ImagePoolAddCommand } from '~/features/history/command/image_pool/ImagePoolAddCommand';
import { ApplySelectionFrontToBackCommand } from '~/features/history/command/selection/SelectionChangeCommand';
import { CommandLine } from '~/features/history/entry/CommandsHistoryEntry';
import { cloneEntry } from '~/features/image_pool';
import SelectionMask from '~/features/selection/SelectionMask';

const cloneSelection = (selection?: SelectionMask): SelectionMask | undefined => {
  if (!selection) return;
  const copy = new SelectionMask(selection.getWidth(), selection.getHeight());
  copy.setMask(new Uint8Array(selection.getMask()));
  return copy;
};

export function convertSelectionToImageSnippet(params: {
  entry: ImagePoolEntry;
  image: ImagePoolImage;
  index: number;
  layerId: string;
  selectionBefore?: SelectionMask;
  deleteAfter?: boolean;
}): {
  commands: CommandLine[];
  context?: HistoryContext;
} {
  const selectionChangeCommand = new ApplySelectionFrontToBackCommand({
    swapBack: cloneSelection(params.selectionBefore),
  });
  const imagePoolAddCommand = new ImagePoolAddCommand({
    entry: cloneEntry(params.entry),
    image: params.image,
    index: params.index,
  });
  const frascoCommand = params.deleteAfter
    ? new FrascoLayerCommand({
        layerId: params.layerId,
        context: { tool: 'selection' },
      })
    : undefined;

  const commands: CommandLine[] = [];
  if (frascoCommand) {
    commands.push({ command: frascoCommand });
  }
  commands.push({ command: imagePoolAddCommand });
  commands.push({ command: selectionChangeCommand });

  const context: HistoryContext = {
    icon: '/assets/icons/context_menu/convert_to_image.png',
    description: params.deleteAfter ? 'convert selection to image (cut)' : 'convert selection to image',
  };

  return { commands, context };
}
