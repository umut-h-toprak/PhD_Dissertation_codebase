import {default as LM} from 'ml-levenberg-marquardt';
import {make_nn_descent} from "./nn_descent";
import {make_forest, rptree_leaf_array} from "./rp_tree";
import {CooSparseMatrix} from "./CooSparseMatrix";
import {linspace, rdist, clip, tau_rand_int, pairwise_distances, generateGaussian} from "./umap_utils";
import {spectral_layout} from "./spectral";
// import {currentTime} from "../Utils"
import {DistanceMeasures} from "../distanceMeasures/DistanceMeasures";
let seedrandom = require('seedrandom');

export class UMAP {
    constructor(n_neighbors=15,
                n_components=2,
                metric="euclidean",
                n_epochs=null,
                learning_rate=1.0,
                init="spectral",
                min_dist=0.1,
                spread=1.0,
                set_op_mix_ratio=1.0,
                local_connectivity=1.0,
                repulsion_strength=1.0,
                negative_sample_rate=5,
                a=null,
                b=null,
                random_state=null,
                metric_kwds=null,
                angular_rp_forest=false) {
        // console.log("UMAP starts",currentTime())
        this.n_neighbors = n_neighbors;
        this.distanceFunction = DistanceMeasures[metric];
        this.metric_kwds = metric_kwds;
        this.n_epochs = n_epochs;
        this.init = init;
        this.n_components = n_components;
        this.repulsion_strength = repulsion_strength;
        this.learning_rate = learning_rate;
        this.spread = spread;
        this.min_dist = min_dist;
        this.set_op_mix_ratio = set_op_mix_ratio;
        this.local_connectivity = local_connectivity;
        this.negative_sample_rate = negative_sample_rate;
        this.random_state = random_state;
        this.angular_rp_forest = angular_rp_forest;
        this.a = null;
        this.b = null;
        this._a=a;
        this._b=b;
        this._raw_data=null;
    }
    static find_ab_params(spread,min_dist){
        function curve([a, b]){
            return (x)=>1.0 / (1.0 + a * Math.pow(x , (2 * b)));
        }
        let data={x:linspace(0, spread * 3, 300),y:[]};
        let initialValues = [1,1];
        for(let i=0;i<data.x.length;++i){
            if(data.x[i]<min_dist){
                data.y.push(1);
            }else{
                data.y.push(Math.exp(-(data.x[i] - min_dist) / spread));
            }
        }
        const options = {
            damping: 1.5,
            initialValues:initialValues,
            gradientDifference: 10e-2,
            maxIterations: 100,
            errorTolerance: 10e-3
        };
        let params = LM(data, curve, options).parameterValues;
        return [params[0],params[1]];
    }
    static check_random_state(seed){
        if(seed===null){
            return seedrandom();
        }else{
            return seedrandom(seed);
        }
    }
    static nearest_neighbors(X, n_neighbors, metric, metric_kwds, angular, random_state){
        if(metric === "precomputed"){
            const lenX=X.length;
            const maxJ=Math.min(n_neighbors,lenX);
            let knn_indices=[];
            for(let i=0;i<lenX;++i){
                knn_indices.push([]);
                let currentArrExtended=[];
                for(let j=0;j<lenX;++j){
                    currentArrExtended.push({
                        val:X[i][j],
                        index:j
                    });
                }
                currentArrExtended.sort(function(a,b) {
                    if(a.val<b.val){
                        return -1;
                    }
                    if(a.val>b.val){
                        return 1;
                    }
                    return 0;
                });
                for(let j=0;j<maxJ;++j){
                    knn_indices[i].push(currentArrExtended[j].index);
                }
            }
            let knn_dists=[];
            for(let i=0;i<lenX;++i){
                knn_dists.push([]);
                for(let j=0;j<maxJ;++j){
                    knn_dists[i].push(X[i][knn_indices[i][j]]);
                }
            }
            let rp_forest = [];
            return [knn_indices, knn_dists, rp_forest];
        }else{
            const distance_func = metric;
            let rng_state =[];
            for(let i=0;i<3;++i){
                rng_state.push(random_state.int32());
            }
            let metric_nn_descent = make_nn_descent(distance_func, metric_kwds);
            const Xdim0=X.length;
            const n_trees = 5 + Math.round(Math.pow(Xdim0,0.5)/ 20.0);
            const n_iters = Math.max(5, Math.round(Math.log2(Xdim0)));
            let rp_forest = make_forest(X, n_neighbors, n_trees, rng_state, angular);
            let leaf_array = rptree_leaf_array(rp_forest);
            let [knn_indices, knn_dists] = metric_nn_descent(
                X,
                n_neighbors,
                rng_state,
                60,
                n_iters,
                0.001,
                0.5,
                true,
                leaf_array
            );
            return [knn_indices, knn_dists, rp_forest];
        }
    }
    static smooth_knn_dist(distances, k, n_iter, local_connectivity=1.0, bandwidth=1.0){
        const MIN_K_DIST_SCALE = 1e-3;
        const SMOOTH_K_TOLERANCE = 1e-5;
        const target = Math.log2(k) * bandwidth;
        const lenDist=distances.length;
        const lenDistCol=distances[0].length;
        let rho = new Array(lenDist).fill(0);
        let result = new Array(lenDist).fill(0);
        let sum=0;
        for(let i=0;i<lenDist;++i){
            for(let j=0;j<lenDistCol;++j){
                sum+=distances[i][j];
            }
        }
        const DISTMEANSCALED = MIN_K_DIST_SCALE*sum/(lenDist*lenDistCol);
        const index = Math.floor(local_connectivity);
        const interpolation = local_connectivity - index;

        for(let i=0;i<lenDist;++i){
            let lo=0;
            let hi=Number.MAX_VALUE;
            let mid=1;
            const ith_distances = distances[i];
            const non_zero_dists = ith_distances.filter(dist => dist > 0);
            if(non_zero_dists.length>=local_connectivity){
                if(index>0){
                    rho[i]=non_zero_dists[index-1];
                    if(interpolation>SMOOTH_K_TOLERANCE){
                        rho[i] += interpolation * (non_zero_dists[index] - non_zero_dists[index - 1]);
                    }
                }else{
                    rho[i] = interpolation * non_zero_dists[0];
                }
            }else if(non_zero_dists.length>0){
                rho[i] = Math.max(...non_zero_dists)
            }
            for(let n=0;n<n_iter;++n){
                let psum = 0;
                for(let j=1;j<lenDistCol;++j){
                    let d = distances[i][j] - rho[i];
                    if(d>0){
                        psum += Math.exp(-(d / mid));
                    } else{
                        psum += 1;
                    }
                }
                if(Math.abs(psum - target) < SMOOTH_K_TOLERANCE){
                    break;
                }
                if(psum > target){
                    hi = mid;
                    mid = (lo + hi) / 2;
                }else{
                    lo = mid;
                    if(hi===Number.MAX_VALUE){
                        mid *= 2;
                    }else{
                        mid = (lo + hi) / 2;
                    }
                }
            }
            result[i] = mid;
            if(rho[i] > 0.0){
                const ith_distances_mean=non_zero_dists.reduce(function(a, b) { return a + b; })/lenDistCol;
                const tmpVal=MIN_K_DIST_SCALE * ith_distances_mean;
                if(result[i] < tmpVal){
                    result[i] = tmpVal;
                }
            }else{
                if(result[i] < DISTMEANSCALED){
                    result[i] = DISTMEANSCALED;
                }
            }
        }
        return [result, rho];
    }
    static compute_membership_strengths(knn_indices, knn_dists, sigmas, rhos){
        const n_samples = knn_indices.length;
        const n_neighbors = knn_indices[0].length;
        let rows = new Array(n_samples * n_neighbors).fill(0);
        let cols= new Array(n_samples * n_neighbors).fill(0);
        let vals= new Array(n_samples * n_neighbors).fill(0);
        let val=0;
        for(let i=0;i<n_samples;++i){
            for(let j=0;j<n_neighbors;++j){
                if(knn_indices[i][j]===-1){
                    continue;
                }
                const ind_ij=i * n_neighbors + j;
                if(knn_indices[i][j]===i){
                    val=0;
                }else if(knn_dists[i][j]-rhos[i]<=0){
                    val=1;
                }else{
                    val=Math.exp(-((knn_dists[i][j] - rhos[i]) / (sigmas[i])));
                }
                rows[ind_ij] = i;
                cols[ind_ij] = knn_indices[i][j];
                vals[ind_ij] = val;
            }
        }
        return [rows,cols,vals,n_samples,n_samples];
    }
    static randomEmbedding(graphInLength,n_components,random_state){
        let embedding=[];
        for(let i=0;i<graphInLength;++i){
            embedding.push([]);
            for(let j=0;j<n_components;++j){
                embedding[i].push(Math.random()*20-10);
            }
        }
        return embedding
    }
    static fuzzy_simplicial_set(X,
                                n_neighbors,
                                random_state,
                                metric,
                                metric_kwds=[],
                                knn_indicesIn=null,
                                knn_distsIn=null,
                                angular=false,
                                set_op_mix_ratio=1.0,
                                local_connectivity=1.0){
        let [knn_indices, knn_dists]=[knn_indicesIn,knn_distsIn];
        let dummy=0;
        if(knn_indices===null || knn_dists===null){
            // console.log("nearest_neighbors in fuzzy_simplicial_set begin",currentTime())
            const res = UMAP.nearest_neighbors(X, n_neighbors, metric, metric_kwds, angular, random_state);
            [knn_indices, knn_dists, dummy]=res;
        }
        // console.log("smooth_knn_dist begin",currentTime())
        let [sigmas, rhos] = UMAP.smooth_knn_dist(knn_dists, n_neighbors,64, local_connectivity);
        // console.log("compute_membership_strengths begin",currentTime())
        let [rows,cols,vals,dim0,dim1] = UMAP.compute_membership_strengths(knn_indices, knn_dists, sigmas, rhos);
        // console.log("X")
        // console.log(X)
        // console.log("knn_indices")
        // console.log(knn_indices)
        // console.log("knn_dists")
        // console.log(knn_dists)
        // console.log("sigmas")
        // console.log(sigmas)
        // console.log("rhos")
        // console.log(rhos)
        // console.log("rows")
        // console.log(rows)
        // console.log("cols")
        // console.log(cols)
        // console.log("vals")
        // console.log(vals)
        let result = new CooSparseMatrix();
        result.addCooData(vals,rows,cols,dim0,dim1);
        result.eliminate_zeros();
        result.sum_duplicates();
        let transpose = result.transpose();
        let prod_matrix = result.multiplyElementwise(transpose);
        // console.log("prod_m")
        // console.log(prod_matrix)
        if(prod_matrix.data.length>0){
            // /* result = (
            //             set_op_mix_ratio * (result + transpose - prod_matrix)
            //             + (1.0 - set_op_mix_ratio) * prod_matrix
            // )*/
            if(set_op_mix_ratio===0){
                result = prod_matrix;
            }else if(set_op_mix_ratio===1){
                result = result.add(transpose);
                result = result.add(prod_matrix.multiplyByScalar(-1));
            }else{
                result = result.add(transpose);
                result = result.add(prod_matrix.multiplyByScalar(-1));
                result = result.multiplyByScalar(set_op_mix_ratio);
                result = result.add(prod_matrix.multiplyByScalar(1 - set_op_mix_ratio));
            }
        }else{
            result=result.add(transpose);
            result=result.multiplyByScalar(set_op_mix_ratio);
        }
        result.eliminate_zeros();
        result.sum_duplicates();
        result.eliminate_zeros();
        // console.log("resultData")
        // console.log(result.data)
        // console.log("resultRow")
        // console.log(result.row)
        // console.log("resultCol")
        // console.log(result.col)
        // console.log(result.data.sort((a,b)=>{
        //         if(a<b){
        //             return -1;
        //         }
        //         return 1;
        //     }
        // ))
        return result;
    }
    static simplicial_set_embedding(
        data,
        graphIn,
        n_components,
        initial_alpha,
        a,
        b,
        gamma,
        negative_sample_rate,
        n_epochs,
        init,
        random_state,
        metric,
        metric_kwds
    ){
        // console.log(graphIn,"simplicial_set_embedding graphIn")
        const n_samples = graphIn.dim0;
        const n_vertices = graphIn.dim1;
        if(n_epochs <= 0){
            if(n_samples<=10000){
                n_epochs=500;
            }else{
                n_epochs=200;
            }
        }
        let graph = new CooSparseMatrix();
        graph.addCooMatrix(graphIn);
        graph.sum_duplicates();
        graph.eliminate_zeros();
        const graphDataLen=graph.data.length;
        const graphDataMax=Math.max(...graph.data);
        const threshold=graphDataMax/n_epochs;
        for(let i=0;i<graphDataLen;++i){
            if(graph.data[i]<threshold){
                graph.data[i]=0;
            }
        }
        graph.eliminate_zeros();
        //DENSE FROM THIS POINT ON IF NECESSARY
        // let graph=[];
        // let maxVal=Number.MIN_VALUE;
        // for(let i=0;i<n_samples;++i){
        //     graph.push([]);
        //     for(let j=0;j<n_vertices;++j){
        //         let val = graphIn[i][j];
        //         graph[j].push(val);
        //         if(val>maxVal){
        //             maxVal=val;
        //         }
        //     }
        // }
        // for(let i=0;i<n_samples;++i){
        //     for(let j=0;j<n_vertices;++j){
        //         if(graph[i][j]<maxVal/n_epochs){
        //             graph[i][j]=0;
        //         }
        //     }
        // }

        let embedding = [];
        if(typeof init === "string" && init==="random"){
            embedding=UMAP.randomEmbedding(graphIn.dim0,n_components,random_state);
        }else if(typeof init === "string" && init==="spectral"){
            try {
                let initialisation = spectral_layout(
                    data,
                    graph,
                    n_components,
                    random_state,
                    metric,
                    metric_kwds,
                );
                // console.log(initialisation,"initialization");
                let maxInit=Number.MIN_VALUE;
                const initialisationDim0=initialisation.length;
                const initialisationDim1=initialisation[0].length;
                for(let i=0;i<initialisationDim0;++i){
                    for(let j=0;j<initialisationDim1;++j){
                        const val=initialisation[i][j];
                        if(val>maxInit){
                            maxInit=val;
                        }
                    }
                }
                const expansion = 10.0 / maxInit;
                // console.log(expansion);
                for(let i=0;i<graph.dim0;++i){
                    embedding.push([]);
                    for(let j=0;j<n_components;++j){
                        embedding[i].push((initialisation[i][j] * expansion)+generateGaussian(0,0.0001));
                    }
                }
            }
            catch(err) {
                console.error(err);
                embedding=UMAP.randomEmbedding(graphIn.dim0,n_components,random_state);
            }

        }else{
            console.log("initialization with pre-defined initialization data is not implemented")
            //     init_data = np.array(init)
            //     if len(init_data.shape) == 2:
            //     if np.unique(init_data, axis=0).shape[0] < init_data.shape[0]:
            //     tree = KDTree(init_data)
            //     dist, ind = tree.query(init_data, k=2)
            //     nndist = np.mean(dist[:, 1])
            //     embedding = init_data + np.random.normal(
            //         scale=0.001 * nndist, size=init_data.shape
            //     ).astype(np.float32)
            // else:
            //     embedding = init_data
        }
        // console.log(graph,"graph")
        // console.log("make_epochs_per_sample begin",currentTime())
        let epochs_per_sample = UMAP.make_epochs_per_sample(graph.data, n_epochs);
        // console.log(epochs_per_sample,"epochs_per_sample")
        let head = graph.row;
        let tail = graph.col;
        let rng_state =[];
        for(let i=0;i<3;++i){
            rng_state.push(random_state.int32());
        }
        // console.log(embedding);
        // return embedding
        // console.log("optimize_layout begin",currentTime())
        return UMAP.optimize_layout(
            embedding,
            embedding,
            head,
            tail,
            n_epochs,
            n_vertices,
            epochs_per_sample,
            a,
            b,
            rng_state,
            gamma,
            initial_alpha,
            negative_sample_rate
        );
    }
    fit(X){
        this._raw_data=X;
        if(this._a===null || this._b===null){
            [this._a, this._b] = UMAP.find_ab_params(this.spread, this.min_dist);
            // console.log(this._a,"a")
            // console.log(this._b,"b")
        }else{
            this._a = this.a;
            this._b = this.b;
        }
        if(this.metric_kwds!==null){
            this._metric_kwds = this.metric_kwds;
        }else{
            this._metric_kwds = [];
        }
        // if(this.target_metric_kwds!==null){
        //     this._target_metric_kwds = this.target_metric_kwds;
        // }else{
        //     this._target_metric_kwds = [];
        // }
        this._initial_alpha = this.learning_rate;
        const lenX=X.length;
        if(X.length <= this.n_neighbors){
            if(lenX === 1){
                let tmp=[];
                for(let i=0;i<this.n_components;++i){
                    tmp.push(0);
                }
                this.embedding_ = tmp;
                return;
            }
            this._n_neighbors = lenX - 1;
        }else{
            this._n_neighbors = this.n_neighbors;
        }
        let random_state = UMAP.check_random_state(this.random_state);
        if(lenX<4096){
            // console.log("Pairwise distances begin",currentTime())
            const dmat = pairwise_distances(X,this.distanceFunction,this._metric_kwds);
            // console.log("fuzzy_simplicial_set begin",currentTime())
            this.graph_ = UMAP.fuzzy_simplicial_set(
                dmat,
                this._n_neighbors,
                random_state,
                "precomputed",
                this._metric_kwds,
                null,
                null,
                this.angular_rp_forest,
                this.set_op_mix_ratio,
                this.local_connectivity,
            );
        }else{
            console.log("sparse UMAP not implemented");
            return;
        }
        // console.log("simplicial_set_embedding begin",currentTime())
        this.embedding_ = UMAP.simplicial_set_embedding(
            this._raw_data,
            this.graph_,
            this.n_components,
            this._initial_alpha,
            this._a,
            this._b,
            this.repulsion_strength,
            this.negative_sample_rate,
            this.n_epochs!==null ? this.n_epochs:0,
            this.init,
            random_state,
            this.distanceFunction,
            this._metric_kwds
        );
        const lenRows=this.embedding_.length;
        const lenCols=this.embedding_[0].length;
        let colmids=[];
        for(let j=0;j<lenCols;++j){
            colmids.push([]);
            for(let i=0;i<lenRows;++i){
                colmids[j].push(this.embedding_[i][j]);
            }
            colmids[j]=(Math.max(...colmids[j])+Math.min(...colmids[j]))/2
        }
        for(let i=0;i<lenRows;++i){
            for(let j=0;j<lenCols;++j){
                this.embedding_[i][j]-=colmids[j];
            }
        }
        // this._input_hash = joblib.hash(self._raw_data)
    }
    fit_transform(X){
        this.fit(X);
        return this.embedding_;
    }
    static make_epochs_per_sample(weights, n_epochs){
        let result=new Array(weights.length).fill(-1);
        const lenRes=result.length;
        let n_samples=[];
        let maxWeight=Number.MIN_VALUE;
        for(let i=0;i<lenRes;++i){
            let weight=weights[i];
            if(weight>maxWeight){
                maxWeight=weight
            }
            n_samples.push(n_epochs*weight);
        }
        for(let i=0;i<lenRes;++i){
            n_samples[i]/=maxWeight;
            const n_sample=n_samples[i];
            if(n_sample>0){
                result[i]=n_epochs/n_sample;
            }
        }
        return result
    }
    static optimize_layout(
        head_embedding,
        tail_embedding,
        head,
        tail,
        n_epochs,
        n_vertices,
        epochs_per_sample,
        a,
        b,
        rng_state,
        gamma=1.0,
        initial_alpha=1.0,
        negative_sample_rate=5.0
    ){
        const dim = head_embedding[0].length;
        const move_other = head_embedding.length === tail_embedding.length;
        let epochs_per_negative_sample = [];
        epochs_per_sample.forEach((epoch)=>{
            epochs_per_negative_sample.push(epoch/negative_sample_rate);
        });
        let alpha = initial_alpha;
        let epoch_of_next_negative_sample = epochs_per_negative_sample.slice();
        let epoch_of_next_sample = epochs_per_sample.slice();
        const epochs_per_sampleLen=epochs_per_sample.length;
        for(let n=0;n<n_epochs;++n){
            for(let i=0;i<epochs_per_sampleLen;++i){
                if(epoch_of_next_sample[i] <= n){
                    const j = head[i];
                    const k = tail[i];
                    let current = head_embedding[j];
                    let other = tail_embedding[k];
                    const dist_squared = rdist(current, other);
                    let grad_coeff=0;
                    if(dist_squared>0){
                        grad_coeff=-2 * a * b * Math.pow(dist_squared, b - 1);
                        grad_coeff /= a * Math.pow(dist_squared, b) + 1;
                    }
                    for(let d=0;d<dim;++d){
                        const grad_dAlpha = clip(grad_coeff * (current[d] - other[d]),4)*alpha;
                        current[d] += grad_dAlpha;
                        if(move_other){
                            other[d] -= grad_dAlpha;
                        }
                    }
                    epoch_of_next_sample[i] += epochs_per_sample[i];
                    const n_neg_samples = Math.floor((n - epoch_of_next_negative_sample[i]) / epochs_per_negative_sample[i]);
                    for(let p=0;p<n_neg_samples ;++p){
                        let k = ((tau_rand_int(rng_state) % n_vertices) + n_vertices) % n_vertices;
                        if(k<0){
                            k+=tail_embedding.length;
                        }
                        const other = tail_embedding[k];
                        const dist_squared = rdist(current, other);
                        let grad_coeff=0;
                        if(dist_squared>0){
                            grad_coeff = 2 * gamma * b;
                            grad_coeff /= (0.001 + dist_squared) * (a * Math.pow(dist_squared, b) + 1);
                        }else if(j===k){
                            continue;
                        }
                        for(let d=0;d<dim;++d){
                            let grad_d=4;
                            if(grad_coeff > 0.0){
                                grad_d = clip(grad_coeff * (current[d] - other[d]),4);
                            }
                            current[d] += grad_d * alpha;
                        }
                    }
                    epoch_of_next_negative_sample[i] += (n_neg_samples * epochs_per_negative_sample[i]);
                }
            }
            alpha = initial_alpha * (1.0 - (n / n_epochs));
        }
        return head_embedding
    }
}