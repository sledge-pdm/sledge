// io/project/jsonTyped.ts
type JMap = { $type: 'Map'; value: [unknown, unknown][] };
type JArr = { $type: 'U8'; value: number[] };

export const mapReplacer: (this: any, key: string, value: any) => any = (_, v) => {
  if (v instanceof Map) return { $type: 'Map', value: [...v] } as JMap;
  if (v instanceof Uint8ClampedArray) return { $type: 'U8', value: [...v] } as JArr;
  return v;
};

export const mapReviver: (this: any, key: string, value: any) => any = (_, v) => {
  if (v?.$type === 'Map') return new Map(v.value);
  if (v?.$type === 'U8') return Uint8ClampedArray.from(v.value);
  return v;
};
