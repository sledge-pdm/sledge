
import { createPen, Pen } from "./data/Pen";
import { createLayer, LayerType } from "./data/Layer";
import { createStore } from "solid-js/store";

// color
export const [colorStore, setColorStore] = createStore({
    swatches: [
        "#000000",
        "#FFFFFF",
        "#ffff00",
        "#00ffff",
        "#00ff00",
        "#ff00ff",
        "#ff0000",
        "#0000ff",
        "#000080",
        "#400080"
    ]
});

// pen
export const [penStore, setPenStore] = createStore({
    usingIndex: 0,
    pens: [
        createPen("pen", 2, "#000000"),
        createPen("eraser", 4, "none")
    ]
});

// layer
export const [layerStore, setLayerStore] = createStore({
    imageLayer: createLayer("image1", LayerType.Image),
    layers: [
        createLayer("dot1", LayerType.Dot),
        createLayer("auto1", LayerType.Automate, false),
        createLayer("dot2", LayerType.Dot),
        createLayer("dot3", LayerType.Dot),
    ]
});

export const allLayers = () => [
    layerStore.imageLayer,
    ...layerStore.layers
];