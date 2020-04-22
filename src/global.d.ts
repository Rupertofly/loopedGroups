declare type Point = [number, number];
declare type Line = [Point, Point];
declare type Loop = Point[];
declare type Shape = Loop[];
declare type Extent = [number, number, number, number];
declare type GroupNumber = number;
declare interface Edge<Boundary extends boolean = boolean> {
    line: Line;
    left: Boundary extends true ? never : number;
    right: number;
    isBoundary: Boundary;
}

declare interface Region<CategoryType = number> {
    members: Set<number>;
    type: CategoryType;
    regionID: number;
    borderEdges?: Edge[];
}
declare type RegionMap<CategoryType = number> = Map<
    number,
    Region<CategoryType>
>;
declare interface RegionEdges<CellType = number, CategoryType = number> {
    region: Region<CategoryType>;
    edges: Edge[];
}
