import { Component } from 'solid-js';
import { SelectionModeSelector } from '~/components/section/editor/tool/config/common/SelectionModeSelector';
import ToolConfigRow from '~/components/section/editor/tool/config/common/ToolConfigRow';
import { toolConfigForm } from '~/components/section/editor/tool/config/common/ToolConfigStyles';

const RectSelectionToolConfig: Component = () => {
  return (
    <div class={toolConfigForm}>
      <ToolConfigRow label='Mode'>
        <SelectionModeSelector />
      </ToolConfigRow>
    </div>
  );
};

export default RectSelectionToolConfig;
