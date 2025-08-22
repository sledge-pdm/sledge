import { flexCol } from '@sledge/core';
import { Component, createSignal, JSX } from 'solid-js';
import { SectionSubHeader } from '~/components/section/SubHeader';
import { sectionRoot } from '~/styles/section/section_item.css';

interface Props {
  title?: string;
  defaultExpanded?: boolean;
  children: JSX.Element;
}

const SectionItem: Component<Props> = (props) => {
  const [expanded, setExpanded] = createSignal(props.defaultExpanded ?? true);
  return (
    <div class={sectionRoot}>
      <SectionSubHeader defaultExpanded={expanded()} onExpandChanged={setExpanded}>
        {props.title}
      </SectionSubHeader>
      <div
        class={flexCol}
        style={{
          visibility: expanded() ? 'visible' : 'collapse',
          height: expanded() ? 'auto' : '0',
          overflow: 'visible',
          'padding-right': '16px',
        }}
      >
        {props.children}
      </div>
    </div>
  );
};
export default SectionItem;
