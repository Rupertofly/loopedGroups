document.body.innerText = 'test Successful';
import * as d from 'd3-delaunay';
import * as ge from '../src/getEdges';
import { render } from '../src/polygonSrc';
const pts: [number, number][] = [];

for (let i = 0; i < 24; i++) {
    pts.push([5 + Math.random() * 795, 5 + Math.random() * 795]);
}
const diag = d.Delaunay.from(pts);
const v = diag.voronoi([5, 5, 800, 800]);
const cv = document.createElement('canvas');

cv.width = 805;
cv.height = 805;
const ctx = cv.getContext('2d');

ctx.fillStyle = '#eeeeee';
ctx.fillRect(5, 5, 95, 95);
document.body.append(cv);

for (const ed of render(v)) {
    if (!ed) continue;
    ctx.beginPath();
    ctx.moveTo(ed[0], ed[1]);
    ctx.lineTo(ed[2], ed[3]);
    ctx.stroke();
    ctx.beginPath();
    const cx = (ed[2] - ed[0]) / 8;
    const cy = (ed[3] - ed[1]) / 8;

    ctx.rect(ed[0] + cx, ed[1] + cy, 4, 4);
    ctx.stroke();
}
