import { Component } from 'solid-js';

interface Props {
  index: number;
  ref: (el: HTMLElement) => void;
}

const SectionTag: Component<Props> = (props) => {
  return (
    <div style={{ display: 'flex', position: 'relative' }} class={'section-tag'} ref={props.ref}>
      <span>{props.index}</span>
      {/* <span>{props.tag}</span> */}
    </div>
  );
};

export default SectionTag;
