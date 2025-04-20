import { v4 as uuidv4 } from "uuid";
import { showToast } from "~/stores/internal/toastStore";
import { layerStore } from "~/stores/project/layerStore";
import { DSL } from "../dsl/DSL";
import { initLayer } from "../layer/layerImage";
import { Layer, LayerType } from "../types/Layer";

export const createLayer = (
  name: string,
  type: LayerType,
  enabled = true,
  dotMagnification = 1,
  dsl?: DSL,
): Layer => {
  // check if name already exists
  const endNums = name.match(/^(.*)(\d+)$/);
  if (endNums && endNums.length >= 3) {
    const nameWithoutNum = endNums[1];
    const endNum = Number(endNums[2]);
    showToast(nameWithoutNum, "info", 1000);
    showToast(endNum, "info", 1000);

    const foundSameNameNums: number[] = [];
    layerStore.layers.forEach((layer) => {
      const layerEndNums = layer.name.match(/^(.*)(\d+)$/);
      if (layerEndNums && layerEndNums.length >= 3) {
        const layerNameWithoutNum = layerEndNums[1];
        const layerEndNum = Number(layerEndNums[2]);
        if (nameWithoutNum === layerNameWithoutNum) {
          foundSameNameNums.push(layerEndNum);
        }
      }
    });

    showToast(foundSameNameNums.join(","), "info", 1000);

    let num = endNum;
    while (foundSameNameNums.find((foundNum) => foundNum === num)) {
      num++;
    }

    showToast(`num ok!! ${num}`, "success", 1000);
    name = nameWithoutNum + num;
  }

  const id = uuidv4();
  initLayer(id, dotMagnification);
  return {
    id,
    name,
    type,
    typeDescription: getTypeString(type),
    enabled,
    dotMagnification,
    dsl: dsl || new DSL(id, id),
  };
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
