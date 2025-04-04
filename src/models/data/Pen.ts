import { v4 as uuidv4 } from 'uuid';

export type Pen = {
    id: string;
    name: string,
    size: number,
    color: string,
}

export const createPen = (
    name: string,
    size: number,
    color: string,
): Pen => ({
    id: uuidv4(),
    name,
    size,
    color,
});