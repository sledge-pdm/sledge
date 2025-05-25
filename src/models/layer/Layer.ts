import { DSL } from '~/models/dsl/DSL';

export enum LayerType {
  Dot,
  Image,
  Automate,
}

export enum BlendMode {
  normal = 'normal',
  multiply = 'multiply',
}

export type Layer = {
  id: string;
  name: string;
  type: LayerType;
  typeDescription: string; // 各タイプの説明
  enabled: boolean;
  opacity: number;
  mode: BlendMode;
  dotMagnification: number;
  dsl: DSL;
};
