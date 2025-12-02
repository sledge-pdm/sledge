import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const SupportedFiles: Component = () => {
  return (
    <>
      <Title>sledge. - supported files</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_supported_files.png'>Supported files</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <p>Supported file types for opening/importing and exporting, plus clipboard behavior.</p>

          <h2>Open / Import</h2>
          <ul>
            <li>
              <strong>Projects:</strong> <code>.sledge</code>
            </li>
            <li>
              <strong>Images (new project):</strong> <code>.png</code>, <code>.jpg</code>/<code>.jpeg</code>, <code>.webp</code>
            </li>
            <li>
              <strong>Clipboard import:</strong> bitmap image (RGBA)
            </li>
          </ul>
          <p>
            Opening a non-<code>.sledge</code> file imports it as a new project sized to the image.
          </p>

          <h2>Export</h2>
          <ul>
            <li>
              <code>.png</code>
            </li>
            <li>
              <code>.jpg</code> (JPEG)
            </li>
            <li>
              <code>.webp</code> (lossy / lossless)
            </li>
            <li>
              <code>.svg</code> (opacity outline, canvas ≤ 128×128)
            </li>
          </ul>
          <p>Per-layer export writes one file per layer inside a subfolder named after the export file.</p>

          <h2>Image Pool import</h2>
          <ul>
            <li>
              <code>.png</code>, <code>.jpg</code>/<code>.jpeg</code>, <code>.webp</code>, <code>.gif</code>
            </li>
          </ul>
          <p>Imported images are converted to WEBP internally and can be transformed before transferring to a layer.</p>

          <h2>Clipboard operations</h2>
          <ul>
            <li>Copy selection → image data (with alpha) to clipboard.</li>
            <li>Copy layer → layer id as text (used for paste/duplicate/move across layers).</li>
            <li>Paste image → adds an Image Pool entry; paste layer id → clones or moves that layer.</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default SupportedFiles;
