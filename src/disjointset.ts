export class DisjointSet<T> {
    parents: number[] = [];
    rank: number[] = [];
    sourceObjects: Map<number, T>;

    constructor(source: T[], idAccessor: (data: T) => number) {
        this.sourceObjects = new Map<number, T>(
            source.map(d => [idAccessor(d), d])
        );
        this.sourceObjects.forEach((t, k) => {
            this.parents[k] = k;
            this.rank[k] = 1;
        });
    }
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

    union(a: number, b: number): this;
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
    find(i: number) {
        if (this.parents[i] === i) {
            return i;
        } else {
            const result: number = this.find(this.parents[i]);

            this.parents[i] = result;

            return result;
        }
    }
    groups() {
        const outputMap = new Map<number, T[]>();

        this.sourceObjects.forEach((data, key) => {
            const group = this.find(key);

            if (!outputMap.has(group)) outputMap.set(group, []);
            outputMap.get(group).push(data);
        });

        return [...outputMap.values()];
    }
}
export default DisjointSet;
