import { useMousePosition } from '@solid-primitives/mouse';
import { Component, Show } from 'solid-js';
import ColorBox from '~/components/common/ColorBox';
import { getCurrentPointingColorHex } from '~/controllers/layer/LayerController';
import { getActiveToolType } from '~/controllers/tool/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { vars, ZFB09 } from '~/styles/global.css';
import { flexRow } from '~/styles/snippets.css';
import { ToolType } from '~/tools/Tools';

const CanvasAreaOverlay: Component<{}> = (props) => {
  const pos = useMousePosition();

  return (
    <>
      <Show
        when={
          interactStore.isMouseOnCanvas &&
          getActiveToolType() === ToolType.Pipette &&
          getCurrentPointingColorHex() &&
          getCurrentPointingColorHex() !== '#00000000'
        }
      >
        <div
          class={flexRow}
          style={{
            position: 'fixed',
            top: `${pos.y}px`,
            left: `${pos.x}px`,
            'margin-top': vars.spacing.md,
            'margin-left': vars.spacing.md,
            padding: vars.spacing.sm,
            gap: vars.spacing.md,
            'background-color': vars.color.background,
            'pointer-events': 'none',
            'align-items': 'center',
          }}
        >
          <ColorBox color={getCurrentPointingColorHex()!} sizePx={24} forceBorderColor={vars.color.onBackground} />
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
    </>
  );
};

export default CanvasAreaOverlay;
