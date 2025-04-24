import { createSortable, useDragDropContext } from "@thisbeyond/solid-dnd";
import { Component } from "solid-js";
import Light from "~/components/common/Light";
import { getNextMagnification } from "~/models/factories/utils";
import { Layer, LayerType } from "~/models/types/Layer";
import { layerStore, setLayerStore } from "~/stores/project/layerStore";
import {
  activeLight,
  dotMagnifContainer,
  dotMagnifText,
  layerItem,
  layerItemDisabled,
  layerItemName,
  layerItemType,
} from "~/styles/section/layer.css";
import { w100 } from "~/styles/snippets.css";
import LayerPreview from "../../common/LayerPreview";

interface LayerItemProps {
  index: number;
  layer: Layer;
  draggingId?: string | null;
}

const LayerItem: Component<LayerItemProps> = (props) => {
  const { layer, draggingId } = props;

  const sortable = createSortable(layer.id);
  const context = useDragDropContext();
  const state = context?.[0];

  let detClass: "dot" | "image" | "automate" | undefined;
  switch (layer.type) {
    case LayerType.Dot:
      detClass = "dot";
      break;
    case LayerType.Image:
      detClass = "image";
      break;
    case LayerType.Automate:
      detClass = "automate";
      break;
  }

  const onDetClicked = () => {
    setLayerStore("activeLayerId", layer.id);
  };

  const onPreviewClicked = () => {
    if (props.index !== -1) {
      setLayerStore("layers", props.index, "enabled", (v: boolean) => !v);
    }
  };

  const onMagnifClicked = () => {
    const next = getNextMagnification(layer.dotMagnification);
    if (props.index !== -1) {
      setLayerStore("layers", props.index, "dotMagnification", next);
    }
  };

  const isActive = () => layerStore.activeLayerId === layer.id;

  return (
    <div
      class={w100}
      classList={{
        "opacity-50": sortable.isActiveDraggable,
        "transition-transform": state && !!state.active.draggable,
      }}
      style={{ opacity: draggingId === layer.id ? 0.4 : 1 }}
      ref={sortable}
    >
      <p class={layerItemType}>{layer.typeDescription}</p>
      <p>{props.index}.</p>
      <div style={{ display: "flex", "align-items": "center" }}>
        {/* <DSLButton /> */}
        <div
          class={[layerItem, !layer.enabled && layerItemDisabled]
            .filter(Boolean)
            .join(" ")}
          onClick={onDetClicked}
        >
          <LayerPreview
            layer={layer}
            onClick={onPreviewClicked}
            maxHeight={30}
            maxWidth={30}
          />
          <p class={layerItemName}> {layer.name}</p>
          <div
            class={dotMagnifContainer}
            onClick={(e) => {
              e.stopPropagation();
              onMagnifClicked();
            }}
            onMouseOver={(e) => e.stopPropagation()}
          >
            <p class={dotMagnifText}>x{layer.dotMagnification}</p>
          </div>
          <Light class={activeLight} on={isActive()} />
        </div>
      </div>
    </div>
  );
};

export default LayerItem;
