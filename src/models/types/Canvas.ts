export type Canvas = {
  width: number;
  height: number;
};

export const createCanvas = (width = 200, height = 300): Canvas => ({
  width,
  height,
});
