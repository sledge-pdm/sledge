import { v4 as uuidv4 } from "uuid";

export enum LayerType {
  Dot,
  Image,
  Automate,
}

export type Layer = {
  id: string;
  name: string;
  type: LayerType;
  typeDescription: string; // 各タイプの説明
  enabled: boolean;
  dotMagnification: number;
};

export const createLayer = (
  name: string,
  type: LayerType,
  enabled = true,
  dotMagnification = 1
): Layer => ({
  id: uuidv4(),
  name,
  type,
  typeDescription: getTypeString(type),
  enabled,
  dotMagnification,
});

const magnificationList: number[] = [1, 2, 4];
export const getNextMagnification = (dotMagnification: number) => {
  let index = magnificationList.findIndex((m) => m === dotMagnification);
  if (index != -1) {
    // 循環
    let nextIndex = index !== magnificationList.length - 1 ? index + 1 : 0;
    return magnificationList[nextIndex];
  } else return 1;
};

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
