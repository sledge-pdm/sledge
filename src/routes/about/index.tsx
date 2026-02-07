import { css } from '@acab/ecsstatic';
import { createSignal, onMount } from 'solid-js';
import { loadGlobalConfig } from '~/features/io/config/load';
import { ErrorTypes } from '~/features/io/project/ProjectLoader';
import { InitialLoadTypes } from '~/routes/editor/load';
import { reportInitialLoadError } from '~/routes/editor/loadError';
import { pageRoot } from '~/styles/styles';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { showMainWindow } from '~/utils/WindowUtils';
import { shell } from '~/utils/platform';
import {
  aaContainer,
  aaText,
  aboutLink,
  aboutSubTitle,
  aboutTitle,
  contentContainer,
  fontDescription,
  fontItem,
  fontSection,
  fontSectionTitle,
  fontWebsite,
  fullWidth,
  linkContainer,
  linkSection,
  rowContainer,
  titleRow,
  versionText,
} from './style';

const About = () => {
  const openLink = (url: string) => {
    shell.open(url);
  };

  const [version, setVersion] = createSignal('');

  onMount(async () => {
    try {
      await loadGlobalConfig();
      setVersion(await getCurrentVersion());
      await showMainWindow();
    } catch (e) {
      await reportInitialLoadError(InitialLoadTypes.UNKNOWN, {
        type: ErrorTypes.UNKNOWN_ERROR,
        detail: `Unknown error while about window load.\n${e}`,
        stacktrace: e instanceof Error ? e.stack : undefined,
      });
    }
  });

  // フォント固有のスタイル定義
  const zfb09Style = css`
    font-family: ZFB09;
  `;
  const zfb08Style = css`
    font-family: ZFB08;
    opacity: 0.5;
    margin-left: 8px;
  `;
  const k12x8Style = css`
    font-family: k12x8;
  `;
  const pm10Style = css`
    font-family: PM10;
    font-size: 10px;
  `;
  const terminusStyle = css`
    font-family: Terminus;
    font-size: 11px;
  `;
  const separatorStyle = css`
    margin: 0 4px;
    opacity: 0.5;
  `;

  return (
    <div class={pageRoot}>
      <div class={rowContainer}>
        <div class={aaContainer}>
          <p class={aaText}>
            ⠀⠀⠀⠀⠀⠀⠀⠀⢠⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⢀⣀⣀⣱⣠⣤⣤⣤⣤⣶⣶⣶⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⢠⢤⣴⣷⣾⣿⣿⣿⣿⣿⣿⣾⣿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠹⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣾⠁⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠹⣟⣻⠿⠿⠿⠭⢽⡿⠛⠊⠁⠁⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⠀⢣⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠱⡄⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⠀⠀⠀⠀⠀⠀⠀⠀
            <br />
            ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⠀⠀⠀⠀⠀⠀⠀
            <br />
          </p>
        </div>
        <div class={`${contentContainer} ${fullWidth}`}>
          <div class={titleRow}>
            <p class={aboutTitle}>SLEDGE.</p>
          </div>
          <p class={`${aboutSubTitle} ${versionText}`}>version {version()}</p>

          <div class={fontSection}>
            <p class={fontSectionTitle}>fontface</p>

            <p class={fontItem}>
              <a
                class={`${aboutLink} ${zfb09Style}`}
                href='http://www.04.jp.org'
                onClick={(e) => {
                  e.preventDefault();
                  openLink('http://www.04.jp.org');
                }}
              >
                04 fonts
              </a>
              <span class={fontDescription}>by yuji oshimoto</span>
              <span class={fontWebsite}>(04.jp.org)</span>
            </p>

            <p class={fontItem}>
              <a
                class={`${aboutLink} ${k12x8Style}`}
                href='https://littlelimit.net/k12x8.htm'
                onClick={(e) => {
                  e.preventDefault();
                  openLink('https://littlelimit.net/k12x8.htm');
                }}
              >
                {'k12x8 / k8x12'}
              </a>
              <span class={fontDescription}>by num_kadoma</span>
              <span class={fontWebsite}>(littlelimit.net)</span>
            </p>

            <p class={fontItem}>
              <a
                class={`${aboutLink} ${pm10Style}`}
                href='https://itouhiro.hatenablog.com/entry/20130602/font'
                onClick={(e) => {
                  e.preventDefault();
                  openLink('https://itouhiro.hatenablog.com/entry/20130602/font');
                }}
              >
                PixelMPlus
              </a>
              <span class={fontDescription}>by itouhiro</span>
              <span class={fontWebsite}>(itouhiro.hatenablog.com)</span>
            </p>

            <p class={fontItem}>
              <a
                class={`${aboutLink} ${terminusStyle}`}
                href='https://files.ax86.net/terminus-ttf/'
                onClick={(e) => {
                  e.preventDefault();
                  openLink('https://files.ax86.net/terminus-ttf/');
                }}
              >
                Terminus
              </a>
              <span class={fontDescription}>by Dimitar Zhekov</span>
            </p>
          </div>

          <div class={linkSection}>
            <p class={fontSectionTitle}>link</p>
            <div class={linkContainer}>
              <a
                class={aboutLink}
                href='https://github.com/sledge-pdm/sledge'
                onClick={(e) => {
                  e.preventDefault();
                  openLink('https://github.com/sledge-pdm/sledge');
                }}
              >
                Source (Github)
              </a>
              <p class={separatorStyle}>/</p>
              <a
                class={aboutLink}
                href='https://www.sledge-rules.app/'
                onClick={(e) => {
                  e.preventDefault();
                  openLink('https://www.sledge-rules.app/');
                }}
              >
                website
              </a>
              <p class={separatorStyle}>/</p>
              <a
                class={aboutLink}
                href='https://www.x.com/sledge_app'
                onClick={(e) => {
                  e.preventDefault();
                  openLink('https://www.x.com/sledge_app');
                }}
              >
                twitter
              </a>
              <p class={separatorStyle}>/</p>
              <a
                class={aboutLink}
                href='https://github.com/sledge-pdm/sledge/blob/main/LICENSE'
                onClick={(e) => {
                  e.preventDefault();
                  openLink('https://github.com/sledge-pdm/sledge/blob/main/LICENSE');
                }}
              >
                License
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
