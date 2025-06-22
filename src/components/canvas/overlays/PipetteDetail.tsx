import { useMousePosition } from '@solid-primitives/mouse';
import { Component, Show } from 'solid-js';
import ColorBox from '~/components/common/ColorBox';
import { getCurrentPointingColor, getCurrentPointingColorHex } from '~/controllers/layer/LayerController';
import { vars, ZFB08, ZFB09 } from '~/styles/global.css';
import { flexCol, flexRow } from '~/styles/snippets.css';
import { isTransparent, transparent } from '~/utils/ColorUtils';

const PipetteDetail: Component<{}> = (props: {}) => {
  const pos = useMousePosition();
  return (
    <div
      class={flexRow}
      style={{
        position: 'fixed',
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        'margin-top': vars.spacing.md,
        'margin-left': vars.spacing.md,
        padding: vars.spacing.xs,
        gap: vars.spacing.md,
        border: `1px solid ${vars.color.border}`,
        'background-color': vars.color.background,
        'pointer-events': 'none',
        'align-items': 'center',
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
        <ColorBox color={getCurrentPointingColorHex()!} sizePx={24} forceBorderColor={vars.color.onBackground} />
        <div class={flexCol} style={{ gap: vars.spacing.xs }}>
          <div
            class={flexRow}
            style={{
              opacity: 0.8,
              gap: vars.spacing.sm,
            }}
          >
            {/* <Icon src='/icons/tool/pipette.png' base={10} scale={1} color={vars.color.onBackground} /> */}
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
