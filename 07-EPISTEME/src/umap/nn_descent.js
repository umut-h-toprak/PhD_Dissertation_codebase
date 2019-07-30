import {build_candidates, deheap_sort, heap_push, make_heap, rejection_sample, tau_rand} from "./umap_utils";

export function make_nn_descent(dist, dist_args) {
    function nn_descent(
        data,
        n_neighbors,
        rng_state,
        max_candidates=50,
        n_iters=10,
        delta=0.001,
        rho=0.5,
        rp_tree_init=true,
        leaf_array=null
    ) {
        const n_vertices = data.length;
        let current_graph = make_heap(n_vertices, n_neighbors);
        for(let i=0;i<n_vertices;++i){
            let indices = rejection_sample(n_neighbors, n_vertices, rng_state);
            for(let j=0;j<indices.length;++j){
                let d = dist(data[i], data[indices[j]], ...dist_args);
                heap_push(current_graph, i, d, indices[j], 1);
                heap_push(current_graph, indices[j], d, i, 1);
            }
        }
        if(rp_tree_init){
            let leaf_arrayDim0=leaf_array.length;
            let leaf_arrayDim1=leaf_array[0].length;
            for(let n=0;n<leaf_arrayDim0;++n){
                for(let i=0;i<leaf_arrayDim1;++i){
                    if(leaf_array[n][i] < 0){
                        break;
                    }
                    for(let j=i+1;j<leaf_arrayDim1;++j){
                        if(leaf_array[n][j]<0){
                            break;
                        }
                        let d=dist(leaf_array[n][i],leaf_array[n][j],...dist_args);
                        heap_push(current_graph, leaf_array[n][i], d, leaf_array[n][j], 1);
                        heap_push(current_graph, leaf_array[n][j], d, leaf_array[n][i], 1);
                    }
                }
            }
        }
        let dataDim0=data.length;
        for(let n=0;n<n_iters;++n){
            let candidate_neighbors = build_candidates(current_graph, n_vertices, n_neighbors, max_candidates, rng_state);
            let c=0;
            for(let i=0;i<n_vertices;++i){
                for(let j=0;j<max_candidates;++j){
                    let p = candidate_neighbors[0][i][j];
                    if(p < 0 || tau_rand(rng_state)<rho){
                        continue;
                    }
                    for(let k=0;k<max_candidates;++k){
                        let q = candidate_neighbors[0][i][k];
                        if (q < 0 || (!candidate_neighbors[2][i][j] && candidate_neighbors[2][i][k])){
                            continue;
                        }
                        let d = dist(data[p], data[q], ...dist_args);
                        c += heap_push(current_graph, p, d, q, 1);
                        c += heap_push(current_graph, q, d, p, 1);
                    }
                }
            }
            if(c <= delta * n_neighbors * dataDim0){
                break;
            }
        }
        return deheap_sort(current_graph);
    }
    return nn_descent;
}