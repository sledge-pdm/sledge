import { flexCol } from '@sledge/core';
import { accentedButton } from '@sledge/theme';
import { Slider, ToggleSwitch } from '@sledge/ui';
import { AlphaBlurMode, GaussianBlurOption } from '@sledge/wasm';
import { Component, createSignal } from 'solid-js';
import { EffectSectionProps } from '~/components/section/effects/Effects';
import SectionItem from '~/components/section/SectionItem';
import { applyEffect } from '~/features/effect/Effects';
import { sectionContent, sectionSubCaption, sectionSubContent } from '../../SectionStyles';

const GaussianBlur: Component<EffectSectionProps> = (props) => {
  const [blurOptions, setBlurOptions] = createSignal<GaussianBlurOption>(new GaussianBlurOption(1000, AlphaBlurMode.Blur));
  return (
    <SectionItem title='gaussian blur.'>
      <div class={sectionContent} style={{ gap: '4px', 'margin-bottom': '8px' }}>
        <p class={sectionSubCaption}>radius.</p>
        <div class={sectionSubContent}>
          <Slider
            labelMode='left'
            value={blurOptions().radius}
            min={0}
            max={1000}
            allowFloat={false}
            onChange={(value) => {
              setBlurOptions((prev) => new GaussianBlurOption(value, prev.alpha_mode));
            }}
          />
        </div>

        <p class={sectionSubCaption}>clamp at transparency.</p>
        <div class={sectionSubContent}>
          <ToggleSwitch
            checked={blurOptions().alpha_mode === AlphaBlurMode.Skip}
            onChange={(value) => {
              setBlurOptions((prev) => new GaussianBlurOption(prev.radius, value ? AlphaBlurMode.Skip : AlphaBlurMode.Blur));
            }}
          />
        </div>

        <div
          class={flexCol}
          style={{
            width: '100%',
            'align-items': 'end',
          }}
        >
          <button
            class={accentedButton}
            onClick={() => {
              applyEffect(props.selectedLayerId(), 'gaussian_blur', blurOptions());
            }}
          >
            Apply.
          </button>
        </div>
      </div>
    </SectionItem>
  );
};

export default GaussianBlur;
