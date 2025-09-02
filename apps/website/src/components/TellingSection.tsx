import { Component, JSX } from 'solid-js';
import { panel, panelInner } from '~/routes/telling/telling.css';

interface Props {
  children: JSX.ArrayElement;
  attachPanelRef: (el: HTMLElement) => void;
}

export const TellingSection: Component<Props> = (props) => {
  return (
    <section class={`${panel}`}>
      <div class={panelInner}>{props.children}</div>
    </section>
  );
};
