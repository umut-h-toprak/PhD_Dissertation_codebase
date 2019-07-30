export class FlatTree{
    constructor(hyperplanes, offsets, children, indices) {
        this.hyperplanes=hyperplanes;
        this.offsets=offsets;
        this.children=children;
        this.indices=indices;
    }
}