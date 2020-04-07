import { Delaunay, Voronoi } from 'd3-delaunay';
import { range } from 'd3';
type pt = [number, number];
export class GraphDiagram<T extends XYVector> {
    points: T[];
    edgePoints: (XYVector & { boundary?: boolean })[];
    delaunayGraph: Delaunay<T>;
    voronoiGraph: Voronoi<T>;
    extent: [number, number, number, number];
    constructor(
        extent: [number, number, number, number],
        points: T[],
        borderWidth: number
    ) {
        this.edgePoints = [];
        const [pointMinX, pointMinY, width, height] = extent;

        for (const x of range(pointMinX, width, borderWidth)) {
            this.edgePoints.push({ x, y: pointMinY, boundary: true });
            this.edgePoints.push({ x, y: height, boundary: true });
        }
        for (const y of range(pointMinY, height, borderWidth)) {
            this.edgePoints.push({ y, x: pointMinX }, { y, x: width });
        }
        this.points = points;
        this.delaunayGraph = Delaunay.from(
            [...this.points, ...this.edgePoints],
            p => p.x,
            p => p.y
        );
        this.extent = extent;
        this.voronoiGraph = this.delaunayGraph.voronoi(extent);
    }
    polygon(i: number): GraphDiagram.GraphPolygon<T> {
        const thisPolygon = this.voronoiGraph.cellPolygon(i);

        if (!thisPolygon) return [] as GraphDiagram.GraphPolygon<T>;

        return Object.assign(thisPolygon, {
            data: this.points[i] || undefined
        }) as GraphDiagram.GraphPolygon<T>;
    }
    updatePoints(points: T[]) {
        this.points = points;
        this.delaunayGraph = Delaunay.from(
            [...this.points, ...this.edgePoints],
            p => p.x,
            p => p.y
        );
        this.voronoiGraph = this.delaunayGraph.voronoi(this.extent);
    }
    neighbors(i: number): T[] {
        return [...this.voronoiGraph.neighbors(i)].map(j => this.points[j]);
    }
    edges() {
        if (this.voronoiGraph.delaunay.hull.length <= 1) return [];
        const output: GraphDiagram.edge<T>[] = [];
        const {
            delaunay: { halfedges, inedges, hull },
            circumcenters,
            vectors
        } = this.voronoiGraph;

        for (const i of range(halfedges.length)) {
            const j = halfedges[i];

            if (j < i) continue;
            const lhp = this.points[this.delaunayGraph.triangles[i]];
            const rhp = this.points[this.delaunayGraph.triangles[j]];
            const triI = Math.floor(i / 3) * 2;
            const triJ = Math.floor(j / 3) * 2;
            const vxI: pt = [circumcenters[triI], circumcenters[triI + 1]];
            const vxJ: pt = [circumcenters[triJ], circumcenters[triJ + 1]];

            output.push(
                Object.assign([vxI, vxJ] as [pt, pt], {
                    left: lhp,
                    right: rhp
                })
            );
        }
        let h0: number;
        let h1 = this.delaunayGraph.hull[this.delaunayGraph.hull.length - 1];

        for (const i of range(hull.length)) {
            h0 = h1;
            h1 = hull[i];
        }

        return output;
    }
}
export default GraphDiagram;

export namespace GraphDiagram {
    type polygon = [number, number][];
    export interface GraphPolygon<T> extends polygon {
        data: T;
    }
    export type edge<T> = [[number, number], [number, number]] & {
        left: T;
        right: T;
    };
}
interface XYVector {
    x: number;
    y: number;
}
