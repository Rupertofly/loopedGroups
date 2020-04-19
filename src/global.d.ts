export declare type Point = [number, number];
export declare type Line = [Point, Point];
export declare type Loop = Point[];
export declare type Extent = [number, number, number, number];
export declare type GroupNumber = number;
export declare interface Edge<Boundary extends boolean = boolean> {
    line: Line;
    left: Boundary extends true ? never : number;
    right: number;
    isBoundary: Boundary;
}

export declare interface Region<CellType = number, CategoryType = number> {
    members: CellType[];
    type: CategoryType;
    regionID: number;
    borderEdges?: Edge[];
}
export declare type RegionMap<CellType = number, CategoryType = number> = Map<
    number,
    Region<CellType, CategoryType>
>;
export declare interface RegionEdges<CellType = number, CategoryType = number> {
    region: Region<CellType, CategoryType>;
    edges: Edge[];
}
