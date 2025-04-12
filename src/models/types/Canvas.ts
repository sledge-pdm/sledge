export type Canvas = {
  width: number;
  height: number;
};

export const createCanvas = (width = 800, height = 1200): Canvas => ({
  width,
  height,
});
