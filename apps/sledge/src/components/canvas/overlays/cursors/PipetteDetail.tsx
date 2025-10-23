import { css } from '@acab/ecsstatic';
import { color, fonts } from '@sledge/theme';
import { ColorBox } from '@sledge/ui';
import { Component, Show } from 'solid-js';
import { currentColor, isTransparent, transparent } from '~/features/color';
import { getCurrentPointingColor, getCurrentPointingColorHex } from '~/features/layer';
import { interactStore } from '~/stores/EditorStores';

const pipetteDetailContainer = css`
  position: fixed;
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

const PipetteDetail: Component = () => {
  return (
    <div
      class={pipetteDetailContainer}
      style={{
        top: `${interactStore.lastMouseWindow.y}px`,
        left: `${interactStore.lastMouseWindow.x}px`,
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
