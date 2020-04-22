declare type Point = [number, number];
declare type Line = [Point, Point];
declare type Loop = Point[];
declare type Extent = [number, number, number, number];
declare type GroupNumber = number;
declare interface Edge<Boundary extends boolean = boolean> {
    line: Line;
    left: Boundary extends true ? never : number;
    right: number;
    isBoundary: Boundary;
}

declare interface Region<CellType = number, CategoryType = number> {
    members: CellType[];
    type: CategoryType;
    regionID: number;
    borderEdges?: Edge[];
}
declare type RegionMap<CellType = number, CategoryType = number> = Map<
    number,
    Region<CellType, CategoryType>
>;
declare interface RegionEdges<CellType = number, CategoryType = number> {
    region: Region<CellType, CategoryType>;
    edges: Edge[];
}
