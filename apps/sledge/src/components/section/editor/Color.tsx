import { Component, createMemo, For } from 'solid-js';
import ColorPicker from '~/components/section/editor/item/ColorPicker';

import { flexCol, flexRow } from '@sledge/core';
import { vars } from '@sledge/theme';
import { ColorBox, DropdownOption, Icon } from '@sledge/ui';
import Palette from '~/components/section/editor/item/Palette';
import SectionItem from '~/components/section/SectionItem';
import { currentColor, setCurrentColor } from '~/features/color';
import { getActiveToolCategoryId, setActiveToolCategory } from '~/features/tool/ToolController';
import { colorStore } from '~/stores/EditorStores';
import { colorElemDescription, swatchContainer, swatchHeader } from '~/styles/section/editor/color.css';
import { sectionContent } from '~/styles/section/section_item.css';

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

          <div class={flexCol} style={{ 'margin-left': '4px' }}>
            <Palette />

            <div
              class={flexCol}
              style={{
                'margin-top': 'auto',
                'margin-bottom': '8px',
                'margin-left': '24px',
                'align-items': 'center',
                'justify-content': 'center',
                gap: '16px',
              }}
            >
              <div
                class={flexCol}
                style={{
                  gap: '8px',
                  cursor: 'pointer',
                  'pointer-events': 'all',
                }}
                onClick={() => setActiveToolCategory('pipette')}
              >
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
