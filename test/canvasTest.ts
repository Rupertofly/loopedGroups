import '../src/global';
import * as d from 'd3-delaunay';
import * as CAP from '@rupertofly/capture-client';
import * as h from '@rupertofly/h';

import { getRegions, RegionList } from '../src/getRegions';
import { groupEdges, hullsFromGroup } from '../src/getHulls';
import { polygonCentroid as centroid, polygonCentroid } from 'd3-polygon';
import { getEdges } from '../src/getEdges';
import * as jsc from 'js-angusj-clipper';
import { Shape } from '@rupertofly/h';
let c: jsc.ClipperLibWrapper;

interface Cell {
    pt: Point;
    type: number;
}
interface RegionIdentity<U> {
    groupID: number;
    type: U;
}
type Ip = { x: number; y: number };
const toIntPoint = (a: Point) => ({ x: a[0] * 100, y: a[1] * 100 });
const toPath = (a: Loop) => a.map(toIntPoint);
const toPoly = (a: Shape) => a.map(toPath);
const fromIntPoint = (a: Ip) => [a.x / 100, a.y / 100] as Point;
const fromPath = (a: Ip[]) => a.map(fromIntPoint) as Loop;
const fromPoly = (a: Ip[][]) => a.map(fromPath) as Shape;

function offsetShape(shape: Shape, amt: number) {
    const poly = toPoly(shape);
    const output = c.offsetToPaths({
        delta: amt * 100,
        offsetInputs: [
            {
                data: poly,
                endType: jsc.EndType.ClosedPolygon,
                joinType: jsc.JoinType.Miter
            }
        ]
    });

    return fromPoly(output);
}
const pts: Cell[] = [];
const cv = document.createElement('canvas');

cv.width = 1080;
cv.height = 1920;
const EXTENT = [3, 3, cv.width - 3, cv.height - 3];

let diag: d.Delaunay<Cell>;
let nikPantis: d.Voronoi<Cell>;
let regions: RegionList<number, number>;

for (let i = 0; i < 256; i++) {
    pts.push({
        pt: [5 + Math.random() * 100 - 5, 5 + Math.random() * 100 - 5],
        type: i % 6
    });
}
diag = d.Delaunay.from(pts.map(d => d.pt));
nikPantis = diag.voronoi(EXTENT);
regions = getRegions<any, number>(pts, nikPantis, (d, i, a) => a[i].type);
const gEdges = groupEdges(getEdges(nikPantis), regions);
const ctx = cv.getContext('2d');
const capClient = new CAP.CaptureClient(4646, cv);
const CAPTURE = true;

ctx.fillStyle = '#000000';

ctx.fillRect(-1, -1, 722, 1282);
console.log(nikPantis);

document.body.append(cv);
// for (let i = 0; i < diag.points.length; i += 2) {
//     ctx.fillStyle = '#ff000088';
//     ctx.beginPath();
//     ctx.fillRect(diag.points[i] - 4, diag.points[i + 1] - 4, 8, 8);
// }

CAPTURE &&
    capClient.start({
        frameRate: 60,
        lengthIsFrames: true,
        maxLength: 600,
        name: 'grid'
    });
let regionTable: Map<number, RegionIdentity<number>>;
let frameCount = 0;

ctx.strokeStyle = 'white';
ctx.fillStyle = '#000000';
const strokes = [
    '#f56a68',
    '#f99169',
    '#f7cb77',
    '#c0e084',
    '#58b5de',
    '#b474ee'
];
const fills = [
    '#fab5b3',
    '#fcc8b4',
    '#fbe5bb',
    '#dfefc1',
    '#abdaef',
    '#d9b9f7'
];

function renderFrame() {
    frameCount++;
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(-2, -2, cv.width + 5, cv.height + 5);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    diag = d.Delaunay.from(pts.map(d => d.pt));
    nikPantis = diag.voronoi(EXTENT);
    regions = getRegions(pts, nikPantis, (cell, i) => pts[i].type);
    const groupedEdges = groupEdges(getEdges(nikPantis), regions);

    for (const [i, edgeGroup] of groupedEdges) {
        ctx.strokeStyle = strokes[edgeGroup.type];

        ctx.lineWidth = 5;
        const hulls = hullsFromGroup(edgeGroup);
        const cen = centroid(hulls[0]);

        if (edgeGroup.region.members.length > 0) {
            ctx.fillStyle = fills[edgeGroup.type];

            for (const hull of hulls) {
            }
            const smol = offsetShape(hulls, -8);

            ctx.beginPath();
            for (const lp of smol) {
                const sp = Array.from(h.spline(lp, 4, true, lp.length * 12));

                h.drawLoop(sp, true, ctx);
            }
            ctx.fill();
            ctx.stroke();
        }
        for (const n of edgeGroup.region.members) {
            const pt = pts[n];
            const cell = nikPantis.cellPolygon(n) as Loop;

            if (!cell) continue;
            const newP = centroid(cell);
            const offset = [cen[0] - newP[0], cen[1] - newP[1]] as Point;
            const result = [
                newP[0] + offset[0] / 24,
                newP[1] + offset[1] / 24
            ] as Point;

            pt.pt = newP;
        }
    }
    // const groupedEdges = groupEdges(getEdges(nikPantis), regions);
    // const loops = hullsFromGroup(groupedEdges, groupedTable);
    ctx.strokeStyle = '#0e0e0e10';
    ctx.beginPath();
    nikPantis.render(ctx);
    ctx.stroke();
    if (frameCount < 3) console.log('regions: ', regions);
    // capClient.capture().then(() => window.requestAnimationFrame(renderFrame));
    requestAnimationFrame(renderFrame);
}

async function prepClip() {
    c = await jsc.loadNativeClipperLibInstanceAsync(
        jsc.NativeClipperLibRequestedFormat.WasmWithAsmJsFallback
    );
    renderFrame();
}
prepClip();
document.body.onkeypress = ev => {
    if (ev.key === 'a') {
        renderFrame();
    }
};
