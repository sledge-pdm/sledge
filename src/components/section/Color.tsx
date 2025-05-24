import { Component, For } from 'solid-js';
import ColorPicker from '~/components/section/item/ColorPicker';
import ColorBox from '../common/ColorBox';

import Palette from '~/components/section/item/Palette';
import { currentColor, setCurrentColor } from '~/controllers/color/ColorController';
import { colorStore } from '~/stores/EditorStores';
import { vars, ZFB11 } from '~/styles/global.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/globals/section_global.css';
import { swatchContainer } from '~/styles/section/color.css';
import { flexCol, flexRow } from '~/styles/snippets.css';

const Color: Component = () => {
  let hexInputRef: HTMLInputElement;

  const onColorClicked = (color: string, index: number) => {
    setCurrentColor(color);
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>color.</p>
      <div class={sectionContent} style={{ 'flex-direction': 'row', margin: '8px 0' }}>
        <div class={swatchContainer}>
          <For each={colorStore.swatches}>
            {(item, index) => <ColorBox color={item} sizePx={8} onClick={(color) => onColorClicked(color, index())} enableUsingSelection={true} />}
          </For>
        </div>
        {/* <div class={descriptionContainer}>
          <p class={colorElemDescription}>picker.</p>
        </div> */}
        <div class={flexCol}>
          <ColorPicker width={150} />
          <div class={flexRow} style={{ 'align-items': 'center' }}>
            <Palette />
            <div class={flexCol} style={{ 'margin-left': vars.spacing.lg, gap: '1px', width: '100%', 'margin-top': vars.spacing.xs }}>
              {/* <p style={{ 'font-family': ZFB11, 'font-size': '8px', opacity: 0.4 }}>color code.</p> */}
              <div class={flexRow} style={{ height: 'fit-content', width: '100%', opacity: 0.9 }}>
                <p style={{ 'font-size': vars.text.md }}>#</p>
                <input
                  ref={(el) => (hexInputRef = el)}
                  // @ts-expect-error
                  style={{ 'font-family': ZFB11, 'font-size': vars.text.md, 'field-sizing': 'content' }}
                  maxLength={6}
                  value={currentColor().substring(1)}
                  onChange={(e) => {
                    const s = e.target.value.toUpperCase();
                    if (isValidHex(s)) {
                      setCurrentColor(`#${s}`);
                    }
                  }}
                  onInput={(e) => {
                    const currentPosition = hexInputRef.selectionStart;
                    hexInputRef.value = hexInputRef.value.toUpperCase();
                    hexInputRef.selectionStart = currentPosition;
                    hexInputRef.selectionEnd = currentPosition;
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function isValidHex(str: string) {
  return /^([0-9A-F]{3}){1,2}$/i.test(str);
}

export default Color;
