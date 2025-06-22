import { useMousePosition } from '@solid-primitives/mouse';
import { Component, Show } from 'solid-js';
import ColorBox from '~/components/common/ColorBox';
import { getCurrentPointingColorHex } from '~/controllers/layer/LayerController';
import { getActiveToolType } from '~/controllers/tool/ToolController';
import { interactStore } from '~/stores/EditorStores';
import { globalConfig } from '~/stores/GlobalStores';
import { vars, ZFB08, ZFB09 } from '~/styles/global.css';
import { flexCol, flexRow } from '~/styles/snippets.css';
import { ToolType } from '~/tools/Tools';

const CanvasAreaOverlay: Component<{}> = (props) => {
  const pos = useMousePosition();

  return (
    <>
      <Show when={interactStore.isMouseOnCanvas && globalConfig.editor.cursor === 'pixel'}>
        <div
          style={{
            position: 'fixed',
            top: `${pos.y}px`,
            left: `${pos.x}px`,
            width: '2px',
            height: '2px',
            'transform-origin': '0 0',
            transform: 'translate(-50%, -50%)',
            'backdrop-filter': 'invert()',
            'touch-action': 'none',
            'pointer-events': 'none',
          }}
          pointer-events='none'
        />
      </Show>

      <Show when={interactStore.isMouseOnCanvas && globalConfig.editor.cursor === 'cross'}>
        <div
          style={{
            position: 'fixed',
            top: `${pos.y}px`,
            left: `${pos.x}px`,
            width: '11px',
            height: '11px',

            'transform-origin': '0 0',
            transform: 'translate(-50%, -50%)',

            'touch-action': 'none',
            'pointer-events': 'none',
          }}
        >
          <div
            style={{
              display: 'block',
              position: 'absolute',
              width: '11px',
              height: '1px',
              top: '50%',
              left: '50%',
              'transform-origin': '0 0',
              transform: 'translate(-50%, -50%)',
              'backdrop-filter': 'invert()',
            }}
          />

          <div
            style={{
              display: 'block',
              position: 'absolute',
              width: '1px',
              height: '11px',
              top: '50%',
              left: '50%',
              'transform-origin': '0 0',
              transform: 'translate(-50%, -50%)',
              'backdrop-filter': 'invert()',
            }}
          />
        </div>
      </Show>

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
            border: `1px solid ${vars.color.border}`,
            'background-color': vars.color.background,
            'pointer-events': 'none',
            'align-items': 'center',
          }}
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
        </div>
      </Show>
    </>
  );
};

export default CanvasAreaOverlay;
