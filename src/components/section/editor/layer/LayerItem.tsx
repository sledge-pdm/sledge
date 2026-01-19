import { css } from '@acab/ecsstatic';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { clsx } from '@sledge-pdm/core';
import { Checkbox, color, Icon, Light, showContextMenu } from '@sledge-pdm/ui';
import { Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import LayerPreview from '~/components/global/LayerPreview';
import { allLayers, findLayerById, Layer, mergeToBelowLayer, moveLayer, setActiveLayerId, setLayerName } from '~/features/layer';
import {
  clearLayersFromUser,
  deselectLayer,
  duplicateLayers,
  getSelectedLayers,
  removeLayersFromUser,
  selectLayer,
  summarizeLayerNames,
  toggleLayerVisibility,
} from '~/features/layer/service';
import { projectStore, setProjectStore } from '~/stores/RuntimeProject';
import { flexRow } from '~/styles/styles';
import { ContextMenuItems } from '~/utils/ContextMenuItems';
import { updateWebGLCanvas } from '~/webgl/service';

const root = css`
  width: 100%;
  position: relative;
`;

const activeBackground = css`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  pointer-events: none;
  z-index: -1;
`;

const content = css`
  display: flex;
  flex-direction: row;
  height: 40px;
  cursor: pointer;
`;

const handle = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 12px;
  background-color: var(--color-border);
`;

const spinner = css`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #666;
  }
`;

const contentDisabled = css`
  opacity: 0.3;
`;

const contentCutFreezed = css`
  opacity: 0.5;
`;

const textContent = css`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex-grow: 1;
  padding-left: 6px;
  justify-content: center;
  gap: 1px;
  overflow: hidden;
  border-left: 1px solid var(--color-border);
`;

const index = css`
  white-space: nowrap;
  font-size: var(--text-sm);
  opacity: 0.3;
  margin-left: 2px;
  width: 16px;
`;

const type = css`
  white-space: nowrap;
  font-size: var(--text-sm);
  opacity: 0.75;
`;

const name = css`
  font-family: ZFB03B, k8x12;
  font-size: 16px;
  margin-left: 18px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const nameInput = css`
  outline: none;
  border: none;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--color-on-background);
`;

const activeLight = css`
  position: absolute;
  align-self: center;
  right: 0px;
  margin: var(--spacing-sm) 0;
  margin-left: var(--spacing-sm);
  margin-right: var(--spacing-md);
`;

const selectCheckboxContainer = css`
  display: flex;
  position: absolute;
  top: 8px;
  right: 0px;
  opacity: 0.75;
  pointer-events: all;
`;

interface LayerItemProps {
  index: number;
  isLast?: boolean;
  layer: Layer;
}

