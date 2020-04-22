import { RegionList } from './getRegions';
/**
 * match two numbers to a super small level of uncertainty
 *
 * @param a - first number
 * @param b - second number
 * @returns whether the numbers match
 */
function matchNum(a: number, b: number) {
    const EPSILON = 1e-14;

    return Math.abs(a - b) < EPSILON;
}

/**
 * Match two points to a super small level of uncertainty
 *
 * @param a - first point
 * @param b - second point
 * @returns whther the points match
 */
function matchPoint(a: Point, b: Point) {
    return matchNum(a[0], b[0]) && matchNum(a[1], b[1]);
}
/**
 * flip an edge so it is facing the opposite direction
 *
 * @param edge - the edge to flip
 * @returns the flipped edge
 */
function flip(edge: Edge<false>): Edge<false> {
    const { line } = edge;
    const newLine: Line = [line[1], line[0]];

    return {
        line: newLine,
        right: edge.left,
        left: edge.right,
        isBoundary: edge.isBoundary
    };
}
/**
 * A group of edges, more or less an extension of a set of edges but has some convenience methods for working with the corresponding region
 *
 */
class EdgeGroup<CellCategory = number> extends Set<Edge> {
    /** corresponding region */
    readonly region: Region<CellCategory>;
    /** Returns the region ID */
    get regionID() {
        return this.region.regionID;
    }
    /**Returns the region type */
    get type() {
        return this.region.type;
    }
    /**
     * checks whether the corresponding region has a particular member
     *
     * @param i - index of the member
     * @returns whther the region has the member

     */
    hasMember(i: number) {
        return this.region.members.has(i);
    }
    /**
     * Creates an instance of EdgeGroup.
     * @param region - corresponding region to the group of edges
     */
    constructor(region: Region<CellCategory>) {
        super();
        this.region = region;
    }
}
/**
 * takes an iterable of edges and a list of regions and return a regionID indexed map of grouped edges, oriented with the region to their right
 *
 * @param edgeIterator - an iterator through d3-voronoi graph edges
 * @param regions - a regionlist of regions
 * @returns
 */
export function groupEdges<T, CellCategory>(
    edgeIterator: Iterable<Edge>,
    regions: RegionList<CellCategory>
) {
    const edgeGroups = new Map<number, EdgeGroup<CellCategory>>();
    const addEdge = (e: Edge, n: number) => {
        const region = regions.getRegion(n);

        if (region == undefined) return;
        const regionID = region.regionID;
        let eG = edgeGroups.get(regionID);

        if (eG) eG.add(e);
        else {
            eG = new EdgeGroup<CellCategory>(region);
            eG.add(e);
            edgeGroups.set(eG.regionID, eG);
        }
    };

    for (const edge of edgeIterator) {
        if (!edge) continue;
        const rRight = regions.getRegion(edge.right);

        if (edge.isBoundary == false) {
            const rLeft = regions.getRegion(edge.left);

            if (rRight === rLeft) continue;
        }

        addEdge(edge, edge.right!);
        if (edge.isBoundary === false)
            addEdge(flip(edge as Edge<false>), edge.left);
    }

    return edgeGroups;
}
/**
 * Takes a set of oriented edges and returns a set of closed loops
 * @param edgeGroup - the group of edges to arrange
 * @returns
 */
export function shapeFromEdgeGroup(edgeGroup: Set<Edge>): Shape {
    const hulls: Loop[] = [];
    const remainingEdges = Array.from(edgeGroup);

    while (remainingEdges.length > 0) {
        const startingEdge = remainingEdges.shift();
        let thisPoint: Point;
        let nextPoint: Point;

        if (startingEdge == undefined) break;
        thisPoint = startingEdge.line[0];
        nextPoint = startingEdge.line[1];
        const startingPoint = thisPoint;
        const loop: Loop = [];

        loop.push(startingPoint);
        while (
            remainingEdges.length > 0 &&
            !matchPoint(startingPoint, nextPoint)
        ) {
            const nextEdgeIndex = remainingEdges.findIndex(e =>
                matchPoint(e.line[0], nextPoint)
            );

            if (nextEdgeIndex < 0) break; // No more matching edges
            const nextEdge = remainingEdges.splice(nextEdgeIndex, 1)[0];

            if (nextEdge == undefined) break;
            thisPoint = nextEdge.line[0];
            nextPoint = nextEdge.line[1];
            loop.push(thisPoint);
        }
        if (loop.length > 2) hulls.push(loop);
    }

    return hulls;
}
