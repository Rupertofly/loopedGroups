import { Extent, Line, Pt, Loop } from '../src/global';
import * as d from 'd3-delaunay';
import * as ge from '../src/getEdges';
import { getEdges } from '../src/getEdges';
import { Edge, Pt as pt } from '../src/global';
import { getRegions } from '../src/getRegions';

import * as CAP from '@rupertofly/capture-client';
import Vic from 'victor';
interface Cell {
    pt: Pt;
    type: number;
}
const pts: Cell[] = [];

for (let i = 0; i < 256; i++) {
    pts.push({
        pt: [Math.random() * 400, Math.random() * 400],
        type: Math.floor(Math.random() * 2)
    });
}
let diag: d.Delaunay<Cell> = d.Delaunay.from(pts.map(d => d.pt));
let nikPantis = diag.voronoi([5, 5, 630, 470]);
let regions = getRegions<any, number>(pts, nikPantis, (d, i, a) => a[i].type);

const cv = document.createElement('canvas');

cv.width = 640;
cv.height = 480;
const ctx = cv.getContext('2d');
// const capClient = new CAP.CaptureClient(4646, cv);

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

// capClient.start({
//     frameRate: 60,
//     lengthIsFrames: true,
//     maxLength: 3000,
//     name: 'grid'
// });
function renderFrame() {
    frameCount++;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    if (startAgain) {
        buildCount++;
        startAgain = false;
        diag = d.Delaunay.from(pts.map(d => d.pt));
        nikPantis = diag.voronoi([5, 5, 630, 470]);
        for (let i = 0; i < pts.length; i++) {
            const pg = nikPantis.cellPolygon(i);

            if (!pg) continue;
            const cx = centroid(pg as pt[]);
            const newPT = pts[i].pt.map((v, j) => v + (cx[j] - v)) as pt;

            pts[i].pt = newPT;
        }
        regions = getRegions<any, number>(
            pts,
            nikPantis,
            (d, i, a) => a[i].type
        );

        myPts = getEdges(nikPantis);
        regions.forEach((regions, type) => {
            const regionNo = regions.length;

            regions.forEach(({ members }, i) => {
                ctx.fillStyle = `hsla(${type * 120}deg, ${50 +
                    i * (50 / regionNo)}%, 60%,100)`;
                members.forEach(n => {
                    ctx.beginPath();
                    const pg = nikPantis.cellPolygon(n);

                    if (!pg) return;
                    // ctx.moveTo(...(pg.shift() as Pt));
                    // pg.map((p: Pt) => ctx.lineTo(...p));
                    // ctx.closePath();
                    // ctx.fill();
                });
            });
        });
    }
    let count = 0;

    // debugger;
    // regions.forEach((regions, type) => {
    //     const regionNo = regions.length;

    //     regions.forEach(({ members }, i) => {
    //         ctx.fillStyle = `hsla(${type * 120}deg, ${50 +
    //             i * (50 / regionNo)}%, 60%,100)`;
    //         members.forEach(n => {
    //             ctx.beginPath();
    //             const pg = nikPantis.cellPolygon(n);

    //             ctx.moveTo(...(pg.shift() as Pt));
    //             pg.map((p: Pt) => ctx.lineTo(...p));
    //             ctx.closePath();
    //             ctx.fill();
    //         });
    //     });
    // });
    if (frameCount === 300) console.log(regions);
    while (!startAgain && count < 16) {
        count++;
        const nxt = myPts.next();

        if (nxt.done) startAgain = true;
        nxt.done && console.log('nxt: ', nxt);
        const ed = nxt.value as Edge;

        if (ed) {
            const [lt, rt] = [pts[ed.left ?? 99], pts[ed.right ?? 99]];

            if (lt.type !== rt.type || ed.isBoundary) {
                ctx.strokeStyle = `hsl(${(frameCount * 2) % 360}deg, 90%, ${
                    buildCount % 2 ? 60 : 20
                }%)`;
                ctx.beginPath();
                ctx.moveTo(...ed.line[0]);
                ctx.lineTo(...ed.line[1]);
                // if (!ed.isBoundary) {
                //     ctx.lineTo(...pts[ed.left].pt);
                //     ctx.closePath();
                // }
                ctx.stroke();
                // if (ed.isBoundary) continue;
                // const lcx = centroid([...ed.line, pts[ed.left].pt]);

                // ctx.beginPath();
                // ctx.ellipse(lcx[0], lcx[1], 1, 1, 0, 0, Math.PI);
                // ctx.stroke();}
            }
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
    window.requestAnimationFrame(renderFrame);
}
renderFrame();
