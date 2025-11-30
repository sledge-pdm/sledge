import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Fill: Component = () => {
  return (
    <>
      <Title>sledge. - fill</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader iconSrc='/icons/wiki/wiki_fill.png'>Fill</WikiContentHeader>
          <div class={wikiMarkdown}>
            <h2>About</h2>

            <p>Fill performs flood fill from the pointed pixel.</p>
            <div>
              <img alt='Fill tool UI' src='/wiki/tools/fill/about.png' />
            </div>

            <h2>Properties</h2>
            <h3>Threshold</h3>
            <p>Controls the color difference tolerance for flood fill.</p>
            <h4>Calculation</h4>
            <ul>
              <li>
                <code>target</code> = color of candidate pixel
              </li>
              <li>
                <code>color</code> = painting color
              </li>
              <li>
                <code>dR</code> = |color.R - target.R|
              </li>
              <li>
                <code>dG</code> = |color.G - target.G|
              </li>
              <li>
                <code>dB</code> = |color.B - target.B|
              </li>
              <li>
                If <code>dR</code>, <code>dG</code>, and <code>dB</code> are all within the threshold, fill stops; otherwise the fill continues.
              </li>
            </ul>

            <h4>Demo</h4>
            <div>
              <img alt='Fill threshold demo' src='/wiki/tools/fill/threshold_demo.gif' />
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default Fill;
