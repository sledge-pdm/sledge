import { css } from '@acab/ecsstatic';
import { createScrollPosition } from '@solid-primitives/scroll';
import { createEffect, createSignal, JSX, Show } from 'solid-js';

const containerStyle = css`
  position: relative;
  flex-grow: 1;
`;

const fadeTopStyle = css`
  pointer-events: none;
  position: absolute;
  left: 0;
  width: 100%;
  height: 40px;
  z-index: var(--zindex-side-section-fade);
  top: 0;
  background: linear-gradient(to bottom, var(--color-background), transparent);
`;

const fadeBottomStyle = css`
  pointer-events: none;
  position: absolute;
  left: 0;
  width: 100%;
  height: 40px;
  z-index: var(--zindex-side-section-fade);
  bottom: 0;
  background: linear-gradient(to top, var(--color-background), transparent);
`;

interface Props {
  children: JSX.Element;
  class?: string;
  style?: JSX.CSSProperties;
  ref?: (el: HTMLDivElement) => void;
}

export default function ScrollFadeContainer(props: Props) {
  let scrollRef: HTMLDivElement | undefined;
  const scroll = createScrollPosition(() => scrollRef);

  const [canScrollTop, setCanScrollTop] = createSignal(false);
  const [canScrollBottom, setCanScrollBottom] = createSignal(false);

  createEffect(() => {
    if (scrollRef) {
      setCanScrollTop(scroll.y > 0);
      setCanScrollBottom(scroll.y + scrollRef.clientHeight < scrollRef.scrollHeight);
    }
  });

  return (
    <div class={containerStyle} style={props.style}>
      <div
        ref={(el) => {
          scrollRef = el;
          if (props.ref) props.ref(el);
        }}
        class={props.class}
      >
        {props.children}
      </div>

      <Show when={canScrollTop()}>
        <div class={fadeTopStyle} />
      </Show>

      <Show when={canScrollBottom()}>
        <div class={fadeBottomStyle} />
      </Show>
    </div>
  );
}
