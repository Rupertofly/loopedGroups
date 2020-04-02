document.body.innerText = 'test Successful';
import * as d from 'd3-delaunay';
import * as ge from '../src/getEdges';
const pts: [number, number][] = [];

for (let i = 0; i < 24; i++) {
    pts.push([Math.random() * 100, Math.random() * 100]);
}
const diag = d.Delaunay.from(pts);
const v = diag.voronoi([0, 0, 100, 100]);

const edges = ge.getEdges(v, pts);
const cv = document.createElement('canvas');

cv.width = 200;
cv.height = 200;
document.body.append(cv);
const ctx = cv.getContext('2d');

ctx.strokeStyle = 'black';
edges.forEach(edge => {
    ctx.beginPath();
    ctx.moveTo(5 + edge[0][0], 5 + edge[0][1]);
    ctx.lineTo(5 + edge[1][0], 5 + edge[1][1]);
    ctx.stroke();
});
