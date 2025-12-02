import { css } from '@acab/ecsstatic';
import { clsx } from '@sledge/core';
import { Title } from '@solidjs/meta';
import { Show } from 'solid-js';
import BorderBackground from '~/components/BorderBackground';
import { subHeading, SubHeadingWithCheck, SubHeadingWithX } from '~/components/SubHeadings';
import DownloadSection from '~/components/top/DownloadSection';
import Header, { SubTitleWithReleaseData } from '~/components/top/Header';
import PageImage from '~/components/top/PageImage';
import { pageRoot, simpleScrollbar } from '~/styles';
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
const content = css`
  display: flex;
  flex-direction: column;
  width: 500px;
  box-sizing: content-box;
  border-right: 1px solid var(--color-border);
  padding: 48px 48px 80px 56px;
  overflow-y: auto;
`;
const rest = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  flex-grow: 1;
  overflow-y: auto;
`;

export function Home() {
  const releaseData = useReleaseData();

  return (
    <>
      <Title>sledge.</Title>
      <main class={pageRoot}>
        <div class={clsx(content, simpleScrollbar)}>
          <Show when={!releaseData.isLoading()} fallback={<p>Loading...</p>}>
            <Header subTitle={SubTitleWithReleaseData(releaseData)} />

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
        </div>
        <div class={rest}>
          <BorderBackground />
        </div>
      </main>
    </>
  );
}
