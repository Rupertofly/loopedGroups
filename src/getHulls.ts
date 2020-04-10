import GD from './GraphDiagram';
import { Edge } from './global';
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
function flip(edge: Edge): Edge {
    const { line, isBoundary } = edge;
    const temp = edge.right;
    const right = edge.left;
    const left = temp;

    return { line, left, right, isBoundary };
}
function orientEdge<U>(edge: Edge, test: (a: Edge) => boolean): Edge {
    if (test(edge)) {
        // flip edge
        return flip(edge);
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
