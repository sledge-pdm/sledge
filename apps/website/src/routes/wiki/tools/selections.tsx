import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Selections: Component = () => {
  return (
    <>
      <Title>sledge. - selections</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_selections.png'>Selections</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <p>
            Selections define a mask for editing or moving pixels. Drawing can be limited to inside/outside the mask, and the mask can be moved as a
            floating buffer.
          </p>
          <div>
            <img alt='Selections tool UI' src='/wiki/tools/selections/about.png' />
          </div>
          <p>Tools:</p>
          <ul>
            <li>
              <strong>Rect Selection:</strong> drag to create a rectangle.
            </li>
            <li>
              <strong>Auto Selection:</strong> click to flood-select similar colors. Threshold comes from the active preset.
            </li>
            <li>
              <strong>Lasso Selection:</strong> freehand polygon. Uses a filled mask for small canvases; switches to outline rendering for large ones.
              Fill mode can be non-zero or even-odd per preset.
            </li>
          </ul>

          <h2>Edit modes</h2>
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Trigger</th>
                <th>Behavior</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>replace</td>
                <td>default</td>
                <td>Creates a new mask.</td>
              </tr>
              <tr>
                <td>add</td>
                <td>
                  <code>Shift</code>
                </td>
                <td>Adds to the existing mask.</td>
              </tr>
              <tr>
                <td>subtract</td>
                <td>
                  <code>Alt</code>
                </td>
                <td>Subtracts from the existing mask.</td>
              </tr>
              <tr>
                <td>move</td>
                <td>
                  <code>Ctrl</code>
                </td>
                <td>Moves the mask (offset only, no shape change).</td>
              </tr>
            </tbody>
          </table>

          <h2>Properties</h2>
          <h3>threshold (Auto)</h3>
          <p>
            Color difference tolerance for flood selection. Default: <code>0</code>.
          </p>

          <h3>fill mode (Lasso)</h3>
          <p>
            Fill rule for the polygon mask. Options: <code>nonzero</code> (default) or <code>evenodd</code>.
          </p>
        </div>
      </div>
    </>
  );
};

export default Selections;
