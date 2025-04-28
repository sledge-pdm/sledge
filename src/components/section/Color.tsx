import { Component, For } from 'solid-js';
import ColorPicker from '~/components/section/item/ColorPicker';
import ColorBox from '../common/ColorBox';
import Palette from './item/Palette';

import { setCurrentColor } from '~/controllers/color/ColorController';
import { colorStore } from '~/stores/EditorStores';
import { swatchContainer } from '~/styles/section/color.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/section_global.css';
import { flexCol } from '~/styles/snippets.css';

const Color: Component = () => {
  const onColorClicked = (color: string, index: number) => {
    setCurrentColor(color);
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>color.</p>
      <div class={sectionContent} style={{ 'flex-direction': 'row', margin: '8px 0' }}>
        <div class={swatchContainer}>
          <For each={colorStore.swatches}>
            {(item, index) => (
              <ColorBox
                color={item}
                sizePx={8}
                onClick={(color) => onColorClicked(color, index())}
                enableUsingSelection={true}
              />
            )}
          </For>
        </div>
        {/* <div class={descriptionContainer}>
          <p class={colorElemDescription}>picker.</p>
        </div> */}
        <div class={flexCol}>
          <ColorPicker width={150} />
          <Palette />
        </div>
      </div>
    </div>
  );
};

export default Color;
