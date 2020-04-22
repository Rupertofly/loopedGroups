import { Voronoi } from 'd3-delaunay';

export function voronoiRegions() {}

export declare namespace voronoiRegions {
    type Point = [number, number];
    type Line = [Point, Point];
    type Loop = Point[];
    type Shape = Loop[];
    type Extent = [number, number, number, number];
    type GroupNumber = number;

    interface Edge<Boundary extends boolean = boolean> {
        line: Line;
        left: Boundary extends true ? never : number;
        right: number;
        isBoundary: Boundary;
    }

    interface Region<CategoryType = number> {
        members: Set<number>;
        type: CategoryType;
        regionID: number;
        borderEdges?: Edge[];
    }
    type RegionMap<CategoryType = number> = Map<number, Region<CategoryType>>;

    interface RegionEdges<CategoryType = number> {
        region: Region<CategoryType>;
        edges: Edge[];
    }
}
export default voronoiRegions;
