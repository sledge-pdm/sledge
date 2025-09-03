import { children, Component, createEffect, JSX, onCleanup } from 'solid-js';
import SectionTag from '~/components/telling_sections/SectionTag';
import { globalStore, setGlobalStore } from '~/store/GlobalStore';
import { panel, panelInner } from '~/styles/telling_section.css';

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
