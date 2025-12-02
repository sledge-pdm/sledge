import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Import: Component = () => {
  return (
    <>
      <Title>sledge. - import</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_import.png'>Import</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <p>
            Import creates a new project from an image when you open something that is not a <code>.sledge</code> file.
          </p>
          <ul>
            <li>Supported sources: local PNG / JPEG / WEBP, or an image in your clipboard.</li>
            <li>The canvas is resized to the image size and a single layer is created for the pixels.</li>
            <li>
              The project is marked as opened “as image E(openAs = <code>image</code>), so saving will ask for a destination.
            </li>
          </ul>

          <h2>From file</h2>
          <ol>
            <li>Choose a PNG / JPEG / WEBP file (drag-in or open from the explorer section).</li>
            <li>
              sledge clears the current selection, resizes the canvas to the file, and registers the pixel data on a new layer named after the file.
            </li>
            <li>The layer buffers and previews are regenerated immediately.</li>
          </ol>
          <p>
            If the path pointed to a <code>.sledge</code> file, sledge switches to “Open project Einstead of importing.
          </p>

          <h2>From clipboard</h2>
          <ol>
            <li>Copy an image into your clipboard.</li>
            <li>Invoke the clipboard import (e.g. start sledge with the “from clipboard Eoption or use the clipboard load command).</li>
            <li>The canvas and the first layer are rebuilt from the clipboard pixels, just like a file import.</li>
          </ol>
          <blockquote>If no readable image is found, the import is cancelled with an error log.</blockquote>
        </div>
      </div>
    </>
  );
};

export default Import;
