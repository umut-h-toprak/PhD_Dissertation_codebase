import {RandomProjectionTreeNode} from "./RandomProjectionTreeNode";
import {l2Norm, tau_rand_int} from "./umap_utils";
import {FlatTree} from "./FlatTree";

export function make_forest(data, n_neighbors, n_trees, rng_state, angular=false) {
    let result = [];
    const leaf_size = Math.max(10, n_neighbors);
    for(let i=0;i<n_trees;++i){
        result.push(flatten_tree(make_tree(data, rng_state, leaf_size, angular),leaf_size));
    }
    return result;
}
export function flatten_tree(tree,leaf_size){
    const n_nodes = num_nodes(tree);
    const n_leaves = num_leaves(tree);
    let hyperplanes=[];
    let offsets=[];
    let children=[];
    const hyperplaneLen=tree.hyperplane.length;
    for(let i=0;i<n_nodes;++i){
        offsets.push(0);
        hyperplanes.push([]);
        children.push([-1,-1]);
        for(let j=0;j<hyperplaneLen;++j){
            hyperplanes[i].push(0);
        }
    }
    let indices=[];
    for(let i=0;i<n_leaves;++i){
        indices.push([]);
        for(let j=0;j<leaf_size;++j){
            indices[i].push(-1);
        }
    }
    recursive_flatten(tree, hyperplanes, offsets, children, indices, 0, 0);
    return new FlatTree(hyperplanes, offsets, children, indices);
}
export function recursive_flatten(tree, hyperplanes, offsets, children, indices, node_num, leaf_num) {
    if(tree.is_leaf){
        children[node_num][0] = -leaf_num;
        for(let i=0;i<tree.indices.length;++i){
            indices[leaf_num][i] = tree.indices[i];
        }
        leaf_num += 1;
        return [node_num, leaf_num];
    } else{
        hyperplanes[node_num] = tree.hyperplane;
        offsets[node_num] = tree.offset;
        children[node_num][0] = node_num + 1;
        let old_node_num = node_num;
        [node_num, leaf_num] = recursive_flatten(
            tree.left_child,
            hyperplanes,
            offsets,
            children,
            indices,
            node_num + 1,
            leaf_num,
        );
        children[old_node_num][1] = node_num + 1;
        [node_num, leaf_num] = recursive_flatten(
            tree.right_child,
            hyperplanes,
            offsets,
            children,
            indices,
            node_num + 1,
            leaf_num,
        );
        return [node_num, leaf_num]
    }
}
export function num_nodes(tree) {
    if(tree.is_leaf){
        return 1
    }else{
        return 1 + num_nodes(tree.left_child) + num_nodes(tree.right_child);
    }
}
export function num_leaves(tree) {
    if(tree.is_leaf){
        return 1;
    }else{
        return num_leaves(tree.left_child) + num_leaves(tree.right_child);
    }
}
export function make_tree(data, rng_state, leaf_size=30, angular=false) {
    const dataDim0=data.length;
    let indices=[];
    for(let i=0;i<dataDim0;++i){
        indices.push(i)
    }
    if(angular){
        return make_angular_tree(data, indices, rng_state, leaf_size);
    }else{
        return make_euclidean_tree(data, indices, rng_state, leaf_size);
    }
}
export function make_angular_tree(data, indices, rng_state, leaf_size=30) {
    const indicesDim0=indices.length;
    let node=null;
    if(indicesDim0>leaf_size){
        let [left_indices, right_indices, hyperplane, offset]= angular_random_projection_split(data, indices, rng_state);
        let left_node = make_angular_tree(data, left_indices, rng_state, leaf_size);
        let right_node = make_angular_tree(data, right_indices, rng_state, leaf_size);
        node = new RandomProjectionTreeNode(null, false, hyperplane, offset, left_node, right_node);
    }else {
        node = new RandomProjectionTreeNode(indices, true, null, null, null, null);
    }
    return node;
}

