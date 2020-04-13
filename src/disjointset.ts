export class DisjointSet {
    // #region Properties (3)

    public parents: number[] = [];
    public rank: number[] = [];
    public sourceObjects: Map<number, number>;

    // #endregion Properties (3)

    // #region Constructors (1)

    constructor(source: any[], idAccessor: (data: number) => number) {
        this.sourceObjects.forEach((t, k) => {
            this.parents[k] = k;
            this.rank[k] = 1;
        });
    }

    // #endregion Constructors (1)

    // #region Public Methods (5)
    /**
     * Finds parent
     * @param i - index
     * @returns parent
     */
    public find(i: number) {
        if (this.parents[i] === i) {
            return i;
        } else {
            const result: number = this.find(this.parents[i]);

            this.parents[i] = result;

            return result;
        }
    }

    public groups() {
        const outputMap = new Map<number, number[]>();

        this.sourceObjects.forEach((data, key) => {
            const group = this.find(key);

            if (!outputMap.has(group)) outputMap.set(group, []);
            outputMap.get(group).push(data);
        });

        return [...outputMap.values()];
    }

    public union(a: number, b: number): this;
    union<U>(array: U[], unionAccessor: (d: U) => [number, number]): this;
    union<U>(a: number | U[], b: number | ((d: U) => [number, number])) {
        if (a instanceof Array && b instanceof Function) {
            a.forEach(d => this._union(...b(d)));

            return this;
        } else if (typeof a === 'number' && typeof b === 'number') {
            this._union(a, b);

            return this;
        }
        throw new Error('incorrect types');
    }

    // #endregion Public Methods (5)

    // #region Private Methods (1)

    private _union(a: number, b: number) {
        const aRep = this.find(a);
        const bRep = this.find(b);

        if (aRep === bRep) return;
        const aRank = this.rank[aRep];
        const bRank = this.rank[bRep];

        if (aRank < bRank) this.parents[aRep] = bRep;
        else if (bRank < aRank) this.parents[bRep] = aRep;
        else {
            this.parents[aRep] = bRep;
            this.rank[bRep]++;
        }
    }

    // #endregion Private Methods (1)
}
export default DisjointSet;
