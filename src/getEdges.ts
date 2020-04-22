import { Voronoi } from 'd3-delaunay';
import HullSegmenter from './HullSegmenter';
/**
 * gets the region code of a point
 * @param x - x positon
 * @param y - y position
 * @param ext - extent
 */
function regioncode(x: number, y: number, [xmin, ymin, xmax, ymax]: Extent) {
    return (
        (x < xmin ? 0b0001 : x > xmax ? 0b0010 : 0b0000) |
        (y < ymin ? 0b0100 : y > ymax ? 0b1000 : 0b0000)
    );
}

function clipSegment(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    c0: number,
    c1: number,
    ex: Extent
): [number, number, number, number] | null {
    const [xmin, ymin, xmax, ymax] = ex;

    while (true) {
        if (c0 === 0 && c1 === 0) return [x0, y0, x1, y1];
        if (c0 & c1) return null;
        let x: number;
        let y: number;
        const c = c0 || c1;

        if (c & 0b1000) {
            x = x0 + ((x1 - x0) * (ymax - y0)) / (y1 - y0);
            y = ymax;
        } else if (c & 0b0100) {
            x = x0 + ((x1 - x0) * (ymin - y0)) / (y1 - y0);
            y = ymin;
        } else if (c & 0b0010) {
            y = y0 + ((y1 - y0) * (xmax - x0)) / (x1 - x0);
            x = xmax;
        } else {
            y = y0 + ((y1 - y0) * (xmin - x0)) / (x1 - x0);
            x = xmin;
        }
        if (c0) {
            x0 = x;
            y0 = y;
            c0 = regioncode(x0, y0, ex);
        } else {
            x1 = x;
            y1 = y;
            c1 = regioncode(x1, y1, ex);
        }
    }
}

function processLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    ex: Extent
) {
    let context: any;

    const c0 = regioncode(x0, y0, ex);
    const c1 = regioncode(x1, y1, ex);

    if (c0 === 0 && c1 === 0) {
        return [
            [x0, y0],
            [x1, y1]
        ] as Line;
    }
    const S = clipSegment(x0, y0, x1, y1, c0, c1, ex);

    if (S)
        return [
            [S[0], S[1]],
            [S[2], S[3]]
        ] as Line;
}
function projectEdge(
    x0: number,
    y0: number,
    vx: number,
    vy: number,
    ex: Extent
): Point | null {
    const [xmin, ymin, xmax, ymax] = ex;
    let t = Infinity;
    let c: number;
    let x = 0;
    let y = 0;

    if (vy < 0) {
        // top
        if (y0 <= ymin) return null;
        if ((c = (ymin - y0) / vy) < t) (y = ymin), (x = x0 + (t = c) * vx);
    } else if (vy > 0) {
        // bottom
        if (y0 >= ymax) return null;
        if ((c = (ymax - y0) / vy) < t) (y = ymax), (x = x0 + (t = c) * vx);
    }
    if (vx > 0) {
        // right
        if (x0 >= xmax) return null;
        if ((c = (xmax - x0) / vx) < t) {
            x = xmax;
            y = y0 + (t = c) * vy;
        }
    } else if (vx < 0) {
        // left
        if (x0 <= xmin) return null;
        if ((c = (xmin - x0) / vx) < t) {
            x = xmin;
            y = y0 + (t = c) * vy;
        }
    }

    return [x, y];
}

/**
 * Returns an iterator over all edges in the voronoi diagram, eacg edge consists of a line, cell indexs of both it's left and right side, and a boolean of whether the edge is on the border (and has only one neighbouring cell)
 *
 *
 * @param vor - d3-delauny voronoi diagram
 * @returns iterator over edges
 */
export function* getEdges(vor: Voronoi<any>): Generator<Edge, void, unknown> {
    const {
        delaunay: { halfedges, inedges, hull: hll, triangles },
        circumcenters,
        vectors
    } = vor;
    const hull: Float32Array = hll as any;
    const extent: Extent = [vor.xmin, vor.ymin, vor.xmax, vor.ymax];
    const hullSegmentSolver = new HullSegmenter(extent);

    function createInnerEdge(edgeLine: Line, j: number, i: number) {
        return {
            line: edgeLine,
            left: Math.floor(triangles[j]),
            right: Math.floor(triangles[i]),
            isBoundary: false
        } as Edge;
    }

    if (hull.length <= 1) return;
    for (let i = 0, n = halfedges.length; i < n; ++i) {
        const j = halfedges[i];

        if (j < i) continue;
        const ti = Math.floor(i / 3) * 2;
        const tj = Math.floor(j / 3) * 2;
        const xi = circumcenters[ti];
        const yi = circumcenters[ti + 1];
        const xj = circumcenters[tj];
        const yj = circumcenters[tj + 1];
        const edgeLine = processLine(xi, yi, xj, yj, extent);

        if (edgeLine) {
            const ed = createInnerEdge(edgeLine, j, i);

            hullSegmentSolver.addEdge(ed);
            yield ed;
        }
    }
    let prevIndex: number;
    let currentIndex = hull[hull.length - 1];

    for (let i = 0; i < hull.length; ++i) {
        prevIndex = currentIndex;
        currentIndex = hull[i];
        const t = Math.floor(inedges[currentIndex] / 3) * 2;
        const x = circumcenters[t];
        const y = circumcenters[t + 1];
        const v = prevIndex * 4;
        const p = projectEdge(x, y, vectors[v + 2], vectors[v + 3], extent);

        if (p) {
            const edgeLine = processLine(x, y, p[0], p[1], extent);

            if (edgeLine) {
                const edge = {
                    line: edgeLine,
                    left: currentIndex,
                    right: prevIndex,
                    isBoundary: false
                } as Edge;

                hullSegmentSolver.addEdge(edge);
                yield edge;
            }
        }
    }
    const eds = hullSegmentSolver.getHullSegments();

    for (const ed of eds) {
        yield ed;
    }

    return;
}
export default getEdges;
