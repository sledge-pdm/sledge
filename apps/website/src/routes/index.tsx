import { css } from '@acab/ecsstatic';
import { Icon } from '@sledge/ui';
import { Component, JSX, Show } from 'solid-js';
import DownloadSection from '~/components/top/DownloadSection';
import Header from '~/components/top/Header';
import PageImage from '~/components/top/PageImage';
import { pageRoot } from '~/styles';
import { useReleaseData } from '~/utils/useReleaseData';

const mainText = css`
  font-size: 16px;
  font-family: ZFB21;
  text-transform: uppercase;
  margin-top: 24px;
  letter-spacing: 0px;
  line-height: 1.2;
`;

const pageImageContainer = css`
  margin-bottom: 24px;
  margin-top: 24px;
`;

const sectionContainer = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export function Home() {
  const releaseData = useReleaseData();

  return (
    <main class={pageRoot}>
      <Show when={!releaseData.isLoading()} fallback={<p>Loading...</p>}>
        <Header releaseData={releaseData} />

        <div class={pageImageContainer}>
          <PageImage />
        </div>

        <DownloadSection releaseData={releaseData} />

        <div class={sectionContainer}>
          <p class={mainText}>...is a Drawing Tool.</p>
          <div>
            <SubHeadingWithCheck>Pen, Eraser, Fill</SubHeadingWithCheck>
            <SubHeadingWithCheck>Image Import/Export (png, jpg, svg)</SubHeadingWithCheck>
            <SubHeadingWithCheck>Selection (rect, auto, lasso)</SubHeadingWithCheck>
            <SubHeadingWithCheck>Copy and paste</SubHeadingWithCheck>
            <SubHeadingWithCheck>Project Snapshots</SubHeadingWithCheck>
            <SubHeadingWithCheck>Image Effects</SubHeadingWithCheck>
            <SubHeadingWithCheck>
              <span
                class={subHeading}
                style={{
                  'letter-spacing': '2px',
                  'font-style': 'italic',
                }}
              >
                RAD
              </span>{' '}
              user interface
            </SubHeadingWithCheck>
            <SubHeadingWithX>Super Realistic brush engine</SubHeadingWithX>
            <SubHeadingWithX>Freakly Complicated UI</SubHeadingWithX>
          </div>
        </div>
      </Show>
    </main>
  );
}

const subHeading = css`
  font-family: k12x8;
  letter-spacing: 1px;
  width: 100%;
  line-height: 1.5;
  color: var(--color-on-background);
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
      <Icon src='/icons/misc/bullet_s_8.png' base={8} color={'var(--color-on-background)'} />
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
