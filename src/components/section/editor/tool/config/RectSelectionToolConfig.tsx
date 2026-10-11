import { Component } from 'solid-js';
import { SelectionModeSelector } from '~/components/section/editor/tool/config/SelectionModeSelector';
import ToolConfigRow from '~/components/section/editor/tool/config/ToolConfigRow';
import { flexCol } from '~/styles/styles';

const RectSelectionToolConfig: Component = () => {
  return (
    <div class={flexCol} style={{ gap: '4px' }}>
      <ToolConfigRow label='Mode'>
        <SelectionModeSelector />
      </ToolConfigRow>
    </div>
  );
};

export default RectSelectionToolConfig;
