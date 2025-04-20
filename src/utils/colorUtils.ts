// "#rrggbb" -> r/g/b
export function hexToRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

// "#rrggbbaa" -> r/g/b/a
export function hexToRGBA(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  let a = parseInt(hex.slice(7, 9), 16)
  if (!a) a = 255 // ここがなかったので a=NaN となり、塗る際にエラー？
  return [r, g, b, a]
}

export function colorMatch(
  a: [number, number, number, number],
  b: [number, number, number, number]
): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
}
