import { Extent, Line, Pt, Loop } from '../src/global';
import * as d from 'd3-delaunay';
import * as ge from '../src/getEdges';
import { getEdges } from '../src/getEdges';
import { Edge, Pt as pt } from '../src/global';

import * as CAP from '@rupertofly/capture-client';
import Vic from 'victor';

const pts: Pt[] = [];

for (let i = 0; i < 256; i++) {
    pts.push([288 + Math.random() * 144, 568 + Math.random() * 144]);
}
let diag = d.Delaunay.from(pts);
let nikPantis = diag.voronoi([5, 5, 715, 1275]);
const cv = document.createElement('canvas');

cv.width = 720;
cv.height = 1280;
const ctx = cv.getContext('2d');
const capClient = new CAP.CaptureClient(4646, cv);

ctx.fillStyle = '#000000';

ctx.fillRect(0, 0, 1300, 1300);
console.log(nikPantis);
function centroid(polygon: Loop) {
    const n = polygon.length;
    let i = -1,
        x = 0,
        y = 0,
        a: pt,
        b = polygon[n - 1],
        c,
        k = 0;

    while (++i < n) {
        a = b;
        b = polygon[i];
        k += c = a[0] * b[1] - b[0] * a[1];
        x += (a[0] + b[0]) * c;
        y += (a[1] + b[1]) * c;
    }

    return (k *= 3), [x / k, y / k] as pt;
}
function drawLineDir(edge: Edge, context: CanvasRenderingContext2D = ctx) {
    const line = edge.line;

    const start = Vic.fromArray(line[0]);
    const end = Vic.fromArray(line[1]);
    const mid = end.clone().mix(start, 0.5);
    const fwd = start
        .clone()
        .mix(end, 0.7)
        .subtract(mid);

    context.save();

    context.translate(...(mid.toArray() as pt));
    const sz = fwd.length();

    context.fillStyle = 'black';
    context.font = `${sz * 1}px sans-serif`;
    if (edge.left) {
        const l = [
            diag.points[edge.left * 2],
            diag.points[edge.left * 2 + 1]
        ] as [number, number];

        context.fillText(
            'L',
            ...(mid
                .clone()
                .mix(Vic.fromArray(l), 0.5)
                .subtract(mid)
                .toArray() as pt)
        );
    }
    if (edge.right) {
        const r = [
            diag.points[edge.right * 2],
            diag.points[edge.right * 2 + 1]
        ] as [number, number];

        context.fillText(
            'R',
            ...(mid
                .clone()
                .mix(Vic.fromArray(r), 0.5)
                .subtract(mid)
                .toArray() as pt)
        );
    }

    context.beginPath();
    context.moveTo(...(fwd.toArray() as pt));
    context.lineTo(
        ...(fwd
            .clone()
            .rotate(2 * (Math.PI / 3))
            .toArray() as pt)
    );
    context.lineTo(
        ...(fwd
            .clone()
            .rotate(4 * (Math.PI / 3))
            .toArray() as pt)
    );
    context.closePath();
    context.restore();
}
document.body.append(cv);
// for (let i = 0; i < diag.points.length; i += 2) {
//     ctx.fillStyle = '#ff000088';
//     ctx.beginPath();
//     ctx.fillRect(diag.points[i] - 4, diag.points[i + 1] - 4, 8, 8);
// }
let myPts = getEdges(nikPantis);
const myTris = diag.trianglePolygons();
let startAgain = true;
let frameCount = 0;
let buildCount = -1;

capClient.start({
    frameRate: 60,
    lengthIsFrames: true,
    maxLength: 3000,
    name: 'grid'
});
function renderFrame() {
    frameCount++;
    ctx.fillStyle = '#00000000';
    ctx.lineWidth = 8;
    if (startAgain) {
        buildCount++;
        ctx.fillStyle = '#00000001';
        ctx.fillRect(0, 0, 1300, 1300);
        startAgain = false;
        diag = d.Delaunay.from(pts);
        nikPantis = diag.voronoi([5, 5, 715, 1275]);
        for (let i = 0; i < pts.length; i++) {
            const pg = nikPantis.cellPolygon(i);
            const cx = centroid(pg as pt[]);
            const newPT = pts[i].map((v, j) => v + (cx[j] - v)) as pt;

            pts[i] = newPT;
        }
        myPts = getEdges(nikPantis);
    }
    let count = 0;

    while (!startAgain && count < 24) {
        count++;
        const nxt = myPts.next();

        if (nxt.done) startAgain = true;
        const ed = nxt.value as Edge;

        if (ed) {
            ctx.strokeStyle = `hsl(${(frameCount * 2) % 360}deg, 90%, ${
                buildCount % 2 ? 60 : 20
            }%)`;
            ctx.beginPath();
            ctx.moveTo(...ed.line[0]);
            ctx.lineTo(...ed.line[1]);
            ctx.stroke();
        }
    }
    // for (const ed of render(nikPantis)) {
    //     ctx.strokeStyle = '#000000ff';
    //     ctx.beginPath();
    //     ctx.moveTo(...ed.line[0]);
    //     ctx.lineTo(...ed.line[1]);
    //     ctx.stroke();
    //     // drawLineDir(ed);
    //     ctx.stroke();
    //     if (ed.left != null && ed.right != null) {
    //         const l = [
    //             diag.points[ed.left * 2],
    //             diag.points[ed.left * 2 + 1]
    //         ] as [number, number];
    //         const r = [
    //             diag.points[ed.right * 2],
    //             diag.points[ed.right * 2 + 1]
    //         ] as [number, number];

    //         // ctx.strokeStyle = '#00000033';
    //         // ctx.beginPath();
    //         // ctx.fillStyle = '#00ff0055';
    //         // ctx.moveTo(r[0], r[1]);
    //         // ctx.lineTo(ed.line[0][0], ed.line[0][1]);
    //         // ctx.lineTo(ed.line[1][0], ed.line[1][1]);
    //         // ctx.closePath();
    //         // // ctx.fill();
    //         // ctx.stroke();
    //         // ctx.beginPath();
    //         // ctx.fillStyle = '#ff000055';
    //         // ctx.moveTo(l[0], l[1]);
    //         // ctx.lineTo(ed.line[0][0], ed.line[0][1]);
    //         // ctx.lineTo(ed.line[1][0], ed.line[1][1]);
    //         // ctx.closePath();
    //         // // ctx.fill();
    //         // ctx.stroke();
    //     }
    // }
    capClient.capture().then(() => window.requestAnimationFrame(renderFrame));
}
renderFrame();
