import { Extent, Line, Point, Loop, Region, Edge } from '../src/global';
import * as d from 'd3-delaunay';
import * as CAP from '@rupertofly/capture-client';
import * as h from '@rupertofly/h';

import { getRegions, RegionList } from '../src/getRegions';
import { groupEdges, hullsFromGroup } from '../src/getHulls';
import { polygonCentroid as centroid, polygonCentroid } from 'd3-polygon';
import { getEdges } from '../src/getEdges';

interface Cell {
    pt: Point;
    type: number;
}
interface RegionIdentity<U> {
    groupID: number;
    type: U;
}
const pts: Cell[] = [];
const cv = document.createElement('canvas');

cv.width = 2560;
cv.height = 1080;
const EXTENT = [3, 3, cv.width - 3, cv.height - 3];

let diag: d.Delaunay<Cell>;
let nikPantis: d.Voronoi<Cell>;
let regions: RegionList<number, number>;

for (let i = 0; i < 2048; i++) {
    pts.push({
        pt: [
            5 + Math.random() * cv.width - 5,
            5 + Math.random() * cv.height - 5
        ],
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
        maxLength: 720,
        name: 'grid'
    });
let regionTable: Map<number, RegionIdentity<number>>;
let frameCount = 0;

ctx.strokeStyle = 'white';
ctx.fillStyle = '#000000';
const fills = [
    '#f56a68',
    '#f99169',
    '#f7cb77',
    '#c0e084',
    '#58b5de',
    '#b474ee'
];
const strokes = [
    '#fab5b3',
    '#fcc8b4',
    '#fbe5bb',
    '#dfefc1',
    '#abdaef',
    '#d9b9f7'
];

function renderFrame() {
    frameCount++;
    ctx.fillStyle = '#fafafa';
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
            ctx.beginPath();
            for (const hull of hulls) {
                const sp = Array.from(
                    h.spline(hull, 4, true, hull.length * 12)
                );

                h.drawLoop(sp, true, ctx);
            }
            ctx.fill();
            ctx.stroke();
        }
        for (const n of edgeGroup.region.members) {
            const pt = pts[n];
            const cell = nikPantis.cellPolygon(n) as Loop;

            const newP = centroid(cell);
            const offset = [cen[0] - newP[0], cen[1] - newP[1]] as Point;
            const result = [
                newP[0] + offset[0] / 24,
                newP[1] + offset[1] / 24
            ] as Point;

            pt.pt = result;
        }
    }
    // const groupedEdges = groupEdges(getEdges(nikPantis), regions);
    // const loops = hullsFromGroup(groupedEdges, groupedTable);
    ctx.strokeStyle = '#ffffff02';
    ctx.beginPath();
    nikPantis.render(ctx);
    ctx.stroke();
    if (frameCount < 3) console.log('regions: ', regions);
    // capClient.capture().then(() => window.requestAnimationFrame(renderFrame));
    requestAnimationFrame(renderFrame);
}
renderFrame();
document.body.onkeypress = ev => {
    if (ev.key === 'a') {
        renderFrame();
    }
};
