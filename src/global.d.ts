export declare type Pt = [number, number];
export declare type Line = [Pt, Pt];
export declare type Loop = Pt[];
export declare type Extent = [number, number, number, number];
export declare interface Edge {
    line: Line;
    left?: number;
    right?: number;
    isBoundary?: boolean;
}
