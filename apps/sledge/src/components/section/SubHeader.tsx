import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, createSignal, JSX } from 'solid-js';
import { sectionCaption } from '~/styles/section/section_item.css';

interface Props {
  // title?: string;
  defaultExpanded?: boolean;
  onExpandChanged?: (expanded: boolean) => void;
  children: JSX.Element;
}
export const SectionSubHeader: Component<Props> = (props) => {
  const [expanded, setExpanded] = createSignal(props.defaultExpanded ?? true);

  return (
    <div
      class={flexRow}
      style={{ 'align-items': 'center', 'margin-bottom': expanded() ? '8px' : '0px' }}
      onClick={() => {
        setExpanded(!expanded());

        props.onExpandChanged?.(expanded());
      }}
    >
      <svg width='0' height='0'>
        <defs>
          <clipPath id='clipPath-triangle7'>
            <path d='M 3 6 L 4 6 L 4 5 L 5 5 L 5 4 L 6 4 L 6 3 L 7 3 L 7 2 L 0 2 L 0 3 L 1 3 L 1 4 L 2 4 L 2 5 L 3 5 L 3 6 Z' fill='black' />
          </clipPath>
          <clipPath id='clipPath-triangle7-flip'>
            <path d='M 0 6 L 7 6 L 7 5 L 6 5 L 6 4 L 5 4 L 5 3 L 4 3 L 4 2 L 3 2 L 3 3 L 2 3 L 2 4 L 1 4 L 1 5 L 0 5 L 0 6 Z' fill='black' />
          </clipPath>
        </defs>
      </svg>
      <div
        class={flexRow}
        style={{
          gap: '4px',
          'align-items': 'center',
          cursor: 'pointer',
          'pointer-events': 'all',
        }}
      >
        <div
          style={{
            width: '12px',
            height: '9px',
            overflow: 'visible',
            'box-sizing': 'border-box',
            'background-color': vars.color.onBackground,
            opacity: 0.6,
            'clip-path': expanded() ? 'url(#clipPath-triangle7)' : 'url(#clipPath-triangle7-flip)',
          }}
        />
        <p class={sectionCaption} style={{ margin: 0 }}>
          {props.children}
        </p>
      </div>
      <div
        style={{
          height: '1px',
          'flex-grow': 1,
          width: '100%',
          margin: '0 8px',
          'background-color': vars.color.borderSecondary,
        }}
      />
    </div>
  );
};
