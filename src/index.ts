import { Voronoi } from 'd3-delaunay';
import { getRegions } from './getRegions';
import { groupEdges, shapeFromEdgeGroup, EdgeGroup } from './getHulls';
import getEdges from './getEdges';
import { Region, Shape } from './global';

export interface VoronoiReturnObject<CellCat> {
    region: Region<CellCat>;
    edgeGroup: EdgeGroup<CellCat>;
    shape: Shape;
}
export function* voronoiRegions<CellKind, CellCategory>(
    graph: Voronoi<any>,
    pts: CellKind[],
    categoryAcc: (d: CellKind) => CellCategory
): Iterable<VoronoiReturnObject<CellCategory>> {
    const regions = getRegions(graph, i => categoryAcc(pts[i]));
    const edgeGroups = groupEdges(getEdges(graph), regions);

    for (const edgeGroup of edgeGroups.values()) {
        const edgeShape = shapeFromEdgeGroup(edgeGroup);

        yield {
            region: edgeGroup.region,
            edgeGroup,
            shape: edgeShape
        };
    }
}
export * from './global';
export default voronoiRegions;
export { getRegions } from './getRegions';
export { getEdges } from './getEdges';
