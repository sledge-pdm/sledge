import { css } from '@acab/ecsstatic';
import { Icon } from '@sledge-pdm/ui';
import { Accessor, Component } from 'solid-js';
import { HistoryEntry } from '~/features/history/entry/HistoryEntry';

const historyRowStyle = css`
  display: flex;
  box-sizing: border-box;
  height: auto;
  gap: 8px;
  align-items: center;
  overflow: hidden;
`;

const indexStyle = css`
  width: 16px;
  opacity: 0.75;
`;

const descriptionStyle = css`
  white-space: pre-line;
  text-overflow: ellipsis;
  overflow: visible;
`;

const HistoryItemRow: Component<{ undo?: boolean; action: HistoryEntry; index?: Accessor<number> | number }> = ({ action, index }) => {
  const contexts = action?.getContext?.() ?? [];
  const primary = contexts[0];
  const icon = primary?.icon ?? '/assets/icons/actions/unknown.png';
  const description = contexts.length > 0 ? contexts.map((c) => c.description).join('\n') : '<unknown>';

  return (
    <div class={historyRowStyle} title={description}>
      <p class={indexStyle}>{typeof index === 'function' ? index() : index}</p>
      <div>
        <Icon src={icon} color={'var(--color-on-background)'} base={8} scale={1} />
      </div>
      <p class={descriptionStyle}>{description}</p>
    </div>
  );
};

export default HistoryItemRow;
