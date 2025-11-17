import { css } from '@acab/ecsstatic';
import { isTransparent, transparent } from '@sledge/anvil';
import { Vec2 } from '@sledge/core';
import { color, fonts } from '@sledge/theme';
import { ColorBox } from '@sledge/ui';
import { Component, Show } from 'solid-js';
import { currentColor } from '~/features/color';
import { getCurrentPointingColor, getCurrentPointingColorHex } from '~/features/layer';

const pipetteDetailContainer = css`
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: row;
  pointer-events: none;
  align-items: center;
  margin-top: 16px;
  margin-left: 16px;
  padding: 4px;
  gap: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
`;

interface Props {
  mousePos: Vec2;
}

const PipetteDetail: Component<Props> = (props) => {
  return (
    <div
      class={pipetteDetailContainer}
      style={{
        translate: `${props.mousePos.x}px ${props.mousePos.y}px`,
      }}
    >
      <Show
        when={getCurrentPointingColorHex() !== undefined && !isTransparent(getCurrentPointingColor() ?? transparent)}
        fallback={
          <p
            style={{
              'font-family': fonts.ZFB21,
              'text-transform': 'uppercase',
              color: color.onBackground,
              opacity: 0.7,
            }}
          >
            there is no color here.
          </p>
        }
      >
        <ColorBox currentColor={currentColor} color={getCurrentPointingColorHex()!} sizePx={21} forceBorderColor={color.onBackground} />

        <p
          style={{
            'font-family': fonts.ZFB21,
            'text-transform': 'uppercase',
            'font-size': '16px',
            'margin-bottom': '2px',
            color: color.onBackground,
          }}
        >
          {getCurrentPointingColorHex()!.toUpperCase()}
        </p>
      </Show>
    </div>
  );
};

export default PipetteDetail;
