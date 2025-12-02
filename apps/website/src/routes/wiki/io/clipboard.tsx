import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Clipboard: Component = () => {
  return (
    <>
      <Title>sledge. - clipboard</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc={'/icons/wiki/wiki_clipboard.png'}>Clipboard</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <p>
            sledge listens to <code>copy</code> / <code>cut</code> / <code>paste</code> while the canvas is focused. Operations are skipped when a
            text input is focused.
          </p>

          <h2>Copy</h2>
          <ul>
            <li>
              With a selection: copies the selected pixels as an image (RGBA). The selection bounds are stored so a later paste can be positioned at
              the same spot.
            </li>
            <li>Without a selection: copies the active layer id as text. This is used for layer duplication/move via paste.</li>
          </ul>

          <h2>Cut</h2>
          <ul>
            <li>Runs the same copy logic.</li>
            <li>If a selection exists, the selected area is cleared (history recorded).</li>
            <li>
              If no selection, the active layer is marked as <code>cutFreeze</code> so it can be moved to a new layer on paste.
            </li>
          </ul>

          <h2>Paste</h2>
          <ol>
            <li>
              Checks clipboard text first. If it matches a layer id, the layer is duplicated into the active stack. A previously cut layer is moved
              (with history) instead of cloned.
            </li>
            <li>
              If no text layer id is found, tries to read an image. Successful reads create an Image Pool entry (named “[ from clipboard ] E) placed
              at the last copied position when available.
            </li>
            <li>If nothing is readable, an error is shown.</li>
          </ol>
          <blockquote>Pasting while a selection exists cancels the selection before inserting the new content.</blockquote>
        </div>
      </div>
    </>
  );
};

export default Clipboard;
