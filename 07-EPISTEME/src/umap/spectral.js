import {pairwise_distances, pairwise_distancesXY} from "./umap_utils";
import {CsrSparseMatrix} from "./CsrSparseMatrix";
import {SpectralEmbedding_precomputed} from "./SpectralEmbedding_precomputed";

let math = require('mathjs/core').create();
math.import(require('mathjs/lib/type/matrix'));
math.import(require('mathjs/lib/function/matrix/transpose'));

const NULL_IDX=-9999;
const matrixLib = require('ml-matrix');

export function spectral_layout(
    data,
    graph,
    dim,
    random_state,
    metric="euclidean",
    metric_kwds=[]){
    const [n_components, labels] = connected_components(graph);
    if(n_components > 1){
        return multi_component_layout(
            data,
            graph,
            n_components,
            labels,
            dim,
            random_state,
            metric,
            metric_kwds,
        );
    }
    let denseGraph=new matrixLib.Matrix(graph.toDense());
    let diag_data = graph.sumOverAxis0();
    let I = matrixLib.Matrix.eye(graph.dim0);
    let D = matrixLib.Matrix.eye(graph.dim0);
    for(let i=0;i<graph.dim0;++i){
        diag_data[i]=1/Math.sqrt(diag_data[i]);
        D.set(i,i,diag_data[i]);
    }
    let L = matrixLib.Matrix.sub(I,D.mmul(denseGraph).mmul(D));
    let eigenDecompL = new matrixLib.EigenvalueDecomposition(L);
    let realEigenvalues = eigenDecompL.realEigenvalues;
    let imaginaryEigenvalues = eigenDecompL.imaginaryEigenvalues;
    let magEigenvalues=[];
    for(let i=0;i<realEigenvalues.length;++i){
        let mag=Math.sqrt(Math.pow(realEigenvalues[i],2)+Math.pow(imaginaryEigenvalues[i],2));
        magEigenvalues.push({
           mag:mag,
           ind:i
        });
    }
    magEigenvalues.sort(function(a,b) {
        if(a.mag<b.mag){
            return -1;
        }
        return 1;
    });
    let eigenvectors = eigenDecompL.eigenvectorMatrix;
    let eigenVectorsOfSmallestEigenvalues=[];
    for(let i=0;i<dim+1;++i){
        eigenVectorsOfSmallestEigenvalues.push(eigenvectors.columnView(magEigenvalues[i].ind).to1DArray());
    }
    return math.transpose(eigenVectorsOfSmallestEigenvalues);

    //SPARSE approach
    // let I = CooSparseMatrix();
    // I.addIdentityData(graph.dim0);
    // let D = CooSparseMatrix();
    // D.addMainDiagonalData(diag_data);
    //
    // let L = I - D * graph * D;
    // let k = dim + 1;
    // let num_lanczos_vectors = Math.max(2 * k + 1, Math.sqrt(graph.dim0));
    // let v0=new Array(L.dim0).fill(1);
    // let [eigenvalues, eigenvectors]= eigsh(
    //     L,
    //     k,
    //     null,
    //     null,
    //     "SM",
    //     v0,
    //     num_lanczos_vectors,
    //     graph.dim0 * 5,
    //     1e-4,
    //     true,
    //     null,
    //     null,
    //     'normal'
    // );
    //
    // let order = np.argsort(eigenvalues)[1:k];
    //
    // return eigenvectors[:, order]
    // except scipy.sparse.linalg.ArpackError:
    // console.log("WARNING: spectral initialisation failed! The eigenvector solver failed. This is likely due to too small an eigengap. Consider adding some noise or jitter to your data. Falling back to random initialisation!");
    // return random_state.uniform(low=-10.0, high=10.0, size=(graph.shape[0], dim))
}

