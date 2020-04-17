import GD from './GraphDiagram';
import { Edge, RegionMap } from './global';
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
    return (b: Edge) => matchPoint(a, b.line[0]);
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
function orientEdges(edges: Edge[], test: (a: Edge) => boolean): Edge[] {
    const output: Edge[] = [];

    for (const edge of edges) {
        if (test(edge)) {
            output.push(edge);
        } else {
            output.push(flip(edge));
        }
    }

    return output;
}
const nextPointHof = (a: Edge) => {
    return (b: Edge) => matchPoint(a.line[1], b.line[0]);
};

export function groupEdges<T, U>(
    edgeIterator: Iterable<Edge>,
    regions: RegionMap<T, U>
) {
    const regionDict = outputTable(regions);
    const edgeGroups = new Map<number, Edge[]>();
    const addEdge = (e: Edge, n: number) => {
        const gID = regionDict.get(n).groupID;

        if (edgeGroups.has(gID)) edgeGroups.get(gID)?.push(e);
        else edgeGroups.set(gID, [e]);
    };

    for (const edge of edgeIterator) {
        if (!edge) continue;
        addEdge(edge, edge.right || 0);
        if (edge.isBoundary === false) addEdge(flip(edge), edge.left);
    }

    return edgeGroups;
}
export function hullsFromGroup(
    regionEdges: Map<number, Edge[]>,
    groupTable: Map<number, { groupID: number; type: any }>
) {
    const hulls = new Map<number, loop[]>();
    const addLoop = (lp: loop, id: number) =>
        hulls.has(id) ? hulls.get(id).push(lp) : hulls.set(id, [lp]);
    const table = groupTable;

    for (const [eID, edges] of regionEdges) {
        const unvisitedEdges = orientEdges(
            edges.slice(),
            e => table.get(e.right).groupID === eID
        );

        while (unvisitedEdges.length > 0) {
            const firstPoint = unvisitedEdges.shift()!;
            const start = firstPoint.line[0];
            const lp = [start];
            let thisPt: point;
            let next = firstPoint.line[1] as point;

            do {
                const edgeMatcher = matchPointHof(next);
                const nextEdgeI = unvisitedEdges.findIndex(e =>
                    matchPoint(e.line[0], next)
                );

                if (nextEdgeI < 0) break;
                [thisPt, next] = unvisitedEdges.splice(nextEdgeI, 1)[0].line;
                lp.push(thisPt);
            } while (unvisitedEdges.length > 0 && !matchPoint(start, next));
            addLoop(lp, eID);
        }
    }

    return hulls;
}
/* export function hullsFromGroup(
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
 */
