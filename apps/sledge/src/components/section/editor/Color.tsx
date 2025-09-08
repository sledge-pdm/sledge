import { Component, For } from 'solid-js';
import ColorPicker from '~/components/section/editor/item/ColorPicker';

import { flexCol, flexRow } from '@sledge/core';
import { vars, ZFB11 } from '@sledge/theme';
import { ColorBox, Icon } from '@sledge/ui';
import Palette from '~/components/section/editor/item/Palette';
import SectionItem from '~/components/section/SectionItem';
import { getActiveToolCategoryId, setActiveToolCategory } from '~/controllers/tool/ToolController';
import { currentColor, setCurrentColor } from '~/features/color';
import { colorStore } from '~/stores/EditorStores';
import { colorElemDescription, swatchContainer } from '~/styles/section/editor/color.css';
import { sectionContent } from '~/styles/section/section_item.css';

const Color: Component = () => {
  let hexInputRef: HTMLInputElement;

  const onColorClicked = (color: string, index: number) => {
    setCurrentColor(color);
  };

  return (
    <SectionItem title='color.'>
      <div class={sectionContent}>
        <div
          class={flexRow}
          style={{
            'margin-top': '8px',
            'margin-bottom': '10px',
          }}
        >
          <div>
            <p class={colorElemDescription}>palette.</p>
          </div>
          <div class={swatchContainer}>
            <For each={colorStore.swatches}>
              {(item, index) => (
                <ColorBox
                  color={item}
                  sizePx={9}
                  onClick={(color) => onColorClicked(color, index())}
                  enableUsingSelection={true}
                  currentColor={currentColor}
                />
              )}
            </For>
          </div>
          <div>
            <p class={colorElemDescription}>picker.</p>
          </div>

          <ColorPicker width={150} />
        </div>

        <div class={flexRow} style={{ 'align-items': 'center', 'padding-left': '6px', 'margin-bottom': '12px', 'box-sizing': 'border-box' }}>
          <Palette />
          {/* <p style={{ 'font-family': ZFB11, 'font-size': '8px', opacity: 0.4 }}>color code.</p> */}

          <div class={flexRow} style={{ height: 'fit-content', 'margin-left': '16px', opacity: 0.9, 'min-width': '90px' }}>
            <p style={{ 'font-size': vars.text.md }}>#</p>
            <input
              ref={(el) => (hexInputRef = el)}
              style={{ 'font-family': ZFB11, 'font-size': vars.text.md, width: '56px' }}
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

          <div
            class={flexCol}
            style={{ 'margin-left': '18px', 'align-items': 'center', 'justify-content': 'center', cursor: 'pointer', 'pointer-events': 'all' }}
            onClick={() => setActiveToolCategory('pipette')}
          >
            <Icon
              src={'/icons/misc/pipette9.png'}
              base={8}
              scale={2}
              color={getActiveToolCategoryId() === 'pipette' ? vars.color.active : vars.color.onBackground}
            />
          </div>
        </div>
      </div>
    </SectionItem>
  );
};

function isValidHex(str: string) {
  return /^([0-9A-F]{3}){1,2}$/i.test(str);
}

export default Color;
