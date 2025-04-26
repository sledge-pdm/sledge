import { v4 as uuidv4 } from 'uuid';
import { DSL } from '../dsl/DSL';
import initLayerImage from './initLayerImage';
import { layerStore } from '~/stores/project/layerStore';
import { Layer, LayerType } from '~/types/Layer';

export const createLayer = (
  name: string,
  type: LayerType,
  enabled = true,
  dotMagnification = 1,
  dsl?: DSL
): Layer => {
  console.log('yeah tried');
  // check if name already exists
  const endNums = name.match(/^(.*)(\d+)$/);
  if (endNums && endNums.length >= 3) {
    const nameWithoutNum = endNums[1];
    const endNum = Number(endNums[2]);

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

    let num = endNum;
    while (foundSameNameNums.find((foundNum) => foundNum === num)) {
      num++;
    }
    name = nameWithoutNum + num;
  }

  const id = uuidv4();
  initLayerImage(id, dotMagnification);

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
      return 'dot layer.';
    case LayerType.Image:
      return 'image layer.';
    case LayerType.Automate:
      return 'automate layer.';
    default:
      return 'N/A.';
  }
}
