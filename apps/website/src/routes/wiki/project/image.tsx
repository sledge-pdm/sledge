import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const ImagePool: Component = () => {
  return (
    <>
      <Title>sledge. - image pool</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_image_pool.png'>Image Pool</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <p>
            The Image Pool keeps imported images as reusable entries. Each entry is a WEBP buffer with transform info (position, scale, rotation,
            flip, opacity).
          </p>

          <h2>Add images</h2>
          <ul>
            <li>
              <strong>From files:</strong> PNG / JPG / WEBP / GIF via the import dialog or explorer context menu.
            </li>
            <li>
              <strong>From clipboard / selection:</strong> Clipboard paste or “copy to image Eadds an entry; selection export stores the bounding box.
            </li>
            <li>Entries are auto-scaled to fit the canvas when needed. Description names are taken from the source path or clipboard marker.</li>
          </ul>

          <h2>Work with entries</h2>
          <ul>
            <li>
              Select an entry to edit its transform: position (x, y), scaleX / scaleY, rotation (normalized), flipX / flipY, opacity, visibility.
            </li>
            <li>Visibility toggles do not delete the entry; hide/show only affects preview and transfer.</li>
            <li>Removing an entry records history and deselects it; deletion is blocked when nothing is selected.</li>
          </ul>

          <h2>Transfer to layer</h2>
          <p>
            “Transfer to active layer Ecopies the entry pixels to the active layer using nearest-neighbor sampling, respecting
            transform/flip/rotation.
          </p>
          <ul>
            <li>Offsets are rounded to integers; scales are adjusted to integer output sizes to avoid artifacts.</li>
            <li>After transfer, history and previews are updated. You can optionally remove the entry after transfer.</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default ImagePool;
