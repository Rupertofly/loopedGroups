export type Pt = [number, number];
export type Line = [Pt, Pt];
export type Loop = Pt[];
export type Extent = [number, number, number, number];
export interface Edge {
    line: Line;
    left?: number;
    right?: number;
    isBoundary?: boolean;
}
