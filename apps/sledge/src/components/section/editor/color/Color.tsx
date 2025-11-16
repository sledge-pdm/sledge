import { css } from '@acab/ecsstatic';
import { Component, createSignal, For, Match, Show, Switch } from 'solid-js';
import ColorPicker from '~/components/section/editor/color/tabs/ColorPicker';

import { clsx } from '@sledge/core';
import { color } from '@sledge/theme';
import { Icon } from '@sledge/ui';
import Palette from '~/components/section/editor/color/Palette';
import ColorHistory from '~/components/section/editor/color/tabs/ColorHistory';
import RGB from '~/components/section/editor/color/tabs/RGB';
import SectionItem from '~/components/section/SectionItem';
import { sectionContent } from '~/components/section/SectionStyles';
import { currentColor, hexToRGBA, PaletteType, registerColorChange, RGBAToHex, setCurrentColor } from '~/features/color';
import { getActiveToolCategoryId, setActiveToolCategory } from '~/features/tools/ToolController';
import { accentedButton, flexCol } from '~/styles/styles';

const colorSectionContainer = css`
  padding-left: 4px;
  margin-top: 14px;
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
  margin-left: 22px;
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
  gap: 10px;
  margin-right: 12px;
`;
const tabItem = css`
  font-family: ZFB09;
  transform: rotate(180deg);
  white-space: nowrap;
  writing-mode: vertical-lr;
  color: var(--color-muted);
  opacity: 0.6;

  &:hover {
    opacity: 1;
    color: var(--color-active);
  }
`;
const tabItemActive = css`
  opacity: 0.75;
  color: var(--color-active);
`;

const tabSwitchContent = css`
  display: flex;
  flex-direction: column;
  width: 164px;
  height: 136px;
`;

const paletteContainer = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: 12px;
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

const Color: Component = () => {
  const tabs = ['picker', 'rgb', 'history'] as const;
  const [tab, setTab] = createSignal<string>(tabs[0]);

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
                  <ColorPicker width={144} />
                </Match>
                <Match when={tab() === 'rgb'}>
                  <RGB />
                </Match>
                <Match when={tab() === 'history'}>
                  <ColorHistory />
                </Match>
              </Switch>
            </div>
          </div>

          <div class={paletteContainer}>
            <Palette index={1} paletteType={PaletteType.primary} />
            <Palette index={2} paletteType={PaletteType.secondary} />
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
                registerColorChange(hexToRGBA(currentColor()), rgba);
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
      </div>
    </SectionItem>
  );
};

export default Color;
