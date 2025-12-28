import { css } from '@acab/ecsstatic';
import { Component, createSignal, JSX, Show } from 'solid-js';
import { SectionSubHeader, SubHeaderIcon } from '~/components/section/SubHeader';
import { sectionRoot } from './SectionStyles';

const sectionContent = css`
  display: flex;
  flex-direction: column;
  overflow: visible;
`;

interface Props {
  title?: string;
  expandable?: boolean;
  defaultExpanded?: boolean;
  subHeaderIcons?: SubHeaderIcon[];
  children: JSX.Element;
}

const SectionItem: Component<Props> = (props) => {
  const [expanded, setExpanded] = createSignal(props.defaultExpanded ?? true);
  return (
    <div class={sectionRoot}>
      <SectionSubHeader expandable={props.expandable} defaultExpanded={expanded()} onExpandChanged={setExpanded} icons={props.subHeaderIcons}>
        {props.title}
      </SectionSubHeader>
      <Show when={expanded()}>
        <div class={sectionContent}>{props.children}</div>
      </Show>
    </div>
  );
};
export default SectionItem;
