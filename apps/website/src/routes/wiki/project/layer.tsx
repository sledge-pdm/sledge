import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Layer: Component = () => {
  return (
    <>
      <Title>sledge. - layer</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_layer.png'>Layer</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <p>Layers store drawable buffers with blend properties. Operations (add/duplicate/merge/order) update history and previews.</p>

          <h2>Types &amp; properties</h2>
          <ul>
            <li>
              <strong>Types:</strong> Base, Dot (default), Image, Automate.
            </li>
            <li>
              <strong>Blend modes:</strong> normal / multiply / screen / overlay / soft light / hard light / linear light / vivid light.
            </li>
            <li>Names must be non-empty; duplicates are auto-numbered when unique names are required.</li>
          </ul>

          <h2>Base layer color</h2>
          <p>The base layer supports modes: transparent, white, black, or custom hex color. Changing it immediately updates the merged canvas.</p>

          <h2>Operations</h2>
          <ul>
            <li>
              <strong>Add / duplicate:</strong> creates a new buffer for the canvas size; duplication copies pixels and properties.
            </li>
            <li>
              <strong>Reorder:</strong> drag or command to move layers; history records the order change.
            </li>
            <li>
              <strong>Merge down:</strong> merges the current layer into the one below via the merge renderer.
            </li>
            <li>
              <strong>Visibility toggle:</strong> can be applied to multiple selected layers; keeps at least one active layer enabled.
            </li>
            <li>
              <strong>Remove / clear:</strong> cannot remove the last layer. Clear fills the buffer with transparency (optionally after confirmation).
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Layer;