export function connected_components(coographIn, directed=true, connection='weak', return_labels=true) {
    let csgraph=new CsrSparseMatrix();
    csgraph.addCooData(coographIn);
    if(connection=== 'weak'){
        directed = false
    }
    let labels=new Array(csgraph.dim0).fill(NULL_IDX);
    let n_components=0;
    if(directed){
        n_components = _connected_components_directed(
            csgraph.indices,
            csgraph.indptr,
            labels);
    }else{
        let csgraph_T = coographIn.transpose().toCsr();
        n_components = _connected_components_undirected(
            csgraph.indices,
            csgraph.indptr,
            csgraph_T.indices,
            csgraph_T.indptr,
            labels);
    }
    // console.log(n_components,labels,"_connected_components_undirected")
    if(return_labels){
        return [n_components, labels];
    }
    return n_components;
}
export function multi_component_layout(
    data,
    graph,
    n_components,
    component_labels,
    dim,
    random_state,
    distanceFunction,
    metric_kwds
) {
    let result=[];
    for(let i=0;i<graph.dim0;++i){
        result.push([]);
        for(let j=0;j<dim;++j){
            result[i].push(0);
        }
    }
    let meta_embedding = null;
    if(n_components > 2 * dim){
        meta_embedding = component_layout(
            data,
            n_components,
            component_labels,
            dim,
            distanceFunction,
            metric_kwds,
        )
    }else{
        const k = Math.ceil(n_components / 2.0);
        const stackedWidthBase=dim;
        const heightBase=k;
        //base = np.hstack([np.eye(k), np.zeros((k, dim - k))])
        let base=[];
        for(let i=0;i<heightBase;++i){
            base.push([]);
            for(let j=0;j<stackedWidthBase;++j){
                base[i].push(0);
            }
        }
        for(let i=0;i<heightBase;++i){
            base[i][i]=1;
        }
        const width_meta_embedding=stackedWidthBase;
        const stackedHeight_meta_embedding=2*heightBase;
        //meta_embedding = np.vstack([base, -base])[:n_components]
        meta_embedding=[];
        for(let i=0;i<stackedHeight_meta_embedding;++i){
            meta_embedding.push([]);
            for(let j=0;j<width_meta_embedding;++j){
                meta_embedding[i].push(0);
            }
        }
        for(let i=0;i<heightBase;++i){
            for(let j=0;j<width_meta_embedding;++j){
                const val=base[i][j];
                meta_embedding[i][j]=val;
                meta_embedding[i+heightBase][j]=-val;
            }
        }
        meta_embedding=meta_embedding.slice(0,n_components);
    }
    for(let label=0;label<n_components;++label){
        let validIndices=[];
        let j=0;
        let validIndicesReverse=new Map();
        for(let i=0;i<component_labels.length;++i){
            if(component_labels[i]===label){
                validIndices.push(i);
                validIndicesReverse.set(i,j);
                j+=1;
            }
        }


        // console.log(graph,"graph")
        const component_graph=graph.filterByRowCol(validIndices,validIndicesReverse);
        // let component_graph = graph.tocsr()[component_labels == label, :].tocsc()
        // component_graph = component_graph[:, component_labels == label].tocoo()

        // console.log(component_graph,"component_graph")
        // console.log(meta_embedding,"meta_embedding")
        let distances = pairwise_distancesXY([meta_embedding[label]], meta_embedding,distanceFunction,metric_kwds);
        // console.log(distances)
        let data_range=Number.MAX_VALUE;
        const distancesDim0=distances.length;
        let distancesDim1=1;
        if(Array.isArray(distances[0])){
            distancesDim1=distances[0].length;
            for(let p=0;p<distancesDim0;++p){
                for(let q=0;q<distancesDim1;++q){
                    const d=distances[p][q];
                    if(d>0){
                        if(d<data_range){
                            data_range=d;
                        }
                    }
                }
            }
        }else{
            for(let p=0;p<distancesDim0;++p){
                const d=distances[p];
                if(d>0){
                    if(d<data_range){
                        data_range=d;
                    }
                }
            }
        }
        data_range/=2;
        if(component_graph.dim0 < 2 * dim){
            for(let r=0;r<component_labels.length;++r){
                if(component_labels[r]===label){
                    result[r]=[];
                    for(let j=0;j<dim;++j){
                        result[r].push(Math.random()*data_range*2-data_range+meta_embedding[label][j]);
                    }
                    // result[r]=random_state.uniform(
                    //     low=-data_range,
                    //     high=data_range,
                    //     size=(component_graph.dim0, dim),
                    //     )
                    //     + meta_embedding[label];
                }
            }
            continue;
        }
        const diag_data = component_graph.sumOverAxis0();
        let I = matrixLib.Matrix.eye(component_graph.dim0);
        let D = matrixLib.Matrix.eye(component_graph.dim0);
        for(let i=0;i<component_graph.dim0;++i){
            diag_data[i]=1/Math.sqrt(diag_data[i]);
            D.set(i,i,diag_data[i]);
        }
        // console.log(diag_data,label,"diag_data")
        // console.log(component_graph)
        let denseGraph=new matrixLib.Matrix(component_graph.toDense());
        let L = matrixLib.Matrix.sub(I,D.mmul(denseGraph).mmul(D));
        // console.log(L)
        let eigenDecompL = new matrixLib.EigenvalueDecomposition(L);

        // console.log(eigenDecompL)
        let realEigenvalues = eigenDecompL.realEigenvalues;
        let imaginaryEigenvalues = eigenDecompL.imaginaryEigenvalues;
        let magEigenvalues=[];
        for(let i=0;i<realEigenvalues.length;++i){
            let mag=Math.sqrt(Math.pow(realEigenvalues[i],2)+Math.pow(imaginaryEigenvalues[i],2));
            magEigenvalues.push({
                mag:mag,
                ind:i
            });
        }
        magEigenvalues.sort(function(a,b) {
            if(a.mag<b.mag){
                return -1;
            }
            return 1;
        });
        // console.log(magEigenvalues,"magEigenvalues")
        let eigenvectors = math.transpose(eigenDecompL.eigenvectorMatrix.to2DArray());
        // console.log(eigenvectors,"eigenvectors")
        let component_embedding=[];
        let maxEmbedding=Number.MIN_VALUE;
        for(let i=1;i<dim+1;++i){
            let arr=eigenvectors[magEigenvalues[i].ind];
            // console.log(arr,"eigenvector",i)
            component_embedding.push(arr.slice());
            arr.forEach(val=>{
                const valAbs=Math.abs(val);
                if(valAbs>maxEmbedding){
                    maxEmbedding=valAbs;
                }
            });
        }
        // console.log(data_range,"data_range")
        const expansion = data_range / maxEmbedding;
        // console.log(expansion,"expansion")
        // console.log(data_range,"data_range")
        // console.log(expansion,"expansion")
        for(let i=0;i<component_embedding.length;++i){
            const rowFactor=(label%2===0||i%2===0?1:-1);
            for(let j=0;j<component_embedding[0].length;++j){
                component_embedding[i][j]*=expansion*rowFactor;
            }
        }
        component_embedding=math.transpose(component_embedding);
        // console.log(component_embedding,"component_embedding")
        // console.log(meta_embedding,"meta_embedding")
        // console.log(result,"result")
        // console.log(component_labels,"component_labels")
        // console.log(label,"label")
        for(let r=0;r<component_labels.length;++r){
            if(component_labels[r]===label){
                for(let j=0;j<dim;++j){
                    result[r][j]=component_embedding[validIndicesReverse.get(r)][j]+meta_embedding[label][j];
                }
            }
        }
        // SPARSE approach
        // let diag_data = component_graph.sumOverAxis0();
        // for(let i=0;i<component_graph.dim0;++i){
        //     diag_data[i]=1/Math.sqrt(diag_data[i]);
        // }
        // let I = CooSparseMatrix();
        // I.addIdentityData(component_graph.dim0);
        // let D=CooSparseMatrix();
        // D.addMainDiagonalData(diag_data);
        // L = I - D * component_graph * D
        // let k = dim + 1;
        // let num_lanczos_vectors = Math.max(2 * k + 1, Math.sqrt(component_graph.dim0));
        // let v0=new Array(L.dim0).fill(1);
        // let [eigenvalues, eigenvectors ]= eigsh(
        //     L,
        //     k,
        //     null,
        //     null,
        //     "SM",
        //     v0,
        //     num_lanczos_vectors,
        //     graph.dim0 * 5,
        //     1e-4,
        //     true,
        //     null,
        //     null,
        //     'normal',
        // );
        // order = np.argsort(eigenvalues)[1:k]
        // component_embedding = eigenvectors[:, order]
        //
        //     except scipy.sparse.linalg.ArpackError:
        //     warn(
        //         "WARNING: spectral initialisation failed! The eigenvector solver\n"
        //     "failed. This is likely due to too small an eigengap. Consider\n"
        //     "adding some noise or jitter to your data.\n\n"
        //     "Falling back to random initialisation!"
        // )
        //     result[component_labels == label] = (
        //         random_state.uniform(
        //             low=-data_range,
        //             high=data_range,
        //             size=(component_graph.shape[0], dim),
        //         )
        //         + meta_embedding[label]
        //     )
    }
    return result;
}
export function component_layout(
    data,
    n_components,
    component_labels,
    dim,
    distanceFunction,
    metric_kwds
) {
    let dataDim1=data[0].length;
    let component_centroids=[];
    for(let label=0;label<n_components;++label){
        // for label in range(n_components):
        // component_centroids[label] = data[component_labels == label].mean(axis=0)
        // (axis=0 mean means taking the average across each row)
        // for all rows with correct labels
        component_centroids.push([]);
        for(let k=0;k<dataDim1;++k){
            component_centroids[label].push(0);
        }
        let validRows=[];
        for(let j=0;j<n_components;++j){
            if(component_labels[j]===label){
                validRows.push(j);
            }
        }
        let lenValidRows=validRows.length;
        for(let j=0;j<lenValidRows;++j){
            for(let k=0;k<dataDim1;++k){
                component_centroids[label][k]+=data[validRows[j]][k]/lenValidRows;
            }
        }
    }
    let distance_matrix = pairwise_distances(component_centroids, distanceFunction, metric_kwds);
    let distance_matrixDim0=distance_matrix.length;
    let distance_matrixDim1=distance_matrix[0].length;
    let affinity_matrix=[];
    for(let i=0;i<distance_matrixDim0;++i){
        affinity_matrix.push([]);
        for(let j=0;j<distance_matrixDim1;++j){
            affinity_matrix[i].push(Math.exp(-Math.pow(distance_matrix[i][j],2)));
        }
    }
    let component_embedding= new SpectralEmbedding_precomputed(
        dim
    ).fit_transform_precomputed(affinity_matrix);
    let component_embeddingDim0=component_embedding.length;
    let component_embeddingDim1=component_embedding[0].length;
    let maxVal=Number.MIN_VALUE;
    for(let i=0;i<component_embeddingDim0;++i){
        for(let j=0;j<component_embeddingDim1;++j){
            let val=component_embedding[i][j];
            if(val>maxVal){
                maxVal=val;
            }
        }
    }
    for(let i=0;i<component_embeddingDim0;++i){
        for(let j=0;j<component_embeddingDim1;++j){
            component_embedding[i][j]/=maxVal;
        }
    }
    return component_embedding;
}
export function _connected_components_directed(indices,indptr,labels) {
    const VOID = -1;
    const END = -2;
    const N = labels.length;
    let w=0;
    let low_v=0;
    let low_w=0;
    let root=0;
    let f=0;
    let b=0;
    let SS_head=END;
    let SS=new Array(N).fill(VOID);
    let stack_f=new Array(N).fill(VOID);
    let stack_b=new Array(N).fill(VOID);
    let lowlinks=new Array(labels.length).fill(VOID);
    let index=0;
    let label=N-1;
    let stack_head=0;
    for(let v=0;v<N;++v){
        if(lowlinks[v]===VOID){
            stack_head=v;
            stack_f[v]=END;
            stack_b[v]=END;
            while (stack_head!==END){
                v=stack_head;
                if(lowlinks[v]===VOID){
                    lowlinks[v]=index;
                    index+=1;
                    for(let j=indptr[v];j<indptr[v+1];++j){
                        w = indices[j];
                        if(lowlinks[w] === VOID){
                            if(stack_f[w] !== VOID){
                                f = stack_f[w];
                                b = stack_b[w];
                                if(b !== END){
                                    stack_f[b] = f;
                                }
                                if(f !== END){
                                    stack_b[f] = b;
                                }
                            }
                            stack_f[w] = stack_head;
                            stack_b[w] = END;
                            stack_b[stack_head] = w;
                            stack_head = w;
                        }
                    }
                }else {
                    stack_head = stack_f[v];
                    if(stack_head >= 0){
                        stack_b[stack_head] = END;
                    }
                    stack_f[v] = VOID;
                    stack_b[v] = VOID;
                    root=1;
                    low_v = lowlinks[v];
                    for(let j=indptr[v];j<indptr[v+1];++j){
                        low_w = lowlinks[indices[j]];
                        if(low_w < low_v){
                            low_v = low_w;
                            root=0;
                        }
                    }
                    lowlinks[v] = low_v;
                    if(root){
                        index -= 1;
                        while (SS_head !== END && lowlinks[v] <= lowlinks[SS_head]){
                            w = SS_head;
                            SS_head = SS[w];
                            SS[w] = VOID;
                            labels[w] = label;
                            index-=1;
                        }
                    }else{
                        SS[v] = SS_head;
                        SS_head = v;
                    }
                }
            }
        }
        labels[v]=(N-1)-labels[v];
    }
    return (N - 1) - label;
}
export function _connected_components_undirected(
    indices1,
    indptr1,
    indices2,
    indptr2,
    labels
) {
    const N = labels.length;
    const VOID = -1;
    const END = -2;
    let label = 0;
    let SS_head=END;
    for(let v=0;v<N;++v){
        labels[v]=VOID;
    }
    for(let v=0;v<N;++v){
        if(labels[v]===VOID){
            SS_head=v;
            labels[v]=END;
            while(SS_head !== END){
                v = SS_head;
                SS_head = labels[v];
                labels[v] = label;
                for(let j=indptr1[v];j<indptr1[v+1];++j){
                    const w = indices1[j];
                    if(labels[w] === VOID){
                        labels[w] = SS_head;
                        SS_head = w;
                    }
                }
                for(let j=indptr2[v];j<indptr2[v+1];++j){
                    const w = indices2[j];
                    if(labels[w] === VOID){
                        labels[w] = SS_head;
                        SS_head = w;
                    }
                }
            }
            label+=1;
        }
    }
    return label;
}
