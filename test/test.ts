document.body.innerText = 'test Successful';
import * as d from 'd3-delaunay';
import * as ge from '../src/getEdges';
import { render } from '../src/polygonSrc';
type pt = [number, number];
const pts: [number, number][] = [];

for (let i = 0; i < 256; i++) {
    pts.push([5 + Math.random() * 300, 5 + Math.random() * 500]);
}
let diag = d.Delaunay.from(pts);
let nikPantis = diag.voronoi([5, 5, 800, 800]);
const cv = document.createElement('canvas');

cv.width = 805;
cv.height = 805;
const ctx = cv.getContext('2d');

ctx.fillStyle = '#eeeeee';
console.log(nikPantis);
function centroid(polygon: pt[]) {
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
document.body.append(cv);
// for (let i = 0; i < diag.points.length; i += 2) {
//     ctx.fillStyle = '#ff000088';
//     ctx.beginPath();
//     ctx.fillRect(diag.points[i] - 4, diag.points[i + 1] - 4, 8, 8);
// }
function renderFrame() {
    ctx.clearRect(0, 0, 805, 805);
    diag = d.Delaunay.from(pts);
    nikPantis = diag.voronoi([5, 5, 800, 800]);
    for (let i = 0; i < pts.length; i++) {
        const pg = nikPantis.cellPolygon(i);
        const cx = centroid(pg as pt[]);
        const newPT = pts[i].map((v, j) => v + (cx[j] - v) * 0.1) as pt;

        pts[i] = newPT;
    }
    for (const ed of render(nikPantis)) {
        ctx.strokeStyle = '#000000ff';
        if (!ed.line) continue;
        // ctx.beginPath();
        // ctx.moveTo(...ed.line[0]);
        // ctx.lineTo(...ed.line[1]);
        // ctx.stroke();
        if (ed.left != null && ed.right != null) {
            const l = [
                diag.points[ed.left * 2],
                diag.points[ed.left * 2 + 1]
            ] as [number, number];
            const r = [
                diag.points[ed.right * 2],
                diag.points[ed.right * 2 + 1]
            ] as [number, number];

            ctx.strokeStyle = '#00000033';
            ctx.beginPath();
            ctx.fillStyle = '#00ff0055';
            ctx.moveTo(r[0], r[1]);
            ctx.lineTo(ed.line[0][0], ed.line[0][1]);
            ctx.lineTo(ed.line[1][0], ed.line[1][1]);
            ctx.closePath();
            // ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = '#ff000055';
            ctx.moveTo(l[0], l[1]);
            ctx.lineTo(ed.line[0][0], ed.line[0][1]);
            ctx.lineTo(ed.line[1][0], ed.line[1][1]);
            ctx.closePath();
            // ctx.fill();
            ctx.stroke();
        }
    }
    window.requestAnimationFrame(renderFrame);
}
renderFrame();
