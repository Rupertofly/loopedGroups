import * as d3 from 'd3';
import * as _ from 'lodash';
import CellPoint from './CellPoint';
import GraphDiagram from './GraphDiagram';
import DisjointSet from './disjointset';

/* TODO:

 */
// =====================================
// Constants

const NUM_POINTS = 200;
const DEF_WID = 600;
const DEF_HEI = 600;

// =====================================
// Helpers

// const { PI, floor: flr } = Math;
const random = (e = 1) => Math.random() * e;

function group<TObject, TKey>(
    a: ArrayLike<TObject>,
    key: (value: TObject) => TKey
): Map<TKey, TObject[]> {
    const groups = new Map<TKey, TObject[]>();

    for (const val of a as any) {
        const keyVal = key(val);
        const group = groups.get(keyVal);

        if (group) group.push(val);
        else groups.set(keyVal, [val]);
    }

    return groups;
}
// =====================================

// =====================================
/**
 * Class to manage the layout and grouping of points
 */
export class PointGraph {
    // ===================================
    /** Graph Width */
    width = DEF_WID;
    /** Graph Height */
    height = DEF_HEI;
    /** Number of points */
    pointsCount = NUM_POINTS;

    cellPoints: CellPoint[] = [];

    // voronoiFunction: d3.VoronoiLayout<CellPoint>;
    currentDiagram: GraphDiagram<CellPoint>;
    forceSim: d3.Simulation<CellPoint, any>;

    // ===================================

    /**
     * Creates an instance of point graph.
     * @param width - width of graph
     * @param height - height of graph
     * @param points - number of points to generate
     */
    constructor(width?: number, height?: number, points?: number) {
        const EDGE_WIDTH = 15;

        this.width = width ?? this.width;
        this.height = height ?? this.height;
        this.pointsCount = points ?? this.pointsCount;
        d3.range(this.pointsCount).forEach(i =>
            this.cellPoints.push(
                CellPoint.new(
                    100 + random(this.width - 200),
                    100 + random(this.height - 500),
                    _.sample([undefined, `red`, 'blue']),
                    i
                )
            )
        );
        this.currentDiagram = new GraphDiagram(
            [0, 0, this.width, this.height],
            this.cellPoints,
            15
        );
        this.forceSim = d3.forceSimulation(this.cellPoints);
        this.forceSim.stop();
        this.forceSim.alphaTarget(0.8);
        this.forceSim.alphaDecay(0.0);
        const constrain = (n: number, min: number, max: number) =>
            Math.max(min, Math.min(max, n));
        const PADDING = 0.9;
        const inversePadding = 1 - PADDING;
        const manyBodyForce = d3
            .forceManyBody<CellPoint>()
            .strength(d => -4)
            .distanceMax(100);
        const gravityForce = d3
            .forceManyBody()
            .strength(0.4)
            .distanceMin(100);
        const lloydForce: d3.Force<CellPoint, any> = alpha => {
            const arr = this.currentDiagram || this.runVoronoi().currentDiagram;

            this.cellPoints.map((polygon, i) => {
                const [cx, cy] = d3.polygonCentroid(
                    this.currentDiagram.polygon(i)
                );

                polygon.vx -= (polygon.x - cx) * alpha * 0.1;
                polygon.vy -= (polygon.y - cy) * alpha * 0.1;
            });
        };
        const boundsForce: d3.Force<CellPoint, any> = () => {
            const { width: W, height: H } = this;

            for (const node of this.cellPoints) {
                if (node.x > W - EDGE_WIDTH) {
                    node.x = W - EDGE_WIDTH;
                    if (node.vx > 1) node.vx *= -1;
                }
                if (node.y > H - EDGE_WIDTH) {
                    node.y = H - EDGE_WIDTH;
                    if (node.vy > 1) node.vy *= -1;
                }
                if (node.x < EDGE_WIDTH) {
                    node.x = EDGE_WIDTH;
                    if (node.vx < -1) node.vx *= -1;
                }
                if (node.y < EDGE_WIDTH) {
                    node.y = EDGE_WIDTH;
                    if (node.vy < -1) node.vy *= -1;
                }
            }
        };
        const collideForce = d3
            .forceCollide<CellPoint>()
            .radius((d, i) => (d.contents ? 30 : 0));
        const centeringForce = d3.forceCenter<CellPoint>(width / 2, height / 2);
        const hl: any = alpha => {
            centeringForce(alpha);
        };

        hl.x = width / 2;
        hl.y = height / 2;
        hl.initialize = nodes => {
            centeringForce.initialize(nodes.filter(nd => nd.type));
        };

        this.forceSim.force(`collision`, collideForce);
        this.forceSim.force('bounds', boundsForce);
        this.forceSim.force('centre', centeringForce);
        const groupingForce = d3
            .forceLink()
            .links(
                _.flatMap(
                    this.cellPoints
                        .filter(p => p.type)
                        .map((cell, i, arr) =>
                            arr
                                .filter(cd => cd !== cell)
                                .map(cd => ({ source: cell, target: cd }))
                        )
                )
            )
            .strength(0.00005)
            .distance(5);

        // this.forceSim.force(`grouping`, groupingForce);
        this.forceSim.force(`spacing`, lloydForce);
    }
    getRegionHulls() {
        const groups = this.groupCells();
        const edges = this.currentDiagram.edges();

        type edge = GraphDiagram.edge<CellPoint>;
        const regionHulls = new Map<string, Map<number, edge[]>>();
        const pushEdge = (edge: edge, type: string, group: number) => {
            if (!regionHulls.has(type)) regionHulls.set(type, new Map());
            const gp = regionHulls.get(type);

            if (!gp.has(group)) gp.set(group, []);
            gp.get(group).push(edge);
        };

        edges
            .filter(e => e.left?.type !== e.right?.type)
            .forEach(edge => {
                // only left has type
                if (!edge.right?.type) {
                    pushEdge(edge, edge.left.type, edge.left.group);

                    return;
                }
                // only right has type
                if (!edge.left?.type) {
                    pushEdge(edge, edge.right.type, edge.right.group);

                    return;
                }
                pushEdge(edge, edge.right.type, edge.right.group);
                pushEdge(edge, edge.left.type, edge.left.group);
            });

        return regionHulls;
    }
    groupCells(cells: CellPoint[] = this.cellPoints) {
        const cellSet = [...cells];
        const neighbours = cellSet.map((currentCell, i) => ({
            currentCell,
            nbs: this.currentDiagram.neighbors(i)
        }));
        const typedCells = [...group(cellSet, c => c.type).entries()]
            .filter(set => !!set[0])
            .map(s => ({ type: s[0], cells: s[1] }));

        const groups = typedCells.map(src => {
            const type = src.type;
            const unvisitedCells = [...src.cells];
            const dsjSet = new DisjointSet(unvisitedCells, d => d.id);

            unvisitedCells.map(cp => {
                const cpID = cp.id;

                neighbours[cpID].nbs
                    .filter(v => v !== undefined)
                    .map(nb => {
                        if (nb.type === type && nb.id > cpID)
                            dsjSet.union(cpID, nb.id);
                    });
            });
            const gp = dsjSet.groups().filter(arr => {
                return arr.length > 1;
            });

            return {
                type,
                groups: gp.map((gp, gpID) => {
                    gp.forEach(cell => (cell.group = gpID));

                    return gp;
                })
            };
        });

        return groups;
    }
    runVoronoi(points: CellPoint[] = this.cellPoints) {
        this.currentDiagram.updatePoints(points);
        points.map(v => {
            v.group = undefined;
        });

        return this;
    }
    // ===================================
}
export default PointGraph;
