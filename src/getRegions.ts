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

    for (const i of iArr) {
        for (const j of graph.delaunay.neighbors(i)) {
            if (j < i) continue;
            if (getType(i) === getType(j)) disjointSet.union(i, j);
        }
    }
    const regionSets = disjointSet.groups();
    const outputMap = new Map<U, Region<number, U>[]>();

    for (const [regionID, set] of regionSets.entries()) {
        const type = getType(set[0]);
        const region: Region<number, U> = {
            members: set,
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
export function outputTable(
    groups: Map<any, Region<number, any>[]>,
    list: any[]
): Map<number, number> {
    const output = new Map<number, number>();

    for (const group of groups)
        for (const region of group[1]) {
            const regID = region.regionID;

            for (const member of region.members) {
                output.set(member, regID);
            }
        }

    return output;
}
