const magnificationList: number[] = [1, 2, 4]

export const getNextMagnification = (dotMagnification: number) => {
  const index = magnificationList.findIndex((m) => m === dotMagnification)
  if (index != -1) {
    // 循環
    const nextIndex = index !== magnificationList.length - 1 ? index + 1 : 0
    return magnificationList[nextIndex]
  } else return 1
}
