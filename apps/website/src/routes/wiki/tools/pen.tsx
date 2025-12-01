import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Pen: Component = () => {
  return (
    <>
      <Title>sledge. - pen</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_pen.png'>Pen</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>

          <p>Pen is a tool that puts pixels on the current active layer.</p>
          <div>
            <img alt='Pen tool UI' src='/wiki/tools/pen/about.png' />
          </div>

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
          <p>Draws a solid square.</p>
          <h4>Circle</h4>
          <p>Draws a solid circle.</p>

          <blockquote>Soft (semi-transparent) pen is not available yet.</blockquote>
          <blockquote>Pressure-sensitive size is not supported yet.</blockquote>
        </div>
      </div>
    </>
  );
};

export default Pen;
