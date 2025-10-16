import { css } from '@acab/ecsstatic';
import { Icon } from '@sledge/ui';
import { Component, JSX } from 'solid-js';
import DownloadSection from '~/components/DownloadSection';
import { pageRoot } from '~/styles';

const mainText = css`
  font-size: 16px;
  font-family: k12x8;
  margin-top: 24px;
  margin-bottom: 8px;
  letter-spacing: 0px;
`;

export function About() {
  return (
    <main class={pageRoot}>
      <DownloadSection />

      <p class={mainText}>sledge is a drawing tool.</p>
      <div>
        <SubHeadingWithCheck>Pen, Eraser, Fill</SubHeadingWithCheck>
        <SubHeadingWithCheck>Image Import/Export (png, jpg, svg)</SubHeadingWithCheck>
        <SubHeadingWithCheck>Area Selection (rect, auto) / copy and paste</SubHeadingWithCheck>
        <SubHeadingWithCheck>Light-weight project backup</SubHeadingWithCheck>
        <SubHeadingWithCheck>Image FX</SubHeadingWithCheck>
        <SubHeadingWithX>Super Realistic brush engine</SubHeadingWithX>
        <SubHeadingWithX>Freakly Complicated UI</SubHeadingWithX>
      </div>
    </main>
  );
}

const subHeading = css`
  font-family: k12x8;
  letter-spacing: 1px;
  width: 100%;
  line-height: 1.5;
  color: var(--color-on-background);
  opacity: 0.95;
  vertical-align: middle;
  user-select: text;
  @media (max-width: 599px) {
    font-size: 8px;
  }
`;

const subHeadingContainer = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const SubHeadingWithDot: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  return (
    <div class={subHeadingContainer}>
      <Icon src='/icons/misc/dot.png' base={8} color={'var(--color-on-background)'} />
      <p class={subHeading} {...props}>
        {props.children}
      </p>
    </div>
  );
};

const SubHeadingWithCheck: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  return (
    <div class={subHeadingContainer}>
      <Icon src='/icons/misc/check_8.png' base={8} color={'var(--color-enabled)'} />
      <p class={subHeading} {...props}>
        {props.children}
      </p>
    </div>
  );
};

const SubHeadingWithX: Component<JSX.HTMLAttributes<HTMLParagraphElement>> = (props) => {
  return (
    <div class={subHeadingContainer}>
      <Icon src='/icons/misc/remove.png' base={8} color={'var(--color-error)'} />
      <p class={subHeading} {...props}>
        {props.children}
      </p>
    </div>
  );
};
