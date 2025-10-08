import { css } from '@acab/ecsstatic';
import { open } from '@tauri-apps/plugin-shell';
import { createSignal, onMount } from 'solid-js';
import { loadGlobalSettings } from '~/io/config/load';
import { pageRoot } from '~/styles/StyleSnippets';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';
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
  fullWidth,
  linkContainer,
  linkSection,
  rowContainer,
  titleRow,
  versionText,
} from './style';

const About = () => {
  const openLink = (url: string) => {
    open(url);
  };

  const [version, setVersion] = createSignal('');

  onMount(async () => {
    try {
      await loadGlobalSettings();
      setVersion(await getCurrentVersion());
      await showMainWindow();
    } catch (e) {
      await reportWindowStartError(e);
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
          <p class={`${aboutSubTitle} ${versionText}`}>v{version()}</p>

          <div class={fontSection}>
            <p class={fontSectionTitle}>fontface</p>

            <p class={fontItem}>
              <a class={`${aboutLink} ${zfb09Style}`} onClick={(e) => openLink('http://www.04.jp.org')}>
                04b_XX
              </a>
              <span class={fontDescription}>by yuji oshimoto (04.jp.org)</span>
            </p>

            <p class={fontItem}>
              <a class={`${aboutLink} ${k12x8Style}`} onClick={(e) => openLink('https://littlelimit.net/k12x8.htm')}>
                {'k12x8 / k8x12'}
              </a>
              <span class={fontDescription}>by num_kadoma (littlelimit.net)</span>
            </p>

            <p class={fontItem}>
              <a class={`${aboutLink} ${pm10Style}`} onClick={(e) => openLink('https://itouhiro.hatenablog.com/entry/20130602/font')}>
                PixelMPlus
              </a>
              <span class={fontDescription}>by itouhiro (itouhiro.hatenablog.com)</span>
            </p>

            <p class={fontItem}>
              <a class={`${aboutLink} ${terminusStyle}`} onClick={(e) => openLink('https://files.ax86.net/terminus-ttf/')}>
                Terminus
              </a>
              <span class={fontDescription}>by Dimitar Zhekov</span>
            </p>
          </div>

          <div class={linkSection}>
            <p class={fontSectionTitle}>link</p>
            <div class={linkContainer}>
              <a class={aboutLink} onClick={(e) => openLink('https://github.com/sledge-pdm/sledge')}>
                Source (Github)
              </a>
              <p class={separatorStyle}>|</p>
              <a class={aboutLink} onClick={(e) => openLink('https://www.sledge-rules.app/')}>
                website
              </a>
              <p class={separatorStyle}>|</p>
              <a class={aboutLink} onClick={(e) => openLink('https://www.x.com/sledge_app')}>
                twitter
              </a>
              <p class={separatorStyle}>|</p>
              <a class={aboutLink} onClick={(e) => openLink('https://github.com/sledge-pdm/sledge/blob/main/LICENSE')}>
                License (MIT)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
