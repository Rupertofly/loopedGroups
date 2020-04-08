import { Loop, Pt, Extent, Edge } from './global';
interface Boundary {
    pt: number;
    before?: number;
    after?: number;
    corner?: boolean;
}
const matchNo = (a: number, b: number, epsilon = 1e-26) =>
    Math.abs(a - b) < epsilon;
const bundleEdges = (
    boundaryPoints: Boundary[],
    constant: number,
    constantDim: 'x' | 'y'
) => {
    const edges: Edge[] = [];

    for (let i = 1; i < boundaryPoints.length; i++) {
        const st = boundaryPoints[i - 1];
        const ed = boundaryPoints[i];

        edges.push({
            right: st.after,
            line:
                constantDim == 'x'
                    ? [
                          [constant, st.pt],
                          [constant, ed.pt]
                      ]
                    : [
                          [st.pt, constant],
                          [ed.pt, constant]
                      ]
        });
    }

    return edges;
};

type dir = 'xMin' | 'yMin' | 'xMax' | 'yMax';
export class HullSegmenter {
    yMinPoints: Boundary[] = [];
    xMaxPoints: Boundary[] = [];
    yMaxPoints: Boundary[] = [];
    xMinPoints: Boundary[] = [];
    private xMin: number;
    private yMin: number;
    private xMax: number;
    private yMax: number;

    constructor(extent: Extent) {
        this.xMin = extent[0];
        this.yMin = extent[1];
        this.xMax = extent[2];
        this.yMax = extent[3];
        const [xMin, yMin, xMax, yMax] = extent;

        // yMin
        this.yMinPoints.push({ pt: xMin, corner: true, after: -1 });
        this.yMinPoints.push({ pt: xMax, corner: true, before: -1 });
        // xMax
        this.xMaxPoints.push({ pt: yMin, corner: true, after: -1 });
        this.xMaxPoints.push({ pt: yMax, corner: true, before: -1 });
        // yMax
        this.yMaxPoints.push({ pt: xMax, corner: true, after: -1 });
        this.yMaxPoints.push({ pt: xMin, corner: true, before: -1 });
        // xMin
        this.xMinPoints.push({ pt: yMax, corner: true, after: -1 });
        this.xMinPoints.push({ pt: yMin, corner: true, before: -1 });
    }

    addEdge(edge: Edge) {
        const { xMin, yMin, xMax, yMax } = this;
        const [fx, fy] = edge.line[1];
        const [bx, by] = edge.line[0];

        let pointAdded = false;
        // Foward

        // yMin
        if (matchNo(yMin, fy)) {
            this.yMinPoints.push({
                pt: fx,
                after: edge.right,
                before: edge.left
            });
            pointAdded = true;
        }
        // xMax
        if (matchNo(xMax, fx)) {
            this.xMaxPoints.push({
                pt: fy,
                after: edge.right,
                before: edge.left
            });
            pointAdded = true;
        }
        // yMax
        if (matchNo(yMax, fy)) {
            this.yMaxPoints.push({
                pt: fx,
                after: edge.right,
                before: edge.left
            });
            pointAdded = true;
        }
        // xMin
        if (matchNo(xMin, fx)) {
            this.xMinPoints.push({
                pt: fy,
                after: edge.right,
                before: edge.left
            });
            pointAdded = true;
        }
        // Backward

        // yMin
        if (matchNo(yMin, by)) {
            this.yMinPoints.push({
                pt: bx,
                after: edge.left,
                before: edge.right
            });
            pointAdded = true;
        }
        // xMax
        if (matchNo(xMax, bx)) {
            this.xMaxPoints.push({
                pt: by,
                after: edge.left,
                before: edge.right
            });
            pointAdded = true;
        }
        // yMax
        if (matchNo(yMax, by)) {
            this.yMaxPoints.push({
                pt: bx,
                after: edge.left,
                before: edge.right
            });
            pointAdded = true;
        }
        // xMin
        if (matchNo(xMin, bx)) {
            this.xMinPoints.push({
                pt: by,
                after: edge.left,
                before: edge.right
            });
            pointAdded = true;
        }

        return pointAdded;
    }
    getHullSegments() {
        const { xMin, yMin, xMax, yMax } = this;
        const sortedYMin = this.yMinPoints.slice(0).sort((a, b) => a.pt - b.pt);
        const sortedXMax = this.xMaxPoints.slice(0).sort((a, b) => a.pt - b.pt);
        const sortedYMax = this.yMaxPoints.slice(0).sort((a, b) => b.pt - a.pt);
        const sortedXMin = this.xMinPoints.slice(0).sort((a, b) => b.pt - a.pt);

        sortedYMin[0].after = sortedYMin[1].before;
        sortedYMax[0].after = sortedYMax[1].before;
        sortedXMin[0].after = sortedXMin[1].before;
        sortedXMax[0].after = sortedXMax[1].before;
        const edges: Edge[] = [];

        edges.push(...bundleEdges(sortedYMin, yMin, 'y'));
        edges.push(...bundleEdges(sortedXMax, xMax, 'x'));
        edges.push(...bundleEdges(sortedYMax, yMax, 'y'));
        edges.push(...bundleEdges(sortedXMin, xMin, 'x'));

        return edges;
    }
}
export default HullSegmenter;
