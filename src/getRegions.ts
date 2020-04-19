import DisjointSet from './disjointset';
import { Voronoi } from 'd3-delaunay';
import { getEdges } from './getEdges';
import { Edge } from './global';
import { Region, RegionMap } from './global';
export class RegionList<CellType = number, CategoryType = number> extends Map<
    CategoryType,
    RegionMap<CellType, CategoryType>
> {
    constructor() {
        super();
    }
    add(region: Region<CellType, CategoryType>) {
        const { type, regionID } = region;

        if (this.has(type)) {
            const typeMap = this.get(type)!;

            typeMap.set(regionID, region);
        } else {
            this.set(type, new Map([[regionID, region]]));
        }
    }
    getRegion(cellIndex: CellType) {
        for (const [type, typeGroups] of this) {
            for (const [regID, region] of typeGroups) {
                if (region.members.includes(cellIndex)) return region;
            }
        }

        return undefined;
    }
}
export function getRegions<CellType = number, CategoryType = number>(
    list: CellType[],
    graph: Voronoi<CellType>,
    acc: (d: CellType, i: number, a: CellType[]) => CategoryType
) {
    const iArr = list.map((d, i) => i);
    const disjointSet = new DisjointSet(iArr, d => d);
    const getType = (n: number) => acc(list[n], n, list);
    const regionlist = new RegionList<number, CategoryType>();

    for (const i of iArr) {
        for (const j of graph.delaunay.neighbors(i)) {
            if (j < i) continue;
            if (getType(i) === getType(j)) disjointSet.union(i, j);
        }
    }
    const regionSets = disjointSet.groups();
    const outputMap = new Map<CategoryType, Region<number, CategoryType>[]>();

    for (const [regionID, set] of regionSets.entries()) {
        const type = getType(set[0]);
        const region: Region<number, CategoryType> = {
            members: set,
            regionID,
            type
        };

        regionlist.add(region);
    }

    return regionlist;
}
