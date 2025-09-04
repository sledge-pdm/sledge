import { flexCol } from '@sledge/core';
import { Component, createSignal, JSX, Show } from 'solid-js';
import { SectionSubHeader, SubHeaderIcon } from '~/components/section/SubHeader';
import { sectionRoot } from '~/styles/section/section_item.css';

interface Props {
  title?: string;
  defaultExpanded?: boolean;
  subHeaderIcons?: SubHeaderIcon[];
  children: JSX.Element;
}

const SectionItem: Component<Props> = (props) => {
  const [expanded, setExpanded] = createSignal(props.defaultExpanded ?? true);
  return (
    <div class={sectionRoot}>
      <SectionSubHeader defaultExpanded={expanded()} onExpandChanged={setExpanded} icons={props.subHeaderIcons}>
        {props.title}
      </SectionSubHeader>
      <Show when={expanded()}>
        <div
          class={flexCol}
          style={{
            overflow: 'visible',
          }}
        >
          {props.children}
        </div>
      </Show>
    </div>
  );
};
export default SectionItem;
