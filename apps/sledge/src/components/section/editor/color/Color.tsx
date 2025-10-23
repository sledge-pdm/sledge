import { css } from '@acab/ecsstatic';
import { Component, createMemo, createSignal, For, Match, Show, Switch } from 'solid-js';
import ColorPicker from '~/components/section/editor/color/tab/ColorPicker';

import { clsx } from '@sledge/core';
import { color } from '@sledge/theme';
import { DropdownOption, Icon } from '@sledge/ui';
import Palette from '~/components/section/editor/color/Palette';
import HSV from '~/components/section/editor/color/tab/HSV';
import RGB from '~/components/section/editor/color/tab/RGB';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '~/components/section/SectionStyles';
import { currentColor, hexToRGBA, RGBAToHex, setCurrentColor } from '~/features/color';
import { getActiveToolCategoryId, setActiveToolCategory } from '~/features/tools/ToolController';
import { colorStore } from '~/stores/EditorStores';
import { accentedButton, flexCol } from '~/styles/styles';

const colorSectionContainer = css`
  padding-left: 12px;
  margin-top: 16px;
`;
const mainContainer = css`
  display: flex;
  flex-direction: row;
`;
const currentColorContainer = css`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  padding-top: 4px;
  padding-right: 8px;
`;
const currentColorSharp = css`
  font-family: ZFB21;
  text-transform: uppercase;
  font-size: 16px;
  font-family: ZFB21;
  opacity: 0.25;
  margin-left: 20px;
`;
const currentColorLabel = css`
  font-family: ZFB21;
  text-transform: uppercase;
  font-size: 16px;
  padding-bottom: 1px;
  font-family: ZFB21;
  opacity: 0.25;
  margin-right: auto;

  &:hover {
    opacity: 1;
    color: var(--color-active);
  }
`;
const currentColorForm = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: auto;
`;
const currentColorInput = css`
  width: 86px;
  padding: 0px;
  border-color: var(--color-border-secondary);
  letter-spacing: 1px;
  font-family: ZFB21;
  text-transform: uppercase;
  font-size: 16px;
  font-family: ZFB21;
  opacity: 1;
`;
const currentApplyButton = css`
  margin-left: 4px;
`;

const tabsContainer = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-right: 8px;
`;
const tabItem = css`
  font-family: ZFB09;
  transform: rotate(180deg);
  white-space: nowrap;
  writing-mode: vertical-lr;
  color: var(--color-muted);
  opacity: 0.6;
  padding: 1px;

  &:hover {
    opacity: 1;
    color: var(--color-active);
  }
`;
const tabItemActive = css`
  opacity: 0.6;
  color: var(--color-active);
`;

const tabSwitchContent = css`
  display: flex;
  flex-direction: column;
  width: 150px;
  height: 134px;
`;

const paletteContainer = css`
  display: flex;
  flex-direction: column;
  margin-top: 4px;
`;
const pipetteContainer = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px;
  width: fit-content;
  cursor: pointer;
  pointer-events: all;
`;

const swatchContainer = css`
  display: flex;
  flex-direction: row;
  position: relative;
  gap: var(--spacing-xs);
  margin-top: 8px;
  margin-bottom: 12px;
`;
const Color: Component = () => {
  let hexInputRef: HTMLInputElement;

  const tabs = ['picker', 'rgb'] as const;
  const [tab, setTab] = createSignal<string>(tabs[0]);

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
  const [isColorInput, setIsColorInput] = createSignal(false);
  return (
    <SectionItem title='color.'>
      <div class={clsx(sectionContent, colorSectionContainer)} style={{ width: 'fit-content' }}>
        <div class={mainContainer}>
          <div class={tabsContainer}>
            <For each={tabs}>
              {(item, index) => (
                <a
                  class={clsx(tabItem, tab() === item && tabItemActive)}
                  onClick={() => {
                    setTab(item);
                  }}
                >
                  {item}
                </a>
              )}
            </For>
          </div>
          <div class={flexCol}>
            <div class={tabSwitchContent}>
              <Switch>
                <Match when={tab() === 'picker'}>
                  <ColorPicker width={130} />
                </Match>
                <Match when={tab() === 'rgb'}>
                  <RGB />
                </Match>
                <Match when={tab() === 'hsv'}>
                  <HSV />
                </Match>
              </Switch>
            </div>
          </div>

          <div class={paletteContainer}>
            <Palette />
          </div>
        </div>

        <div class={currentColorContainer}>
          <p class={currentColorSharp}>#</p>
          <Show
            when={isColorInput()}
            fallback={
              <a
                class={currentColorLabel}
                title='click to input color code.'
                onClick={() => {
                  setIsColorInput(true);
                  const colorInput = document.getElementById('color-input') as HTMLInputElement;
                  colorInput?.focus();
                  colorInput?.setSelectionRange(0, 7);
                }}
              >
                {currentColor().slice(1, 7)}
              </a>
            }
          >
            <form
              class={currentColorForm}
              onSubmit={(e) => {
                e.preventDefault();
                const colorInput = document.getElementById('color-input') as HTMLInputElement;
                const value = '#' + colorInput.value;
                const rgba = hexToRGBA(value);
                setCurrentColor('#' + RGBAToHex(rgba));

                setIsColorInput(false);
              }}
            >
              <input
                id='color-input'
                class={currentColorInput}
                value={currentColor().slice(1, 7)}
                autocomplete='off'
                onKeyDown={(e) => {
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                }}
              />
              <button type='submit' class={clsx(accentedButton, currentApplyButton)}>
                ok
              </button>
            </form>
          </Show>

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
        {/* <div class={swatchContainer}>
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
        </div> */}
      </div>
    </SectionItem>
  );
};

function isValidHex(str: string) {
  return /^([0-9A-F]{3}){1,2}$/i.test(str);
}

export default Color;
