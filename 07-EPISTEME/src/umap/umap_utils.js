export function make_heap(n_points, size){
    let result=new Array(3).fill([]);
    for(let i=0;i<3;++i){
        result[i]=new Array(n_points).fill([]);
    }
    for(let j=0;j<n_points;++j){
        result[0][j]=new Array(size).fill(-1);
    }
    for(let j=0;j<n_points;++j){
        result[1][j]=new Array(size).fill(Number.MAX_VALUE);
    }
    for(let j=0;j<n_points;++j){
        result[2][j]=new Array(size).fill(0);
    }
    return result
}
export function rejection_sample(n_samples, pool_size, rng_state){
    let result = new Array(n_samples).fill(null);
    let j=null;
    for(let i=0;i<n_samples;++i){
        let reject_sample = true;
        while(reject_sample){
            j=(tau_rand_int(rng_state) % pool_size + pool_size) % pool_size;
            for(let k=0;k<i;++k){
                if(j === result[k]){
                    break;
                }else{
                    reject_sample= false;
                }
            }
        }
        result[i] = j
    }
    return result;
}
export function tau_rand_int(state){
    state[0] = (((state[0] & 4294967294) << 12) & 0xffffffff) ^ (
        (((state[0] << 13) & 0xffffffff) ^ state[0]) >> 19
    );
    state[1] = (((state[1] & 4294967288) << 4) & 0xffffffff) ^ (
        (((state[1] << 2) & 0xffffffff) ^ state[1]) >> 25
    );
    state[2] = (((state[2] & 4294967280) << 17) & 0xffffffff) ^ (
        (((state[2] << 3) & 0xffffffff) ^ state[2]) >> 11
    );
    return state[0] ^ state[1] ^ state[2];
}

export function heap_push(heap, row, weight, index, flag) {
    let indices = heap[0][row];
    let weights = heap[1][row];
    let is_new = heap[2][row];
    if(weight >= weights[0]){
        return 0;
    }
    for(let i=0;i<indices.length;++i){
        if(index === indices[i]){
            return 0;
        }
    }
    weights[0] = weight;
    indices[0] = index;
    is_new[0] = flag;
    const heapDim1=heap[0].length;
    const heapDim2=heap[0][0].length;
    let i = 0;
    while(true){
        let i_swap=null;
        let ic1 = 2 * i + 1;
        let ic2 = ic1 + 1;
        if(ic1 >= heapDim1){
            break;
        }else if(ic2 >= heapDim2){
            if(weights[ic1] > weight){
                i_swap = ic1;
            }else {
                break;
            }
        }else{
            if(weight < weights[ic2]){
                i_swap = ic2;
            }else {
                break;
            }
        }
        weights[i] = weights[i_swap];
        indices[i] = indices[i_swap];
        is_new[i] = is_new[i_swap];
        i = i_swap;
    }
    weights[i] = weight;
    indices[i] = index;
    is_new[i] = flag;
    return 1
}
export function build_candidates(current_graph, n_vertices, n_neighbors, max_candidates, rng_state) {
    let candidate_neighbors = make_heap(n_vertices, max_candidates);
    for(let i=0;i<n_vertices;++i){
        for(let j=0;i<n_neighbors;++j){
            if(current_graph[0][i][j]<0){
                continue;
            }
            let idx = current_graph[0][i][j];
            let isn = current_graph[2][i][j];
            let d = tau_rand(rng_state);
            heap_push(candidate_neighbors, i, d, idx, isn);
            heap_push(candidate_neighbors, idx, d, i, isn);
            current_graph[2][i][j] = 0;
        }
    }
    return candidate_neighbors
}
export function tau_rand(state) {
    return Math.abs(tau_rand_int(state) / 0x7fffffff);
}

export function deheap_sort(heap) {
    let indices = heap[0];
    let weights = heap[1];
    const indicesDim0=indices.length;
    for(let i=0;i<indicesDim0;++i){
        let ind_heap = indices[i];
        let dist_heap = weights[i];
        const ind_heapDim0=ind_heap.length;
        const dist_heapDim0=dist_heap.length;
        for(let j=0;j<indicesDim0-1;++j){
            [ind_heap[0], ind_heap[ind_heapDim0 - j - 1]] = [ind_heap[ind_heapDim0 - j - 1],ind_heap[0]];
            [dist_heap[0], dist_heap[dist_heapDim0 - j - 1]] = [dist_heap[dist_heapDim0 - j - 1],dist_heap[0]];
            siftdown(dist_heap,ind_heap,0,dist_heapDim0 - j - 1);
        }
    }
    return [indices, weights];
}

export function siftdown(heap1, heap2, elt, dim0Slice) {
    const heap1Dim0=heap1.length;
    const dim0Limit=Math.min(dim0Slice,heap1Dim0);
    while(elt * 2 + 1 < dim0Limit){
        const left_child = elt * 2 + 1;
        const right_child = left_child + 1;
        let swap = elt;

        if(heap1[swap] < heap1[left_child]){
            swap = left_child;
        }
        if(right_child < dim0Limit && heap1[swap] < heap1[right_child]){
            swap = right_child;
        }
        if(swap === elt){
            break;
        }
        [heap1[elt], heap1[swap]] = [heap1[swap], heap1[elt]];
        [heap2[elt], heap2[swap]] = [heap2[swap], heap2[elt]];
        elt = swap
    }
}

export function l2Norm(vec) {
    let result = 0.0;
    for(let i=0;i<vec.length;++i){
        result += Math.pow(vec[i],2);
    }
    return Math.sqrt(result);
}
export function rdist(x,y) {
    let result = 0;
    const lenX=x.length;
    for(let i=0;i<lenX;++i){
        result += Math.pow(x[i] - y[i],2);
    }
    return result
}
export function linspace(startValue, stopValue, numSteps) {
    let arr = [];
    const currValue = startValue;
    const step = (stopValue - startValue) / (numSteps - 1);
    for (let i = 0; i < numSteps; i++) {
        arr.push(currValue + (step * i));
    }
    return arr;
}

export function clip(val,T=4){
    if(val > T){
        return T;
    }else if(val<-T){
        return -T;
    }else{
        return val;
    }
}

export function pairwise_distances(X,distanceFunction,metric_kwds){
    let lenX=X.length;
    let res=new Array(lenX).fill([]);
    for(let i=0;i<lenX;++i){
        res[i]=new Array(lenX).fill(0);
        for(let j=0;j<i;++j){
            const tmpVal=distanceFunction(X[i],X[j],...metric_kwds);
            res[i][j]=tmpVal;
            res[j][i]=tmpVal;
        }
    }
    return res;
}

export function pairwise_distancesXY(X,Y,distanceFunction,metric_kwds){
    const lenX=X.length;
    const lenY=Y.length;
    let res=new Array(lenX).fill([]);
    for(let i=0;i<lenX;++i){
        res[i]=new Array(lenY).fill(0);
        for(let j=0;j<lenY;++j){
            res[i][j]=distanceFunction(X[i],Y[j],...metric_kwds);
        }
    }
    return res;
}

const _2PI = Math.PI * 2;
export function generateGaussian(mean,std){
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(_2PI * u2);
    return z0 * std + mean;
}