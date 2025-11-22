import { css } from '@acab/ecsstatic';
import { Show } from 'solid-js';
import { subHeading, SubHeadingWithCheck, SubHeadingWithX } from '~/components/SubHeadings';
import DownloadSection from '~/components/top/DownloadSection';
import Header, { SubTitleWithReleaseData } from '~/components/top/Header';
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
    </main>
  );
}
