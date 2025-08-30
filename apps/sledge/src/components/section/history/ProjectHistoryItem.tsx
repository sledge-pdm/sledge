import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component, For, onMount, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import SectionItem from '~/components/section/SectionItem';
import { BaseHistoryAction } from '~/controllers/history/actions/BaseHistoryAction';
import { ColorHistoryAction } from '~/controllers/history/actions/ColorHistoryAction';
import { ImagePoolHistoryAction } from '~/controllers/history/actions/ImagePoolHistoryAction';
import { LayerBufferHistoryAction } from '~/controllers/history/actions/LayerBufferHistoryAction';
import { LayerListHistoryAction } from '~/controllers/history/actions/LayerListHistoryAction';
import { projectHistoryController } from '~/controllers/history/ProjectHistoryController';
import { findLayerById } from '~/controllers/layer/LayerListController';
import { sectionContent } from '~/styles/section/section_item.css';
import { toolCategories } from '~/tools/Tools';
import { RGBAToHex } from '~/utils/ColorUtils';

const ProjectHistoryItem: Component = () => {
  const [historyStore, setHistoryStore] = createStore<{
    undoStack: BaseHistoryAction[];
    redoStack: BaseHistoryAction[];
  }>({
    undoStack: projectHistoryController.getUndoStack(),
    redoStack: projectHistoryController.getRedoStack(),
  });

  onMount(() => {
    setHistoryStore((prev) => {
      return {
        undoStack: projectHistoryController.getUndoStack(),
        redoStack: projectHistoryController.getRedoStack(),
      };
    });
    const dispose = projectHistoryController.onChange((state) => {
      console.log('changed!: ', projectHistoryController.getUndoStack(), projectHistoryController.getRedoStack());
      setHistoryStore((prev) => {
        return {
          undoStack: [...projectHistoryController.getUndoStack()],
          redoStack: [...projectHistoryController.getRedoStack()],
        };
      });
    });

    return () => dispose();
  });

  return (
    <SectionItem title={'project'}>
      <div class={sectionContent} style={{ gap: '4px', 'margin-bottom': '8px', 'flex-direction': 'column-reverse' }}>
        <Show when={historyStore.undoStack.length > 0} fallback={<p style={{ color: vars.color.muted }}>&lt; no undo stack &gt;</p>}>
          <For each={historyStore.undoStack}>{(action, i) => <HistoryRow undo={true} action={action} />}</For>
        </Show>

        <div class={flexRow} style={{ gap: '8px', 'align-items': 'center' }}>
          <p style={{ color: vars.color.active }}>---present---</p>
        </div>

        <Show when={historyStore.redoStack.length > 0} fallback={<p style={{ color: vars.color.muted }}>&lt; no redo stack &gt;</p>}>
          <For each={historyStore.redoStack}>{(action, i) => <HistoryRow undo={false} action={action} />}</For>
        </Show>
      </div>
    </SectionItem>
  );
};

function getIconForTool(tool?: string) {
  if (!tool) return '';

  if (tool in toolCategories) {
    const categoryId = tool as keyof typeof toolCategories;
    return toolCategories[categoryId].iconSrc;
  }
  switch (tool) {
    case 'clear':
      return 'icons/misc/clear.png';
    case 'fx':
      return 'icons/misc/fx.png';
  }

  return '';
}

const HistoryRow: Component<{ undo?: boolean; action: BaseHistoryAction }> = ({ undo = true, action }) => {
  const { context } = action;
  let colorIcon:
    | {
        old: string;
        new: string;
      }
    | undefined = undefined;
  let icon = getIconForTool(context.tool);
  let description = '';

  switch (action.type) {
    case 'image_pool':
      const ipaction = action as ImagePoolHistoryAction;
      description = `${ipaction.kind} -> ${ipaction.targetEntry.fileName}`;
      break;
    case 'color':
      const claction = action as ColorHistoryAction;
      const oldHex = `#${RGBAToHex(claction.oldColor)}`;
      const newHex = `#${RGBAToHex(claction.newColor)}`;
      description = `${oldHex} -> ${newHex}`;
      colorIcon = {
        old: oldHex,
        new: newHex,
      };
      break;
    case 'layer_list':
      const llaction = action as LayerListHistoryAction;
      description = `${llaction.kind} / ${llaction.layerSnapshot?.name}`;
      break;
    case 'layer_buffer':
      const lbaction = action as LayerBufferHistoryAction;
      if (context.tool === 'fx') {
        description = `${findLayerById(lbaction.layerId)?.name}/${context.fxName || 'unknown effect'}`;
      } else {
        description = `${findLayerById(lbaction.layerId)?.name}/${lbaction.action.diffs.size} diffs`;
      }
      break;
    default:
      description = '<unknown>';
  }

  return (
    <div class={flexRow} style={{ height: 'auto', gap: '8px', 'align-items': 'center' }} title={`${action.label}\n${JSON.stringify(action.context)}`}>
      {/* <div>
        <Icon src={undo ? 'icons/misc/undo.png' : 'icons/misc/redo.png'} color={vars.color.onBackground} base={8} scale={1} />
      </div> */}
      <Show
        when={colorIcon}
        fallback={
          <div>
            <Icon src={icon || ''} color={vars.color.onBackground} base={8} scale={1} />
          </div>
        }
      >
        <div style={{ width: '8px', height: '8px', position: 'relative', overflow: 'hidden', 'background-color': colorIcon!.new }}>
          {/* <div style={{ width: '6px', height: '6px', position: 'absolute', top: 0, left: 0, 'background-color': colorIcon!.old }} />
          <div style={{ width: '6px', height: '6px', position: 'absolute', top: '2px', left: '2px', 'background-color': colorIcon!.new }} /> */}
        </div>
      </Show>
      {/* <p style={{ width: '100px', opacity: 0.75 }}>{action.type}</p> */}
      <p style={{ width: '100%' }}>{description}</p>
    </div>
  );
};

export default ProjectHistoryItem;
