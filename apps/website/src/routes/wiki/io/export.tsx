import { Title } from '@solidjs/meta';
import { Component } from 'solid-js';
import WikiContentHeader from '~/components/wiki/WikiContentHeader';
import { wikiContentRoot, wikiMarkdown } from '~/routes/wiki/styles';

const Export: Component = () => {
  return (
    <>
      <Title>sledge. - export</Title>
      <div class={wikiContentRoot}>
        <WikiContentHeader iconSrc='/icons/wiki/wiki_export.png'>Export</WikiContentHeader>
        <div class={wikiMarkdown}>
          <h2>About</h2>
          <p>Export saves the current canvas to image files. You can export the whole canvas or each layer as separate files.</p>

          <h2>Formats</h2>
          <ul>
            <li>PNG (lossless)</li>
            <li>JPEG (lossy, quality adjustable)</li>
            <li>WEBP lossy / WEBP lossless</li>
            <li>SVG (opacity outline only, limited to 128×128 or smaller)</li>
          </ul>

          <h2>Options</h2>
          <h3>Folder &amp; file name</h3>
          <p>Pick an output folder. Existing files trigger an overwrite confirmation. The file name is used as a prefix for every exported file.</p>

          <h3>Scale</h3>
          <p>Scales the output using nearest-neighbor sampling. Presets: x1 / x2 / x4 / x10 or a custom integer (1–20).</p>

          <h3>Quality</h3>
          <p>Enabled for JPEG and WEBP (lossy). PNG and WEBP (lossless) ignore the slider.</p>

          <h3>Per layer</h3>
          <p>
            When enabled, every layer is exported individually into a subfolder named after the file. Filenames become
            <code>{`{fileName}/{fileName}_{layerName}.{ext}`}</code>.
          </p>

          <h3>Show in explorer</h3>
          <p>Opens the exported location after a successful write.</p>

          <blockquote>SVG export traces only the opacity mask and fails if the canvas is larger than 128×128.</blockquote>
        </div>
      </div>
    </>
  );
};

export default Export;
