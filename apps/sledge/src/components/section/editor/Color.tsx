import { css } from '@acab/ecsstatic';
import { Component, createMemo, For } from 'solid-js';
import ColorPicker from '~/components/section/editor/item/ColorPicker';

import { flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { ColorBox, DropdownOption, Icon } from '@sledge/ui';
import Palette from '~/components/section/editor/item/Palette';
import SectionItem from '~/components/section/SectionItem';
import { currentColor, setCurrentColor } from '~/features/color';
import { getActiveToolCategoryId, setActiveToolCategory } from '~/features/tool/ToolController';
import { colorStore } from '~/stores/EditorStores';
import { sectionContent } from '../SectionStyles';

const swatchHeader = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const swatchContainer = css`
  display: flex;
  flex-direction: row;
  position: relative;
  gap: var(--spacing-xs);
  margin-left: 8px;
  margin-bottom: var(--spacing-lg);
`;

const colorElemDescription = css`
  font-family: ZFB03;
  opacity: 0.25;
  font-size: 8px;
  transform: rotate(180deg);
  white-space: nowrap;
  writing-mode: vertical-rl;
`;

const colorContent = css`
  display: flex;
  flex-direction: column;
  margin-left: 4px;
`;

const pickerToolContainer = css`
  display: flex;
  flex-direction: column;
  margin-top: auto;
  margin-bottom: 8px;
  margin-left: 24px;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const pipetteContainer = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
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
        <div class={swatchHeader}>
          {/* <div class={swatchDropdownContainer}>
            <Dropdown
              noBackground
              align={'left'}
              value={colorStore.currentSwatchName}
              options={swatchDropdownOptions()}
              onChange={(v) => setCurrentSwatch(v)}
            />
          </div> */}
        </div>
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

        {/* <div class={flexRow} style={{ 'margin-bottom': '8px', 'align-items': 'center', 'margin-right': '8px' }}>
          <div class={flexRow} style={{ gap: '8px' }}>
            <a>RGB</a>
            <a>HSV</a>
          </div>
        </div> */}

        <div class={flexRow}>
          <div>
            <p class={colorElemDescription}>picker.</p>
          </div>

          <ColorPicker width={140} />

          <div class={colorContent}>
            <Palette />

            <div class={pickerToolContainer}>
              <div class={pipetteContainer} onClick={() => setActiveToolCategory('pipette')}>
                <Icon
                  src={'/icons/misc/pipette.png'}
                  base={8}
                  scale={2}
                  color={getActiveToolCategoryId() === 'pipette' ? vars.color.active : vars.color.onBackground}
                />
              </div>
            </div>
          </div>
        </div>
        {/* <div class={flexRow} style={{ height: 'fit-content', 'min-width': '90px', 'margin-left': 'auto' }}>
          <p style={{ 'font-size': vars.text.md }}>#</p>
          <input
            ref={(el) => (hexInputRef = el)}
            style={{ 'font-family': ZFB11, 'font-size': vars.text.md, width: '56px', border: 'none' }}
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
