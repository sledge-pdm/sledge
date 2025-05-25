import { v4 } from 'uuid';
import { resetLayerImage } from '~/controllers/layer/LayerController';
import { DSL } from '~/models/dsl/DSL';
import { layerListStore } from '~/stores/ProjectStores';
import { BlendMode, Layer, LayerType } from './Layer';

type createLayerProps = Omit<Layer, 'id' | 'typeDescription' | 'dsl'> & {
  dsl: DSL | undefined;

  initImage: Uint8ClampedArray | undefined;
};

export const fallbackLayerProps: createLayerProps = {
  name: 'fb layer',
  type: LayerType.Dot,
  opacity: 1,
  mode: BlendMode.normal,
  enabled: true,
  dotMagnification: 1,
  dsl: undefined,

  initImage: undefined,
};

export const createLayer = (props: createLayerProps): Layer => {
  const name = getNumberUniqueLayerName(props.name);

  const id = v4();
  resetLayerImage(id, props.dotMagnification, props.initImage);

  return {
    id,
    name,
    type: props.type,
    typeDescription: getTypeString(props.type),
    opacity: props.opacity,
    mode: props.mode,
    enabled: props.enabled,
    dotMagnification: props.dotMagnification,
    dsl: props.dsl ?? new DSL(id, id),
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

export function getNumberUniqueLayerName(name: string) {
  const endNums = name.match(/^(.*)(\d+)$/);
  if (endNums && endNums.length >= 3) {
    const nameWithoutNum = endNums[1];
    const endNum = Number(endNums[2]);

    const foundSameNameNums: number[] = [];
    layerListStore.layers.forEach((layer) => {
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
  return name;
}
