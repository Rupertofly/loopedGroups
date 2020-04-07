
import GD from './GraphDiagram';
function matchNum(a: number, b: number) {
    const EPSILON = 1e-9;

    return Math.abs(a - b) < EPSILON;
}

type point = [number, number];
type cellEdge = GD.edge<any>;
type loop = point[];

function matchPoint(a: point, b: point) {
    return matchNum(a[0], b[0]) && matchNum(a[1], b[1]);
}
function matchPointHof(a: point) {
    return (b: cellEdge) => matchPoint(a, b[0]);
}
function orientEdge(
    edge: GD.edge<CellPoint>,
    type: string,
    group: number
): GD.edge<CellPoint> {
    const { left, right } = edge;

    if (right && right.type === type && right.group === group) {
        // flip edge
        const newEdge = Object.assign(
            [edge[1], edge[0]] as GD.edge<CellPoint>,
            {
                left: right,
                right: left
            }
        );

        return newEdge;
    } else {
        return edge;
    }
}
const nextPointHof = (a: cellEdge) => {
    return (b: cellEdge) => matchPoint(a[1], b[0]);
};

export function hullsFromGroup(
    edges: GD.edge<CellPoint>[],
    type: string,
    group: number
) {
    edges = edges.map(e => orientEdge(e, type, group));
    const unvisitedEdges = edges.slice(0);
    const hulls: loop[] = [];

    while (unvisitedEdges.length > 0) {
        const firstPoint = unvisitedEdges.shift();
        const start = firstPoint[0];
        const lp = [start];
        let thisPt: point;
        let next = firstPoint[1] as point;

        hulls.push(lp);
        while (unvisitedEdges.length > 0 && !matchPoint(start, next)) {
            const nextEdgeI = unvisitedEdges.findIndex(matchPointHof(next));

            if (nextEdgeI < 0) break;
            [thisPt, next] = unvisitedEdges.splice(nextEdgeI, 1)[0];
            lp.push(thisPt);
        }
    }

    return hulls;
}
