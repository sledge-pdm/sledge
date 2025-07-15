import { vars } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import { Component } from 'solid-js';
import { setActiveToolType } from '~/controllers/tool/ToolController';
import { toolConfigRow, toolConfigRowClickable } from '~/styles/section/editor/tools.css';
import { Tool, ToolType } from '~/tools/Tools';

interface Props {
  toolType: ToolType;
  tool: Tool;
  isInUse: boolean;
}

const ToolItemSub: Component<Props> = (props: Props) => {
  return (
    <div class={toolConfigRow} style={{ width: '32px', height: '32px' }} title={props.tool.familiarName}>
      <div class={toolConfigRowClickable} style={{ width: '32px', height: '32px' }} onClick={() => setActiveToolType(props.toolType)}>
        <Icon src={props.tool.iconSrc ?? ''} base={10} scale={2} color={props.isInUse ? vars.color.active : vars.color.onBackground} />
      </div>
    </div>
  );
};

export default ToolItemSub;
