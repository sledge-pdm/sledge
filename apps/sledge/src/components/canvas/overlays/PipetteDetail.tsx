import { css } from '@acab/ecsstatic';
import { vars, ZFB08, ZFB09 } from '@sledge/theme';
import { ColorBox } from '@sledge/ui';
import { useMousePosition } from '@solid-primitives/mouse';
import { Component, Show } from 'solid-js';
import { currentColor, isTransparent, transparent } from '~/features/color';
import { getCurrentPointingColor, getCurrentPointingColorHex } from '~/features/layer';

const pipetteDetailContainer = css`
  display: flex;
  flex-direction: row;
  position: fixed;
  pointer-events: none;
  align-items: center;
`;

const pipetteInfo = css`
  display: flex;
  flex-direction: column;
`;

const pipetteHeader = css`
  display: flex;
  flex-direction: row;
  opacity: 0.8;
`;

const PipetteDetail: Component = (props: {}) => {
  const pos = useMousePosition();
  return (
    <div
      class={pipetteDetailContainer}
      style={{
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        'margin-top': vars.spacing.md,
        'margin-left': vars.spacing.md,
        padding: vars.spacing.xs,
        gap: vars.spacing.md,
        border: `1px solid ${vars.color.border}`,
        'background-color': vars.color.background,
      }}
    >
      <Show
        when={getCurrentPointingColorHex() !== undefined && !isTransparent(getCurrentPointingColor() ?? transparent)}
        fallback={
          <p
            style={{
              'font-family': ZFB08,
              'font-size': vars.text.sm,
              color: vars.color.onBackground,
              opacity: 0.7,
            }}
          >
            there is no color here.
          </p>
        }
      >
        <ColorBox currentColor={currentColor} color={getCurrentPointingColorHex()!} sizePx={24} forceBorderColor={vars.color.onBackground} />
        <div class={pipetteInfo} style={{ gap: vars.spacing.xs }}>
          <div
            class={pipetteHeader}
            style={{
              gap: vars.spacing.sm,
            }}
          >
            {/* <Icon src='/icons/tool_bar/tool/pipette.png' base={10} scale={1} color={vars.color.onBackground} /> */}
            <p
              style={{
                'font-family': ZFB08,
                color: vars.color.onBackground,
              }}
            >
              pipette.
            </p>
          </div>
          <p
            style={{
              'font-family': ZFB09,
              'font-size': vars.text.md,
              color: vars.color.onBackground,
            }}
          >
            {getCurrentPointingColorHex()!.toUpperCase()}
          </p>
        </div>
      </Show>
    </div>
  );
};

export default PipetteDetail;
