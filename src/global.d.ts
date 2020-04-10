export declare type Pt = [number, number];
export declare type Line = [Pt, Pt];
export declare type Loop = Pt[];
export declare type Extent = [number, number, number, number];
interface InnerEdge {
    line: Line;
    left: number;
    right: number;
    isBoundary: false;
}
interface BoundaryEdge {
    line: Line;
    right: number | undefined;
    left: number | undefined;
    isBoundary: true;
}
export declare type Edge = InnerEdge | BoundaryEdge;

export declare interface Region<T, U> {
    members: T[];
    type: U;
    regionID: number;
}
