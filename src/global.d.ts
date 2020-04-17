export declare type Pt = [number, number];
export declare type Line = [Pt, Pt];
export declare type Loop = Pt[];
export declare type Extent = [number, number, number, number];
export declare type GroupNumber = number;
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

export declare interface Region<CellType = number, CategoryType = number> {
    members: CellType[];
    type: CategoryType;
    regionID: GroupNumber;
    borderEdges?: Edge[];
}
export declare type RegionMap<CellType = number, CategoryType = number> = Map<
    GroupNumber,
    Region<CellType, CategoryType>
>;
export declare interface RegionEdges<CellType = number, CategoryType = number> {
    region: Region<CellType, CategoryType>;
    edges: Edge[];
}
