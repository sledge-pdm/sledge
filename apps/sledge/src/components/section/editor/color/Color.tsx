import { css } from '@acab/ecsstatic';
import { Component, createMemo, For } from 'solid-js';
import ColorPicker from '~/components/section/editor/color/ColorPicker';

import { color } from '@sledge/theme';
import { ColorBox, DropdownOption, Icon } from '@sledge/ui';
import Palette from '~/components/section/editor/color/Palette';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '~/components/section/SectionStyles';
import { currentColor, setCurrentColor } from '~/features/color';
import { getActiveToolCategoryId, setActiveToolCategory } from '~/features/tools/ToolController';
import { colorStore } from '~/stores/EditorStores';
import { flexRow } from '~/styles/styles';

const swatchContainer = css`
  display: flex;
  flex-direction: row;
  position: relative;
  gap: var(--spacing-xs);
  margin-top: 8px;
  margin-bottom: 12px;
`;

const colorContent = css`
  display: flex;
  flex-direction: column;
`;

const pickerToolContainer = css`
  display: flex;
  flex-direction: column;
  margin-top: auto;
  margin-bottom: 4px;
  margin-left: 28px;
`;

const pipetteContainer = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: fit-content;
  cursor: pointer;
  pointer-events: all;
`;

const Color: Component = () => {
  let hexInputRef: HTMLInputElement;

  const onColorClicked = (color: string, index: number) => {
    setCurrentColor(color);
  };

  const swatchDropdownOptions = createMemo<DropdownOption<string>[]>((p) => {
    return colorStore.swatches.map((s) => {
      return {
        label: s.name,
        value: s.name,
      };
    });
  });

  const currentSwatch = () => colorStore.swatches.find((s) => s.name === colorStore.currentSwatchName);

  return (
    <SectionItem title='color.'>
      <div class={sectionContent}>
        <div class={swatchContainer}>
          <For each={currentSwatch()?.colors}>
            {(item, index) => (
              <ColorBox
                color={item}
                sizePx={12}
                onClick={(color) => onColorClicked(color, index())}
                enableUsingSelection={true}
                currentColor={currentColor}
              />
            )}
          </For>
        </div>

        <div class={flexRow}>
          <ColorPicker width={140} />

          <div class={colorContent}>
            <Palette />

            <div class={pickerToolContainer}>
              <div class={pipetteContainer} onClick={() => setActiveToolCategory('pipette')}>
                <Icon
                  src={'/icons/tools/pipette.png'}
                  base={8}
                  scale={2}
                  color={getActiveToolCategoryId() === 'pipette' ? color.active : color.onBackground}
                  hoverColor={color.active}
                />
              </div>
            </div>
          </div>
        </div>
        {/* <div class={flexRow} style={{ height: 'fit-content', 'min-width': '90px', 'margin-left': 'auto' }}>
          <p style={{ 'font-size': text.md }}>#</p>
          <input
            ref={(el) => (hexInputRef = el)}
            style={{ 'font-family': ZFB11, 'font-size': text.md, width: '56px', border: 'none' }}
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
        </div> */}
      </div>
    </SectionItem>
  );
};

function isValidHex(str: string) {
  return /^([0-9A-F]{3}){1,2}$/i.test(str);
}

export default Color;
