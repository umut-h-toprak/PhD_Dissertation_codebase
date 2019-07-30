export class RandomProjectionTreeNode{
    constructor(indices, is_leaf, hyperplane, offset, left_child, right_child) {
        this.indices=indices;
        this.is_leaf=is_leaf;
        this.hyperplane=hyperplane;
        this.offset=offset;
        this.left_child=left_child;
        this.right_child=right_child;
    }
}