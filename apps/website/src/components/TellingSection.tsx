import { css } from '@acab/ecsstatic';
import { Component, JSX, onCleanup } from 'solid-js';
import SectionTag from '~/components/SectionTag';
import { setGlobalStore } from '~/store/GlobalStore';

// Styles
const panel = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  box-sizing: border-box;
  align-items: stretch;
  gap: 12px;
`;

const panelInner = css`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: auto;
`;

interface Props {
  pageNumber: number;
  children: JSX.Element;
}

export const TellingSection: Component<Props> = (props) => {
  const sectionTagObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          console.log(e.target.textContent);
          setGlobalStore('currentTellingPage', Number(e.target.textContent));
        }
      }
    },
    { root: null, threshold: 0.55 }
  );

  onCleanup(() => {
    sectionTagObserver.disconnect();
  });

  return (
    <section class={`${panel}`}>
      <SectionTag
        index={props.pageNumber}
        ref={(el) => {
          sectionTagObserver.observe(el);
        }}
      />
      <div class={panelInner}>{props.children}</div>
    </section>
  );
};
