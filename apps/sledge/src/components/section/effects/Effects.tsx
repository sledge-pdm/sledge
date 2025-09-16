import { flexCol } from '@sledge/core';
import { vars } from '@sledge/theme';
import { Component, onMount } from 'solid-js';
import LayerPreview from '~/components/global/LayerPreview';
import GaussianBlur from '~/components/section/effects/items/GaussianBlur';
import GrayScale from '~/components/section/effects/items/GrayScale';
import Invert from '~/components/section/effects/items/Invert';
import { activeLayer } from '~/features/layer';

const Effects: Component = () => {
  onMount(() => {});

  return (
    <>
      <div
        class={flexCol}
        style={{
          'align-self': 'center',
          width: 'fit-content',
          height: 'auto',
          border: `1px solid ${vars.color.active}`,
          'margin-bottom': '16px',
        }}
      >
        <LayerPreview layer={activeLayer()} onClick={() => {}} width={180} height={180} />
      </div>
      <p>
        Effect will be applied to <span style={{ color: vars.color.active }}>{activeLayer().name}</span>.
      </p>

      <Invert />
      <GrayScale />
      <GaussianBlur />
    </>
  );
};

export default Effects;
