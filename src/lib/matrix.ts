export type Point = {
    x: number;
    y: number;
}

export type Rectangle = [Point, Point];

export function insideRectangle({ x, y }: Point, rect: Rectangle) {
    const minX = Math.min(rect[0].x, rect[1].x);
    const maxX = Math.max(rect[0].x, rect[1].x);
    const minY = Math.min(rect[0].y, rect[1].y);
    const maxY = Math.max(rect[0].y, rect[1].y);
    return minX <= x && x <= maxX && minY <= y && y <= maxY;
}

export function fillRectangle<T>(values: T[][], rectangle: Rectangle, setValue: T): T[][] {
    return values.map((row, x) => row.map((value, y) => {
        return insideRectangle({ x, y }, rectangle) ? setValue : value;
    }));
}
