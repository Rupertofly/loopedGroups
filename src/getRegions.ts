import DisjointSet from './disjointset';
import { Voronoi } from 'd3-delaunay';
import { getEdges } from './getEdges';
import { Edge } from 'global';
import { Region } from './global';
export function getRegions<T, U>(
    list: T[],
    graph: Voronoi<T>,
    acc: (d: T, i: number, a: T[]) => U
) {
    const iArr = list.map((d, i) => i);
    const disjointSet = new DisjointSet(iArr, d => d);
    const getType = (n: number) => acc(list[n], n, list);

    for (const edge of getEdges(graph)) {
        if (edge.isBoundary) continue;
        const { left, right } = edge;

        if (getType(left) !== getType(right)) continue;
        disjointSet.union(left, right);
    }
    const regionSets = disjointSet.groups();
    const outputMap = new Map<U, Region<T, U>[]>();

    for (const [regionID, set] of regionSets.entries()) {
        const type = getType(set[0]);
        const region: Region<T, U> = {
            members: set.map(d => list[d]),
            regionID,
            type
        };

        if (outputMap.has(type)) {
            outputMap.get(type).push(region);
        } else {
            outputMap.set(type, [region]);
        }
    }

    return outputMap;
}
