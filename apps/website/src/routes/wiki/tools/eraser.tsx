import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Eraser: Component = () => {
  return (
    <>
      <Title>sledge. - eraser</Title>
      <Portal mount={document.querySelector('#portal-root') as Node}>
        <div class={wikiContentRoot}>
          <WikiContentHeader iconSrc='/icons/wiki/wiki_eraser.png'>Eraser</WikiContentHeader>
          <div class={wikiMarkdown}>
            <h2>About</h2>

            <p>Eraser removes pixels from the current active layer.</p>
            <div>
              <img alt='Eraser tool UI' src='/wiki/tools/eraser/about.png' />
            </div>
            <blockquote>Eraser currently behaves like a transparent pen.</blockquote>

            <h2>Properties</h2>

            <h3>Size</h3>
            <p>Determines the size of the shape.</p>
            <table>
              <thead>
                <tr>
                  <th>shape</th>
                  <th>meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>square</td>
                  <td>size x 2 = length of square sides</td>
                </tr>
                <tr>
                  <td>circle</td>
                  <td>size = radius of circle</td>
                </tr>
              </tbody>
            </table>
            <p>Once used, recent sizes are remembered (up to 10 entries).</p>

            <h3>Shape</h3>
            <h4>Square</h4>
            <p>Erases a solid square.</p>
            <h4>Circle</h4>
            <p>Erases a solid circle.</p>

            <blockquote>Soft (semi-transparent) eraser is not available yet.</blockquote>
            <blockquote>Pressure-sensitive behavior is not supported yet.</blockquote>
          </div>
        </div>
      </Portal>
    </>
  );
};

export default Eraser;
