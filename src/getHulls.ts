import { RegionList } from './getRegions';
function matchNum(a: number, b: number) {
    const EPSILON = 1e-14;

    return Math.abs(a - b) < EPSILON;
}

let isBoundary = false;

isBoundary = false;
function matchPoint(a: Point, b: Point) {
    return matchNum(a[0], b[0]) && matchNum(a[1], b[1]);
}
function flip(edge: Edge<false>): Edge<false> {
    const { line, isBoundary } = edge;
    const newLine: Line = [line[1], line[0]];
    const temp = edge.right;
    const right = edge.left;
    const left = temp;

    return {
        line: newLine,
        right: edge.left,
        left: edge.right,
        isBoundary: edge.isBoundary
    };
}
function orientEdge(edge: Edge, test: (a: Edge) => boolean): Edge {
    if (test(edge)) {
        return edge;
    } else {
        const { isBoundary } = edge;

        if (isBoundary === true)
            throw new Error(
                `yo your test is fucked ${test.toString()} fucks up because it should never need to flip a boundary`
            );
        else {
            return flip(edge as Edge<typeof isBoundary>);
        }
    }
}
function orientEdges(edges: Edge[], test: (a: Edge) => boolean): Edge[] {
    const output: Edge[] = [];

    for (const edge of edges) {
        if (test(edge)) {
            output.push(edge);
        } else {
            const { isBoundary } = edge;

            if (isBoundary === true)
                throw new Error(
                    `yo your test is fucked ${test.toString()} fucks up because it should never need to flip a boundary`
                );
            else {
                output.push(flip(edge as Edge<typeof isBoundary>));
            }
        }
    }

    return output;
}
const nextPointHof = (a: Edge) => {
    return (b: Edge) => matchPoint(a.line[1], b.line[0]);
};

export class EdgeGroup<T = number, U = number> extends Array<Edge> {
    region: Region<T, U>;
    get regionID() {
        return this.region.regionID;
    }
    get type() {
        return this.region.type;
    }
    has(i: T) {
        return this.region.members.includes(i);
    }
    constructor(region: Region<T, U>) {
        super();
        this.region = region;
    }
}
export function groupEdges<T, U>(
    edgeIterator: Iterable<Edge>,
    regions: RegionList<number, U>
) {
    const edgeGroups = new Map<number, EdgeGroup<number, U>>();
    const addEdge = (e: Edge, n: number) => {
        const region = regions.getRegion(n);

        if (region == undefined) return;
        const regionID = region.regionID;
        let eG = edgeGroups.get(regionID);

        if (eG) eG.push(e);
        else {
            eG = new EdgeGroup<number, U>(region);
            eG.push(e);
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
export function unvisitedEdges<U>(edgeGroup: EdgeGroup<number, U>): Edge[] {
    const output: Edge[] = [];

    for (const edge of edgeGroup) {
        const orientedEdge = orientEdge(edge, e => edgeGroup.has(e.right));

        output.push(orientedEdge);
    }

    return output;
}
export function hullsFromGroup(edgeGroup: EdgeGroup<number, any>): Loop[] {
    const hulls: Loop[] = [];
    const remainingEdges = edgeGroup.slice(0);
    const visitedEdges: Edge[] = [];

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
// export function hullsFromGroup<T, U>(regionEdges: RegionEdges<T, U>) {
//     const hulls = new Map<number, loop[]>();
//     const addLoop = (lp: loop, id: number) =>
//         hulls.has(id) ? hulls.get(id)!.push(lp) : hulls.set(id, [lp]);

//     for (const edge of regionEdges.edges) {
//         const unvisitedEdges = orientEdges(
//             edges.slice(),
//             e => regionEdges.get(e.right).groupID === eID
//         );

//         while (unvisitedEdges.length > 0) {
//             const firstPoint = unvisitedEdges.shift()!;
//             const start = firstPoint.line[0];
//             const lp = [start];
//             let thisPt: point;
//             let next = firstPoint.line[1] as point;

//             do {
//                 const edgeMatcher = matchPointHof(next);
//                 const nextEdgeI = unvisitedEdges.findIndex(e =>
//                     matchPoint(e.line[0], next)
//                 );

//                 if (nextEdgeI < 0) break;
//                 [thisPt, next] = unvisitedEdges.splice(nextEdgeI, 1)[0].line;
//                 lp.push(thisPt);
//             } while (unvisitedEdges.length > 0 && !matchPoint(start, next));
//             addLoop(lp, eID);
//         }
//     }

//     return hulls;
// }
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
