import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const OnscreenControl: Component = () => {
  return (
    <>
      <Title>sledge. - onscreen control</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_onscreen_control.png'>Onscreen Control</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <p>A floating controller for pan/zoom. It mimics an analog stick and can be dragged anywhere over the UI.</p>
          <div>
            <img alt='Onscreen Control UI' src='/wiki/others/onscreen_control/about.png' />
          </div>

          <h2>Controls</h2>
          <ul>
            <li>
              <strong>Pan stick:</strong> drag inside the square to pan. It springs back to center on release.
            </li>
            <li>
              <strong>Zoom fader:</strong> drag up/down to zoom in/out. It also recenters on release.
            </li>
            <li>
              <strong>Zoom presets:</strong> tap the <code>x1 / x1.5 / x2</code> indicator in the title bar to change the controller scale.
            </li>
          </ul>

          <h2>Window handling</h2>
          <ul>
            <li>Drag the title bar to move the controller. The lock icon freezes/unfreezes its position.</li>
            <li>The close icon hides the controller (toggle again via F6 or the canvas control menu).</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default OnscreenControl;
