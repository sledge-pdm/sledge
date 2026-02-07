import { css } from '@acab/ecsstatic';
import { clsx, Vec2 } from '@sledge-pdm/core';
import { CircleKernel, SquareKernel } from '@sledge-pdm/frasco';
import { color, showContextMenu } from '@sledge-pdm/ui';
import { Component, createEffect, createMemo, createSignal, For, onMount, Show } from 'solid-js';
import { previewMaskManager } from '~/features/tools/behaviors/draw/PreviewMaskManager';
import { getCurrentPresetConfig, updateToolPresetConfig } from '~/features/tools/ToolController';
import { DEFAULT_PRESET, EraserPresetConfig, PenPresetConfig } from '~/features/tools/Tools';
import { toolStore } from '~/stores/EditorStores';
import { ContextMenuItems } from '~/utils/ContextMenuItems';

const root = css`
  margin-bottom: 8px;
`;

const container = css`
  display: flex;
  flex-direction: row;
  gap: 2px;
  flex-wrap: wrap;
  width: 100%;
  height: 28px;
  justify-content: end;
`;

const item = css`
  position: relative;
  display: flex;
  flex-direction: row;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border-secondary);
  overflow: hidden;

  cursor: pointer;
`;

const itemActive = css`
  border: 1px solid var(--color-enabled);
`;

const preview = css`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const sizeLabel = css`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-family: ZFB03B;
  text-align: center;
  background-color: var(--color-background);
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.75;
`;

interface Props {
  categoryId: 'pen' | 'eraser';
}

const SizeHistoryRow: Component<Props> = (props) => {
  const getPreset = () => getCurrentPresetConfig(props.categoryId) as PenPresetConfig | EraserPresetConfig;
  const preset = createMemo(() => getPreset());

  return (
    <div class={root}>
      <div class={container}>
        <For each={preset().sizeHistory ?? []}>
          {(size, index) => {
            const isCurrentSize = () => size === preset().size;
            return (
              <div
                class={clsx(item, isCurrentSize() && itemActive)}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopImmediatePropagation();

                  updateToolPresetConfig(props.categoryId, toolStore.tools[props.categoryId].presets?.selected ?? DEFAULT_PRESET, 'size', size);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopImmediatePropagation();

                  showContextMenu(
                    [
                      { type: 'label', label: `${size}px` },
                      {
                        ...ContextMenuItems.BaseRemove,
                        onSelect: () => {
                          const removedHistory = preset().sizeHistory?.filter((s) => s !== size);
                          updateToolPresetConfig(
                            props.categoryId,
                            toolStore.tools[props.categoryId].presets?.selected ?? DEFAULT_PRESET,
                            'sizeHistory',
                            removedHistory
                          );
                        },
                      },
                      {
                        ...ContextMenuItems.BaseClear,
                        onSelect: () => {
                          updateToolPresetConfig(
                            props.categoryId,
                            toolStore.tools[props.categoryId].presets?.selected ?? DEFAULT_PRESET,
                            'sizeHistory',
                            []
                          );
                        },
                      },
                    ],
                    e
                  );
                }}
              >
                <div class={preview}>
                  <PreviewSVG categoryId={props.categoryId} shape={preset().shape ?? 'circle'} size={size} containerSize={28} />
                </div>
                <p class={sizeLabel}>{size}px</p>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

interface PreviewProps {
  categoryId: 'pen' | 'eraser';
  containerSize: number;
  shape: 'square' | 'circle';
  size: number;
}
const PreviewSVG: Component<PreviewProps> = (props) => {
  const containerSize = props.containerSize;
  const [offset, setOffset] = createSignal<Vec2>({ x: 0, y: 0 });
  const [penOutlinePath, setPenOutlinePath] = createSignal('');

  const updatePreview = () => {
    const shape = props.shape;
    const size = props.size;
    const kernel = shape === 'circle' ? new CircleKernel() : new SquareKernel();
    const preview = previewMaskManager.get(kernel, { size, color: [0, 0, 0, 255], opacity: 1 });
    if (!preview) {
      setPenOutlinePath('');
    } else {
      setOffset({
        x: containerSize / 2 - preview.bitmaskShape.width / 2,
        y: containerSize / 2 - preview.bitmaskShape.height / 2,
      });
      setPenOutlinePath(preview.svgPath ?? '');
    }
  };

  onMount(() => {
    updatePreview();
  });

  createEffect(() => {
    props.shape;
    props.size;
    updatePreview();
  });

  return (
    <Show when={penOutlinePath()}>
      <svg viewBox={`0 0 ${containerSize} ${containerSize}`} xmlns='http://www.w3.org/2000/svg'>
        <path
          d={penOutlinePath()}
          fill={color.onBackground}
          stroke={'none'}
          vector-effect='non-scaling-stroke'
          pointer-events='none'
          style={{
            translate: `${offset().x}px ${offset().y}px`,
          }}
        />
      </svg>
    </Show>
  );
};

export default SizeHistoryRow;
