import { css } from '@acab/ecsstatic';
import { Icon } from '@sledge/ui';
import { Accessor, Component, Show } from 'solid-js';
import { RGBAToHex } from '~/features/color';
import { BaseHistoryAction } from '~/features/history';
import { AnvilLayerHistoryAction } from '~/features/history/actions/AnvilLayerHistoryAction';
import { CanvasSizeHistoryAction } from '~/features/history/actions/CanvasSizeHistoryAction';
import { ColorHistoryAction } from '~/features/history/actions/ColorHistoryAction';
import { ImagePoolEntryPropsHistoryAction } from '~/features/history/actions/ImagePoolEntryPropsHistoryAction';
import { ImagePoolHistoryAction } from '~/features/history/actions/ImagePoolHistoryAction';
import { LayerListHistoryAction } from '~/features/history/actions/LayerListHistoryAction';
import { LayerMergeHistoryAction } from '~/features/history/actions/LayerMergeHistoryAction';
import { LayerPropsHistoryAction } from '~/features/history/actions/LayerPropsHistoryAction';
import { findLayerById } from '~/features/layer';
import { toolCategories } from '~/features/tools/Tools';

const historyRowStyle = css`
  display: flex;
  box-sizing: border-box;
  height: auto;
  gap: 8px;
  align-items: center;
  overflow: hidden;
`;

const colorIconStyle = css`
  width: 8px;
  height: 8px;
  position: relative;
  overflow: hidden;
`;

const indexStyle = css`
  width: 18px;
`;

const descriptionStyle = css`
  white-space: pre-line;
  text-overflow: ellipsis;
  overflow: visible;
`;

function getIconForTool(tool?: string) {
  if (!tool) return '';

  if (tool in toolCategories) {
    const categoryId = tool as keyof typeof toolCategories;
    return toolCategories[categoryId].iconSrc;
  }
  switch (tool) {
    case 'clear':
      return '/icons/misc/clear.png';
    case 'fx':
      return '/icons/misc/fx.png';
  }

  return '';
}

const HistoryItemRow: Component<{ undo?: boolean; action: BaseHistoryAction; index?: Accessor<number> | number }> = ({
  undo = true,
  action,
  index,
}) => {
  action = action ?? {};
  const { context } = action ?? {};
  let colorIcon:
    | {
        old: string;
        new: string;
      }
    | undefined = undefined;
  let icon = getIconForTool(context?.tool);
  let description = '';
  switch (action?.type) {
    case 'canvas_size':
      const csaction = action as CanvasSizeHistoryAction;
      const bigger = csaction.afterSize.width * csaction.afterSize.height >= csaction.beforeSize.width * csaction.beforeSize.height;
      icon = bigger ? '/icons/misc/canvas_size_bigger.png' : '/icons/misc/canvas_size_smaller.png';
      description = `${csaction.beforeSize.width}x${csaction.beforeSize.height} -> ${csaction.afterSize.width}x${csaction.afterSize.height}`;
      break;
    case 'image_pool':
      icon = '/icons/misc/image.png';
      const ipaction = action as ImagePoolHistoryAction;
      description = `${ipaction.kind} -> ${ipaction.targetEntry.fileName}`;
      break;
    case 'image_pool_entry_props':
      icon = '/icons/misc/image.png';
      const ipepaction = action as ImagePoolEntryPropsHistoryAction;
      description = `${ipepaction.newEntryProps.fileName} transform`;
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
      icon = '/icons/misc/layer.png';
      const llaction = action as LayerListHistoryAction;
      description = `${llaction.kind} / ${llaction.packedSnapshot?.layer.name}`;
      break;
    case 'layer_merge':
      icon = '/icons/misc/layer.png';
      const lmaction = action as LayerMergeHistoryAction;
      description = `Merge / ${lmaction.originPackedSnapshot?.layer.name} > ${lmaction.targetPackedSnapshot?.layer.name}`;
      break;
    case 'layer_buffer': {
      const anvilAction = action as AnvilLayerHistoryAction;
      if (context?.tool === 'fx') {
        description = `${findLayerById(anvilAction.layerId)?.name}/${context.fxName || 'unknown effect'}`;
      } else {
        const patch: any = anvilAction.patch;
        const pixels = patch.pixels
          ? `${
              patch.pixels.reduce((prev: number, pixelList: any) => {
                prev += pixelList.idx.length;
                return prev;
              }, 0) ?? 0
            } pixels`
          : '';
        const tiles = patch.tiles ? `${patch.tiles.length ?? 0} tiles` : '';
        const whole = patch.whole ? `whole` : '';
        const partial = patch.partial ? `partial(${patch.partial.boundBox.width}x${patch.partial.boundBox.height})` : '';
        description = `${findLayerById(anvilAction.layerId)?.name} / ${[pixels, tiles, whole, partial].filter(Boolean).join(' ')}`;
      }
      break;
    }
    case 'layer_props':
      icon = '/icons/misc/layer.png';
      const lpaction = action as LayerPropsHistoryAction;
      description = `${findLayerById(lpaction.layerId)?.name} ${context.propName}: ${context.before} > ${context.after}`;
      break;
    default:
      description = '<unknown>';
  }

  return (
    <div class={historyRowStyle} title={`${action.label ?? 'no label.'}\n${JSON.stringify(action.context)}`}>
      <p class={indexStyle}>{typeof index === 'function' ? index() : index}</p>
      {/* <div>
        <Icon src={undo ? '/icons/misc/undo.png' : '/icons/misc/redo.png'} color={var(--color-on-background)} base={8} scale={1} />
      </div> */}
      <Show
        when={colorIcon}
        fallback={
          <div>
            <Icon src={icon || ''} color={'var(--color-on-background)'} base={8} scale={1} />
          </div>
        }
      >
        <div class={colorIconStyle} style={{ 'background-color': colorIcon!.new }}>
          {/* <div style={{ width: '6px', height: '6px', position: 'absolute', top: 0, left: 0, 'background-color': colorIcon!.old }} />
          <div style={{ width: '6px', height: '6px', position: 'absolute', top: '2px', left: '2px', 'background-color': colorIcon!.new }} /> */}
        </div>
      </Show>
      {/* <p style={{ width: '100px', opacity: 0.75 }}>{action.type}</p> */}
      <p class={descriptionStyle}>{description}</p>
    </div>
  );
};

export default HistoryItemRow;
