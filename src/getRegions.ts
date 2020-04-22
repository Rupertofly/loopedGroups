import DisjointSet from './disjointset';
import { Voronoi } from 'd3-delaunay';

/**
 * Class to make interactin with a map of regions easier
 *
 */
export class RegionList<CategoryType = number> extends Map<
    CategoryType,
    RegionMap<CategoryType>
> {
    constructor() {
        super();
    }
    /**
     *  adds a region to the list
     *
     * @param region - region to add
     *
     */
    add(region: Region<CategoryType>) {
        const { type, regionID } = region;

        if (this.has(type)) {
            const typeMap = this.get(type)!;

            typeMap.set(regionID, region);
        } else {
            this.set(type, new Map([[regionID, region]]));
        }
    }
    /**
     * get the region of a cell number
     *
     * @param cellIndex - index of cell to find what region it is in
     * @returns the region of undefined if no region is found
     *
     */
    getRegion(cellIndex: number) {
        for (const [type, typeGroups] of this) {
            for (const [regID, region] of typeGroups) {
                if (region.members.has(cellIndex)) return region;
            }
        }

        return undefined;
    }
}

/**
 *  gets a set of regions from a graph
 *
 * @param graph - the voronoi graph to check
 * @param acc - an accessor to get the type information from the graph index
 * @returns a list of regions
 */
export function getRegions<CategoryType = number>(
    graph: Voronoi<any>,
    acc: (i: number) => CategoryType
) {
    const graphLength = Math.round(graph.delaunay.points.length / 2);
    const disjointSet = new DisjointSet(new Array(graphLength));
    const getType = (n: number) => acc(n);
    const regionlist = new RegionList<CategoryType>();

    for (let i = 0; i < graphLength; i++) {
        for (const j of graph.delaunay.neighbors(i)) {
            if (j < i) continue;
            if (getType(i) === getType(j)) disjointSet.union(i, j);
        }
    }
    const regionSets = disjointSet.groups();

    for (const [regionID, set] of regionSets.entries()) {
        const type = getType(set[0]);
        const region: Region<CategoryType> = {
            members: new Set(set),
            regionID,
            type
        };

        regionlist.add(region);
    }

    return regionlist;
}
