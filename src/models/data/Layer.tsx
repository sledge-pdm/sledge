import { v4 as uuidv4 } from 'uuid';

export enum LayerType {
    Dot, Image, Automate
}

export type Layer = {
    id: string;
    name: string;
    type: LayerType;
    typeDescription: string;
    enabled: boolean;
};

export const createLayer = (
    name: string,
    type: LayerType,
    enabled = true
): Layer => ({
    id: uuidv4(),
    name,
    type,
    typeDescription: getTypeString(type),
    enabled,
});

function getTypeString(type: LayerType): string {
    switch (type) {
        case LayerType.Dot:
            return "dot layer.";
        case LayerType.Image:
            return "image layer.";
        case LayerType.Automate:
            return "automate layer.";
        default:
            return "N/A.";
    }
}