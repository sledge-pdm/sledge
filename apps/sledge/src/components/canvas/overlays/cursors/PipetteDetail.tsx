import { css } from '@acab/ecsstatic';
import { color, fonts, spacing, text } from '@sledge/theme';
import { ColorBox } from '@sledge/ui';
import { Component, Show } from 'solid-js';
import { currentColor, isTransparent, transparent } from '~/features/color';
import { getCurrentPointingColor, getCurrentPointingColorHex } from '~/features/layer';
import { interactStore } from '~/stores/EditorStores';

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
  return (
    <div
      class={pipetteDetailContainer}
      style={{
        top: `${interactStore.lastMouseWindow.y}px`,
        left: `${interactStore.lastMouseWindow.x}px`,
        'margin-top': spacing.md,
        'margin-left': spacing.md,
        padding: spacing.xs,
        gap: spacing.md,
        border: `1px solid ${color.border}`,
        'background-color': color.background,
      }}
    >
      <Show
        when={getCurrentPointingColorHex() !== undefined && !isTransparent(getCurrentPointingColor() ?? transparent)}
        fallback={
          <p
            style={{
              'font-family': fonts.ZFB08,
              'font-size': text.sm,
              color: color.onBackground,
              opacity: 0.7,
            }}
          >
            there is no color here.
          </p>
        }
      >
        <ColorBox currentColor={currentColor} color={getCurrentPointingColorHex()!} sizePx={24} forceBorderColor={color.onBackground} />
        <div class={pipetteInfo} style={{ gap: spacing.xs }}>
          <div
            class={pipetteHeader}
            style={{
              gap: spacing.sm,
            }}
          >
            <p
              style={{
                'font-family': fonts.ZFB08,
                color: color.onBackground,
              }}
            >
              pipette.
            </p>
          </div>
          <p
            style={{
              'font-family': fonts.ZFB09,
              'font-size': text.md,
              color: color.onBackground,
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
