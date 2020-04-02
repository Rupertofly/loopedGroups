import { Voronoi, Delaunay } from 'd3-delaunay';
type pt = [number, number];
type line = [pt, pt];
interface Edge extends line {
    left?: number;
    right?: number;
}
export function getEdges<C>(diagram: Voronoi<C>, cells: C[]) {
    const {
        delaunay: { halfedges, inedges, hull },
        circumcenters,
        vectors
    } = diagram;

    function _project(x0: number, y0: number, vx: number, vy: number) {
        let t = Infinity;
        let c: number;
        let x: number;
        let y: number;

        if (vy < 0) {
            // top
            if (y0 <= diagram.ymin) return null;
            if ((c = (diagram.ymin - y0) / vy) < t)
                (y = diagram.ymin), (x = x0 + (t = c) * vx);
        } else if (vy > 0) {
            // bottom
            if (y0 >= diagram.ymax) return null;
            if ((c = (diagram.ymax - y0) / vy) < t)
                (y = diagram.ymax), (x = x0 + (t = c) * vx);
        }
        if (vx > 0) {
            // right
            if (x0 >= diagram.xmax) return null;
            if ((c = (diagram.xmax - x0) / vx) < t)
                (x = diagram.xmax), (y = y0 + (t = c) * vy);
        } else if (vx < 0) {
            // left
            if (x0 <= diagram.xmin) return null;
            if ((c = (diagram.xmin - x0) / vx) < t)
                (x = diagram.xmin), (y = y0 + (t = c) * vy);
        }

        return [x, y];
    }

    const edges: Edge[] = [];

    if ((hull as any).length <= 1) return null;
    for (let i = 0; i < halfedges.length; ++i) {
        const j = halfedges[i];

        if (j < i) continue;
        const ti = Math.floor(i / 3) * 2;
        const tj = Math.floor(j / 3) * 2;
        const xi = circumcenters[ti];
        const yi = circumcenters[ti + 1];
        const xj = circumcenters[tj];
        const yj = circumcenters[tj + 1];

        edges.push(
            Object.assign(
                [
                    [xi, yi],
                    [xj, yj]
                ] as line,
                {
                    left: j,
                    right: i
                }
            )
        );
    }
    let h0,
        h1 = hull[(hull as any).length - 1];

    for (let i = 0; i < (hull as any).length; ++i) {
        (h0 = h1), (h1 = hull[i]);
        const t = Math.floor(inedges[h1] / 3) * 2;
        const x = circumcenters[t];
        const y = circumcenters[t + 1];
        const v = h0 * 4;
        const p = _project(x, y, vectors[v + 2], vectors[v + 3]);

        if (p) {
            const ln = [
                [x, y],
                [p[0], p[1]]
            ] as line;

            edges.push(ln);
        }
    }

    return edges;
}
