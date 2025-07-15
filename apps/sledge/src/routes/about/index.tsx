import { flexRow, w100, wh100 } from '@sledge/core';
import { accentedButton, pageRoot } from '@sledge/theme';
import { Button } from '@sledge/ui';
import { open } from '@tauri-apps/plugin-shell';
import { aaContainer, aaText, aboutContent, aboutFeedback, aboutLink, aboutSubTitle, aboutTitle, contentContainer } from './about.css';

const About = () => {
  const openLink = (url: string) => {
    open(url);
  };

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
          <div class={`${flexRow}`} style={{ width: '360px' }}>
            <p class={aboutTitle}>SLEDGE.</p>
            {/* <p class={aboutDev} style={{ 'margin-top': '3px' }}>
              by alphendp
            </p> */}
          </div>
          <p class={aboutSubTitle} style={{ 'margin-bottom': '16px' }}>
            pre-alpha v0.1
          </p>
          <div style={{ 'margin-left': '16px' }}>
            <p class={aboutContent} style={{ 'margin-bottom': '46px' }}>
              made with much <span style={{ color: 'magenta' }}>love</span> for:
              <br />-{' '}
              <a class={aboutLink} onClick={(e) => openLink('https://www.sojamo.de/libraries/controlP5/')}>
                ControlP5
              </a>
              <br />-{' '}
              <a class={aboutLink} onClick={(e) => openLink('https://archlinux.org/')}>
                ArchLinux
              </a>
              <br />-{' '}
              <a class={aboutLink} onClick={(e) => openLink('https://apps.apple.com/jp/app/caustic/id775735447/')}>
                Caustic3
              </a>
              <br />
            </p>
          </div>
          <div class={[flexRow, w100].join(' ')} style={{ 'align-items': 'end' }}>
            <p class={aboutFeedback}>
              Feed us with your feedback.
              <br />
              全ての意見が貴重です。
            </p>
            <Button class={accentedButton} onClick={(e) => openLink('https://tally.so/r/w7jZNL')}>
              &gt;&gt; send feedback
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