export function make_euclidean_tree(data, indices, rng_state, leaf_size=30) {
    const indicesDim0=indices.length;
    let node=null;
    if(indicesDim0 > leaf_size){
        let [left_indices, right_indices, hyperplane, offset] = euclidean_random_projection_split(data, indices, rng_state);
        let left_node = make_euclidean_tree(data, left_indices, rng_state, leaf_size);
        let right_node = make_euclidean_tree(data, right_indices, rng_state, leaf_size);
        node = new RandomProjectionTreeNode(null, false, hyperplane, offset, left_node, right_node);
    }else{
        node = new RandomProjectionTreeNode(indices, true, null, null, null, null);
    }
    return node;
}
export function euclidean_random_projection_split(data, indices, rng_state) {
    const EPS=1e-8;
    const dim = data[0].length;
    const lenIndices=indices.length;
    let left_index = Math.abs(tau_rand_int(rng_state) % lenIndices);
    let right_index = Math.abs(tau_rand_int(rng_state) % lenIndices);
    right_index += left_index === right_index;
    right_index = Math.abs(right_index % lenIndices);
    let left = indices[left_index];
    let right = indices[right_index];
    let hyperplane_offset = 0.0;
    let hyperplane_vector = [];
    for(let d=0;d<dim;++d){
        let newElem=data[left][d] - data[right][d];
        hyperplane_vector.push(newElem);
        hyperplane_offset -= (newElem * (data[left][d] + data[right][d]) / 2.0);
    }
    let side = [];
    for(let i=0;i<lenIndices;++i){
        let margin = hyperplane_offset;
        for(let d=0;d<dim;++d){
            margin += hyperplane_vector[d] * data[indices[i]][d];
        }
        if(Math.abs(margin)<EPS){
            let newSide=Math.abs(tau_rand_int(rng_state) % 2);
            side.push(newSide);
        }else if(margin>0){
            side.push(0);
        }else{
            side.push(1);
        }
    }
    let indices_left = [];
    let indices_right = [];
    for(let i=0;i<lenIndices;++i){
        if(side[i]===0){
            indices_left.push(indices[i]);
        }else{
            indices_right.push(indices[i]);
        }
    }
    return [indices_left, indices_right, hyperplane_vector, hyperplane_offset];
}
export function angular_random_projection_split(data, indices, rng_state) {
    const EPS=1e-8;
    const dim = data[0].length;
    const lenIndices=indices.length;
    let left_index = Math.abs(tau_rand_int(rng_state) % lenIndices);
    let right_index = Math.abs(tau_rand_int(rng_state) % lenIndices);
    right_index += left_index === right_index;
    right_index = Math.abs(right_index % lenIndices);
    const left = indices[left_index];
    const right = indices[right_index];
    let left_norm = l2Norm(data[left]);
    let right_norm = l2Norm(data[right]);
    if(Math.abs(left_norm) < EPS){
        left_norm = 1;
    }
    if(Math.abs(right_norm) < EPS){
        right_norm = 1;
    }
    let hyperplane_vector = [];
    for(let d=0;d<dim;++d){
        hyperplane_vector.push((data[left][d] / left_norm) - (data[right][d] / right_norm));
    }
    let hyperplane_norm = l2Norm(hyperplane_vector);
    if(Math.abs(hyperplane_norm) <EPS){
        hyperplane_norm = 1;
    }
    for(let d=0;d<dim;++d){
        hyperplane_vector[d] = hyperplane_vector[d] / hyperplane_norm;
    }
    let side = [];
    for(let i=0;i<lenIndices;++i){
        let margin =0;
        for(let d=0;d<dim;++d){
            margin += hyperplane_vector[d] * data[indices[i]][d];
        }
        if(Math.abs(margin)<EPS){
            let newSide=Math.abs(tau_rand_int(rng_state) % 2);
            side.push(newSide);
        }else if(margin>0){
            side.push(0);
        }else{
            side.push(1);
        }
    }
    let indices_left = [];
    let indices_right = [];
    for(let i=0;i<lenIndices;++i){
        if(side[i]===0){
            indices_left.push(indices[i]);
        }else{
            indices_right.push(indices[i]);
        }
    }
    return [indices_left, indices_right, hyperplane_vector, null];
}
export function rptree_leaf_array(rp_forest) {
    let res=[];
    const rp_forestLen=rp_forest.length;
    if(rp_forestLen > 0){
        for(let i=0;i<rp_forestLen;++i){
            res.push(rp_forest[i].indices);
        }
    }else{
        return [-1];
    }
    return res;
}