const LayerItem: Component<LayerItemProps> = (props) => {
  let inputRef: HTMLInputElement | undefined;
  const [isNameChanging, setNameChanging] = createSignal(false);
  const [originalName, setOriginalName] = createSignal(props.layer.name);
  const [isHighlighted, setIsHighlighted] = createSignal(false);

  const onDetClicked = (e: MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      if (!projectStore.layers.state.selectionEnabled) {
        setProjectStore('layers', 'state', 'selectionEnabled', true);
        setProjectStore('layers', 'state', 'selected', () => new Set<string>([props.layer.id]));
      } else {
        setProjectStore('layers', 'state', 'selected', (set: Set<string>) => {
          const updated = new Set(set);
          if (updated.has(props.layer.id)) updated.delete(props.layer.id);
          else updated.add(props.layer.id);
          return updated;
        });
      }
    }
    setActiveLayerId(props.layer.id);
    // not needed because setActiveLayerId calls it
    // eventBus.emit('webgl:requestUpdate', { onlyDirty: false });
  };

  const onPreviewClicked = (e: MouseEvent) => {
    e.stopPropagation();
    if (props.index !== -1) {
      setProjectStore('layers', 'layers', props.index, 'enabled', (v: boolean) => !v);
    }
    updateWebGLCanvas('layer deactivated from layeritem');
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (inputRef && !inputRef.contains(e.target as Node)) {
      setNameChanging(false);
    }
  };

  // レイヤー移動時のハイライト効果
  const highlightLayer = () => {
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 400);
  };

  const handleMoveUp = (e: MouseEvent) => {
    e.stopPropagation();
    moveLayer(props.index, props.index - 1);
    highlightLayer();
  };

  const handleMoveDown = (e: MouseEvent) => {
    e.stopPropagation();
    moveLayer(props.index, props.index + 1);
    highlightLayer();
  };

  onMount(() => {
    window.addEventListener('pointerdown', handlePointerDown);
  });
  onCleanup(() => {
    window.removeEventListener('pointerdown', handlePointerDown);
  });

  const isActive = () => projectStore.layers.state.activeLayerId === props.layer.id;
  const isSelectionMode = () => projectStore.layers.state.selectionEnabled && projectStore.layers.state.selected.size > 0;
  const contextTargets = () => (isSelectionMode() ? undefined : [props.layer.id]);
  const resolvedContextTargets = () => contextTargets() ?? getSelectedLayers();
  const contextMenuLabel = () => {
    const targets = resolvedContextTargets();
    if (targets.length === 0) return props.layer.name;
    if (targets.length === 1) return findLayerById(targets[0])?.name ?? targets[0];
    return `${targets.length} layers: ${summarizeLayerNames(targets)}`;
  };

  let itemEl: HTMLDivElement;
  const [isDragging, setIsDragging] = createSignal(false);

  onMount(() => {
    const cleanDraggable = draggable({
      element: itemEl,
      getInitialData: () => ({ type: 'layer', id: props.layer.id }),
      onDragStart() {
        setIsDragging(true);
      },
      onDrag: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });

    return () => cleanDraggable();
  });

  return (
    <>
      <style>
        {`
          @keyframes blink {
            0% { background-color: transparent; }
            50%, 100% { background-color: rgba(255, 255, 0, 0.35); }
          }
        `}
      </style>
      <div class={root} ref={(el) => (itemEl = el)} data-layer-id={props.layer.id}>
        <div
          class={activeBackground}
          style={{
            'background-color': isActive() ? color.active : color.surface,
            opacity: isActive() ? 0.15 : 1.0,
          }}
        ></div>
        <div
          class={clsx(content, !props.layer.enabled && contentDisabled, props.layer.cutFreeze && contentCutFreezed)}
          onClick={onDetClicked}
          onContextMenu={async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();

            // const menu = await LayerMenu.create(props.layer.id);
            // menu.show(new LogicalPosition(e.clientX, e.clientY));

            const layerId = props.layer.id;
            const targetLayers = contextTargets();
            showContextMenu(
              [
                { type: 'label', label: contextMenuLabel() },
                { ...ContextMenuItems.BaseDuplicate, onSelect: () => duplicateLayers(targetLayers) },
                { ...ContextMenuItems.BaseMergeDown, onSelect: () => mergeToBelowLayer(layerId) },
                { ...ContextMenuItems.BaseClear, onSelect: async () => await clearLayersFromUser(targetLayers) },
                { ...ContextMenuItems.BaseRemove, onSelect: async () => await removeLayersFromUser(targetLayers) },
                {
                  ...(findLayerById(props.layer.id)?.enabled ? ContextMenuItems.BaseImageHide : ContextMenuItems.BaseImageShow),
                  onSelect: () => toggleLayerVisibility(targetLayers),
                },
              ],
              e
            );
          }}
          style={{
            animation: isHighlighted() ? 'blink 0.2s ease-in-out 0s 2' : 'none',
          }}
        >
          <div
            class={handle}
            style={{
              'pointer-events': props.layer.enabled ? 'auto' : 'none',
            }}
          >
            <div class={spinner} onClick={handleMoveUp}>
              <Icon src='/assets/icons/misc/triangle_7.png' base={7} color={color.surface} transform='rotate(180deg)' />
            </div>
            <div class={spinner} onClick={handleMoveDown}>
              <Icon src='/assets/icons/misc/triangle_7.png' base={7} color={color.surface} />
            </div>
          </div>
          <Show when={projectStore.layers.state.selectionEnabled}>
            <div
              class={selectCheckboxContainer}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Checkbox
                checked={projectStore.layers.state.selected.has(props.layer.id)}
                onChange={(e) => {
                  if (e) selectLayer(props.layer.id);
                  else deselectLayer(props.layer.id);
                }}
              />
            </div>
          </Show>
          <LayerPreview layer={props.layer} onClick={onPreviewClicked} sizingMode='height-based' referenceSize={40} maxWidth={80} fitMode='cover' />
          <div
            class={textContent}
            style={{
              'pointer-events': props.layer.enabled ? 'auto' : 'none',
            }}
          >
            <div class={flexRow}>
              <p class={index}>{allLayers().length - props.index}.</p>
              <p class={type}>
                {props.layer.mode}. {Math.ceil(props.layer.opacity * 100)}%{props.layer.enabled ? '' : ` (inactive)`}
              </p>
            </div>
            {isNameChanging() ? (
              <input
                ref={(ref) => (inputRef = ref)}
                class={clsx(name, nameInput)}
                value={props.layer.name}
                onInput={(e) => {
                  setLayerName(props.layer.id, e.target.value);
                }}
                onBlur={(e) => {
                  const result = setLayerName(props.layer.id, e.currentTarget.value);
                  if (!result) setLayerName(props.layer.id, originalName());
                  setNameChanging(false);
                  e.target.selectionStart = 0;
                  e.target.selectionEnd = e.target.value.length;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const result = setLayerName(props.layer.id, e.currentTarget.value);
                    if (!result) setLayerName(props.layer.id, originalName());
                    setNameChanging(false);
                  }
                }}
              />
            ) : (
              <p
                class={name}
                ondblclick={() => {
                  setNameChanging(true);
                  setOriginalName(props.layer.name);
                  inputRef?.focus();
                }}
              >
                {props.layer.name}
              </p>
            )}
          </div>
          <Show when={!projectStore.layers.state.selectionEnabled}>
            <Light class={activeLight} on={isActive()} />
          </Show>
        </div>
      </div>
    </>
  );
};

export default LayerItem;
