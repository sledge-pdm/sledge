import { css } from '@acab/ecsstatic';
import { RouteSectionProps } from '@solidjs/router';
import { Component } from 'solid-js';
import WikiSection from '~/components/wiki/WikiSection';
import WikiSectionItem from '~/components/wiki/WikiSectionItem';
import { pageRoot } from '~/styles';

const titleContainer = css`
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
`;
const title = css`
  font-family: ZFB31;
  letter-spacing: 0px;
  font-size: 36px;
  overflow: hidden;
  overflow-wrap: break-word;
  text-decoration: none;
  width: fit-content;
`;

const WikiWrapper: Component<RouteSectionProps> = (props) => {
  return (
    <main class={pageRoot}>
      <div class={titleContainer}>
        {/* <p class={clsx(title, titleDimmed)}>
          <a class={clsx(title, titleDimmed)} href='/' title='back to home.'>
            SLEDGE
          </a>
          /
        </p> */}
        <a class={title} href='/wiki'>
          WIKI
        </a>
      </div>
      {/* <p>Welcome to the sledge wiki!</p> */}

      <WikiSection title='introduction'>
        <WikiSectionItem title='Get Started' href='/wiki/introduction/get_started' hrefAlt={['/wiki']} />
        <WikiSectionItem title='How To Install' href='/wiki/introduction/how_to_install' />
      </WikiSection>

      <WikiSection title='tools'>
        <WikiSectionItem title='Pen' href='/wiki/tools/pen' iconSrc='/icons/wiki/wiki_pen.png' />
        <WikiSectionItem title='Eraser' href='/wiki/tools/eraser' iconSrc='/icons/wiki/wiki_eraser.png' />
        <WikiSectionItem title='Fill' href='/wiki/tools/fill' iconSrc='/icons/wiki/wiki_fill.png' />
        <WikiSectionItem title='Selections' href='/wiki/tools/selections' iconSrc='/icons/wiki/wiki_selections.png' />
        <WikiSectionItem title='Move' href='/wiki/tools/move' iconSrc='/icons/wiki/wiki_move.png' />
      </WikiSection>

      <WikiSection title='Project'>
        <WikiSectionItem title='Canvas' href='/wiki/project/canvas' iconSrc='/icons/wiki/wiki_canvas.png' />
        <WikiSectionItem title='Layer' href='/wiki/project/layer' iconSrc='/icons/wiki/wiki_layer.png' />
        <WikiSectionItem title='Image Pool' href='/wiki/project/image' iconSrc='/icons/wiki/wiki_image_pool.png' />
        <WikiSectionItem title='Effects' href='/wiki/project/effects' iconSrc='/icons/wiki/wiki_effects.png' />
      </WikiSection>

      <WikiSection title='I/O'>
        <WikiSectionItem title='Supported files' href='/wiki/io/supported_files' iconSrc='/icons/wiki/wiki_supported_files.png' />
        <WikiSectionItem title='Import' href='/wiki/io/import' iconSrc='/icons/wiki/wiki_import.png' />
        <WikiSectionItem title='Export' href='/wiki/io/export' iconSrc='/icons/wiki/wiki_export.png' />
        <WikiSectionItem title='Clipboard' href='/wiki/io/clipboard' iconSrc='/icons/wiki/wiki_clipboard.png' />
      </WikiSection>

      <WikiSection title='Others'>
        <WikiSectionItem title='Onscreen Control' href='/wiki/others/onscreen_control' iconSrc='/icons/wiki/wiki_onscreen_control.png' />
      </WikiSection>
      {props.children}
    </main>
  );
};

export default WikiWrapper;
