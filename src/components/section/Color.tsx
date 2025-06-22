import { Component, For } from 'solid-js';
import ColorPicker from '~/components/section/item/ColorPicker';
import ColorBox from '../common/ColorBox';

import Icon from '~/components/common/Icon';
import Palette from '~/components/section/item/Palette';
import { currentColor, setCurrentColor } from '~/controllers/color/ColorController';
import { getActiveToolType, setActiveToolType } from '~/controllers/tool/ToolController';
import { colorStore } from '~/stores/EditorStores';
import { vars, ZFB11 } from '~/styles/global.css';
import { sectionCaption, sectionContent, sectionRoot } from '~/styles/globals/section_global.css';
import { colorElemDescription, swatchContainer } from '~/styles/section/color.css';
import { flexCol, flexRow } from '~/styles/snippets.css';
import { ToolType } from '~/tools/Tools';

const Color: Component = () => {
  let hexInputRef: HTMLInputElement;

  const onColorClicked = (color: string, index: number) => {
    setCurrentColor(color);
  };

  return (
    <div class={sectionRoot}>
      <p class={sectionCaption}>color.</p>
      <div class={sectionContent} style={{ 'flex-direction': 'row', 'margin-top': '6px', 'margin-bottom': '4px' }}>
        <div class={swatchContainer}>
          <For each={colorStore.swatches}>
            {(item, index) => <ColorBox color={item} sizePx={8} onClick={(color) => onColorClicked(color, index())} enableUsingSelection={true} />}
          </For>
        </div>
        <div>
          <p class={colorElemDescription}>picker.</p>
        </div>

        <ColorPicker width={150} />
      </div>

      <div class={flexRow} style={{ 'align-items': 'center', 'margin-bottom': '12px' }}>
        <Palette />
        {/* <p style={{ 'font-family': ZFB11, 'font-size': '8px', opacity: 0.4 }}>color code.</p> */}

        <div class={flexRow} style={{ height: 'fit-content', 'margin-left': vars.spacing.lg, opacity: 0.9, 'min-width': '90px' }}>
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

        <div
          class={flexCol}
          style={{
            'margin-left': vars.spacing.sm,
            'align-items': 'center',
            'justify-content': 'center',
            cursor: 'pointer',
            'pointer-events': 'all',
          }}
          onClick={() => setActiveToolType(ToolType.Pipette)}
        >
          <Icon
            src={'/icons/misc/pipette.png'}
            base={10}
            scale={2}
            color={getActiveToolType() === ToolType.Pipette ? vars.color.active : vars.color.onBackground}
          />
        </div>
      </div>
    </div>
  );
};

function isValidHex(str: string) {
  return /^([0-9A-F]{3}){1,2}$/i.test(str);
}

export default Color;
