import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const HowToInstall: Component = () => {
  return (
    <>
      <Title>sledge. - how to install</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader>How To Install</WikiContentHeader>
          <div class={wikiMarkdown}>
            <h2>Windows</h2>
            <ol>
              <li>
                Visit <a href='https://www.sledge-rules.app/'>sledge-rules.app</a> and download the installer.
                <div>
                  <img width={400} alt='sledge-rules download' src='/wiki/introduction/how_to_install/windows_1.png' />
                </div>
              </li>
              <li>
                Run the downloaded installer file.
                <div>
                  <img width={400} alt='running installer' src='/wiki/introduction/how_to_install/windows_2.png' />
                </div>
              </li>
              <li>Complete the setup wizard. Check “Run sledge” to launch immediately after installation.</li>
            </ol>

            <details>
              <summary>Windows Defender warning?</summary>
              <br />
              <p>If Windows Defender SmartScreen blocks the installer, click “More info” and then “Run anyway”.</p>
              <img width={300} alt='Windows Defender block' src='/wiki/introduction/how_to_install/defender_warning_1.png' />
              <img width={300} alt='Windows Defender run anyway' src='/wiki/introduction/how_to_install/defender_warning_2.png' />
            </details>

            <h2>macOS</h2>
            <ol>
              <li>
                Visit <a href='https://www.sledge-rules.app/'>sledge-rules.app</a> and download the installer (`.dmg`).
              </li>
              <li>Open the downloaded `.dmg` and drag sledge into the Applications folder.</li>
              <li>
                Allow running the app from System Settings (Gatekeeper). sledge is not notarized yet, so you may need to allow it manually.{' '}
                <a href='https://support.apple.com/en-us/102445'>See Apple Support</a> for the exact steps.
              </li>
              <li>Launch sledge from Applications.</li>
            </ol>

            <h2>Linux</h2>
            <blockquote>Running sledge with sudo is not recommended; some features will not work.</blockquote>

            <h3>Arch Linux</h3>
            <ol>
              <li>
                Install from AUR: <code>yay -S sledge</code>.
              </li>
              <li>
                Run <code>sledge</code> to launch.
              </li>
            </ol>

            <h3>Other distros</h3>
            <ol>
              <li>
                Download the installer from <a href='https://www.sledge-rules.app/'>sledge-rules.app</a>. Packages are available as `.rpm` and
                `.deb`—pick the format your distro supports.
              </li>
              <li>Install the downloaded package.</li>
              <li>
                Run <code>sledge</code> to launch.
              </li>
            </ol>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default HowToInstall;
