const magnificationList: number[] = [1, 2, 4];
export const getNextMagnification = (dotMagnification: number) => {
  let index = magnificationList.findIndex((m) => m === dotMagnification);
  if (index != -1) {
    // 循環
    let nextIndex = index !== magnificationList.length - 1 ? index + 1 : 0;
    return magnificationList[nextIndex];
  } else return 1;
};

export function cloneImageData(src: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(src.data), // ← 必ず新しい配列
    src.width,
    src.height,
  );
}
