import Tape from 'tape';
import VR from '../src/index';
import * as Del from 'd3-delaunay';
Tape('testOne', t => {
    const gps = [0, 1, 0, 3];
    const pts = [
        [1, 1],
        [3, 1],
        [1, 3],
        [3, 3]
    ].map((p: any, i) => ({
        pt: p,
        type: gps[i]
    }));
    const d = Del.Delaunay.from(pts.map((p: any) => p.pt));
    const v = d.voronoi([0, 0, 4, 4]);
    const r = VR(v, pts, d => d.type);

    console.log(
        [...r].map(d => ({
            m: d.region.members.size,
            t: d.region.type,
            s: d.shape.toString()
        }))
    );
    t.comment('testing');
    t.end();
});
