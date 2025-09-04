import { flexCol, flexRow, w100, wh100 } from '@sledge/core';
import { k12x8, pageRoot, vars, ZFB08, ZFB09 } from '@sledge/theme';
import { open } from '@tauri-apps/plugin-shell';
import { createSignal, onMount } from 'solid-js';
import { loadGlobalSettings } from '~/io/config/load';
import { getCurrentVersion } from '~/utils/VersionUtils';
import { reportWindowStartError, showMainWindow } from '~/utils/WindowUtils';
import { aaContainer, aaText, aboutLink, aboutSubTitle, aboutTitle, contentContainer } from './about.css';

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

  return (
    <div class={pageRoot}>
      <div class={`${flexRow} ${wh100}`}>
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
        <div class={`${contentContainer} ${w100}`}>
          <div class={flexRow} style={{ width: '360px' }}>
            <p class={aboutTitle}>SLEDGE.</p>
            {/* <p class={aboutDev} style={{ 'margin-top': '3px' }}>
              by alphendp
            </p> */}
          </div>
          <p class={aboutSubTitle} style={{ 'margin-right': '12px', 'margin-top': '2px', 'margin-bottom': '16px' }}>
            v{version()}
          </p>

          <div class={flexCol} style={{ 'margin-top': 'auto' }}>
            <p style={{ color: vars.color.active, 'margin-bottom': '8px' }}>fontface</p>
            <p style={{ 'margin-bottom': '8px' }}>
              <a class={aboutLink} style={{ 'font-family': ZFB09 }} onClick={(e) => openLink('http://www.04.jp.org')}>
                04b_XX
              </a>
              <span style={{ 'font-family': ZFB08, color: '#777', 'margin-left': '8px' }}>by yuji oshimoto (04.jp.org)</span>
            </p>

            <p>
              <a class={aboutLink} style={{ 'font-family': k12x8 }} onClick={(e) => openLink('https://littlelimit.net/k12x8.htm')}>
                {'k12x8 / k8x12'}
              </a>
              <span style={{ 'font-family': ZFB08, color: '#777', 'margin-left': '8px' }}>by num_kadoma (littlelimit.net)</span>
            </p>
          </div>

          <div class={flexCol} style={{ 'margin-top': '24px' }}>
            <p style={{ color: vars.color.active, 'margin-bottom': '8px' }}>link</p>
            <div class={[flexRow, w100].join(' ')} style={{ 'align-items': 'end', 'margin-bottom': '32px' }}>
              <a class={aboutLink} onClick={(e) => openLink('https://github.com/Innsbluck-rh/sledge')}>
                Source (Github)
              </a>
              <p style={{ margin: '0 4px' }}>|</p>
              <a class={aboutLink} onClick={(e) => openLink('https://www.sledge-rules.app/')}>
                website
              </a>
              <p style={{ margin: '0 4px' }}>|</p>
              <a class={aboutLink} onClick={(e) => openLink('https://www.x.com/sledge_app')}>
                twitter
              </a>
              <p style={{ margin: '0 4px' }}>|</p>
              <a class={aboutLink} onClick={(e) => openLink('https://github.com/Innsbluck-rh/sledge/blob/main/LICENSE')}>
                License (MIT)
              </a>
            </div>
          </div>
          {/* <div class={flexCol} style={{ 'margin-bottom': '36px' }}>
            <p class={aboutInspiredText}>
              inspired by:
            </p>
            <div class={flexCol} style={{ 'margin-left': '8px' }}>
              <a class={aboutLink} onClick={(e) => openLink('https://www.sojamo.de/libraries/controlP5/')}>
                ControlP5
              </a>
              <a class={aboutLink} onClick={(e) => openLink('https://archlinux.org/')}>
                ArchLinux
              </a>
              <a class={aboutLink} onClick={(e) => openLink('https://apps.apple.com/jp/app/caustic/id775735447/')}>
                Caustic3
              </a>
              <br />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default About;
