export declare type Point = [number, number];
export declare type Line = [Point, Point];
export declare type Loop = Point[];
export declare type Shape = Loop[];
export declare type Extent = [number, number, number, number];
export declare type GroupNumber = number;
export declare interface Edge<Boundary extends boolean = boolean> {
    line: Line;
    left: Boundary extends true ? never : number;
    right: number;
    isBoundary: Boundary;
}

export declare interface Region<CategoryType = number> {
    members: Set<number>;
    type: CategoryType;
    regionID: number;
    borderEdges?: Edge[];
}
export declare type RegionMap<CategoryType = number> = Map<
    number,
    Region<CategoryType>
>;
export declare interface RegionEdges<CategoryType = number> {
    region: Region<CategoryType>;
    edges: Edge[];
}
