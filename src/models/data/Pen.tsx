export type Pen = {
    name: string,
    size: number,
    color: string,
}

export const createPen = (
    name: string,
    size: number,
    color: string,
): Pen => ({
    name,
    size,
    color,
});