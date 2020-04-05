document.body.innerText = 'test Successful';
import * as d from 'd3-delaunay';
import * as ge from '../src/getEdges';
import { render } from '../src/polygonSrc';
const pts: [number, number][] = [];

for (let i = 0; i < 64; i++) {
    pts.push([5 + Math.random() * 795, 5 + Math.random() * 795]);
}
const diag = d.Delaunay.from(pts);
const nikPantis = diag.voronoi([5, 5, 800, 800]);
const cv = document.createElement('canvas');

cv.width = 805;
cv.height = 805;
const ctx = cv.getContext('2d');

ctx.fillStyle = '#eeeeee';
console.log(nikPantis);

document.body.append(cv);
// for (let i = 0; i < diag.points.length; i += 2) {
//     ctx.fillStyle = '#ff000088';
//     ctx.beginPath();
//     ctx.fillRect(diag.points[i] - 4, diag.points[i + 1] - 4, 8, 8);
// }
function renderFrame() {
    for (const ed of render(nikPantis)) {
        ctx.strokeStyle = '#000000ff';
        if (!ed.line) continue;
        ctx.beginPath();
        ctx.moveTo(...ed.line[0]);
        ctx.lineTo(...ed.line[1]);
        ctx.stroke();
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
}
renderFrame();
