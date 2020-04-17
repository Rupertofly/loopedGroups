import { Extent, Line, Pt, Loop, Region, Edge } from '../src/global';
import * as d from 'd3-delaunay';
import * as ge from '../src/getEdges';
import * as h from '@rupertofly/h';
import { getEdges } from '../src/getEdges';
import { getRegions, outputTable } from '../src/getRegions';
import { hullsFromGroup, groupEdges } from '../src/getHulls';
import * as CAP from '@rupertofly/capture-client';
import Vic from 'victor';
interface Cell {
    pt: Pt;
    type: number;
}
interface RegionIdentity<U> {
    groupID: number;
    type: U;
}
const pts: Cell[] = [];
const cv = document.createElement('canvas');

for (let i = 0; i < 64; i++) {
    pts.push({
        pt: [5 + Math.random() * 630, 5 + Math.random() * 470],
        type: Math.floor(Math.random() * 2)
    });
}
cv.width = 640;
cv.height = 480;
const EXTENT = [5, 5, cv.width - 5, cv.height - 5];
let diag: d.Delaunay<Cell>;
let nikPantis: d.Voronoi<Cell>;
let regions: Map<number, Region<number, number>[]>;

diag = d.Delaunay.from(pts.map(d => d.pt));
nikPantis = diag.voronoi(EXTENT);
regions = getRegions<any, number>(pts, nikPantis, (d, i, a) => a[i].type);

const ctx = cv.getContext('2d');
const capClient = new CAP.CaptureClient(4646, cv);

ctx.fillStyle = '#000000';

ctx.fillRect(0, 0, 1300, 1300);
console.log(nikPantis);

document.body.append(cv);
// for (let i = 0; i < diag.points.length; i += 2) {
//     ctx.fillStyle = '#ff000088';
//     ctx.beginPath();
//     ctx.fillRect(diag.points[i] - 4, diag.points[i + 1] - 4, 8, 8);
// }
const myPts = getEdges(nikPantis);
const myTris = diag.trianglePolygons();
const startAgain = true;
let frameCount = 0;
const buildCount = -1;
const CAPTURE = false;

CAPTURE &&
    capClient.start({
        frameRate: 60,
        lengthIsFrames: true,
        maxLength: 3000,
        name: 'grid'
    });
let regionTable: Map<number, RegionIdentity<number>>;

function renderFrame() {
    frameCount++;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    diag = d.Delaunay.from(pts.map(d => d.pt));
    nikPantis = diag.voronoi(EXTENT);
    regions = getRegions(pts, nikPantis, (cell, i) => pts[i].type);
    const groupedEdges = groupEdges(getEdges(nikPantis), regions);
    const groupedTable = outputTable(regions);
    const loops = hullsFromGroup(groupedEdges, groupedTable);

    ctx.strokeStyle = 'white';
    for (const edge of groupedEdges.get(1)) {
        h.drawLine(edge.line, ctx);
        ctx.stroke();
    }
    if (frameCount < 3) console.log('loops: ', loops);
    window.requestAnimationFrame(renderFrame);
}
renderFrame();
