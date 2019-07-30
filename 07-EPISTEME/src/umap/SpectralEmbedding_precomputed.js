const matrixLib = require('ml-matrix');
let math = require('mathjs/core').create();
math.import(require('mathjs/lib/type/matrix'));
math.import(require('mathjs/lib/function/matrix/transpose'));

export class SpectralEmbedding_precomputed {
    constructor(
        n_components=2,
        gamma=null,
        random_state=null,
        n_neighbors=null
    ) {
        this.n_components = n_components;
        this.gamma = gamma;
        this.random_state = random_state;
        this.n_neighbors = n_neighbors;
    }
    fit_precomputed(X){
        this.embedding_ = SpectralEmbedding_precomputed.spectral_embedding(
            X,
            this.n_components,
            this.random_state
        )
    }
    fit_transform_precomputed(X){
        this.fit_precomputed(X);
        return this.embedding_;
    }
    static spectral_embedding(
        adjacency,
        n_components=8,
        random_state=None,
        norm_laplacian=true,
        drop_first=true
    ){
        // let n_nodes = adjacency.length;
        if(drop_first){
            n_components +=1;
        }
        let [laplacian, dd] = SpectralEmbedding_precomputed.csgraph_laplacian_dense(
            adjacency,
            norm_laplacian,
            true);
        // laplacian = _set_diag(laplacian, 1, norm_laplacian); is this correct??
        if(norm_laplacian){
            let laplacianDim0=laplacian.length;
            for(let i=0;i<laplacianDim0;++i){
                laplacian[i][i]=1;
            }
        }
        let L = new matrixLib.Matrix(laplacian);
        let eigenDecompL = new matrixLib.EigenvalueDecomposition(L);
        let eigenvectors = eigenDecompL.eigenvectorMatrix;
        let embedding = math.transpose(eigenvectors).slice(0,n_components);
        SpectralEmbedding_precomputed._deterministic_vector_sign_flip(embedding);
        if(norm_laplacian){
            let embeddingDim0=embedding.length;
            let embeddingDim1=embedding[0].length;
            for(let i=0;i<embeddingDim0;++i){
                for(let j=0;j<embeddingDim1;++j){
                    embedding[i][j]/=dd[j];
                }
            }
        }
        if(drop_first){
            //return embedding[1:n_components].T
            return math.transpose(embedding.slice(1,n_components));
        }
        else{
            //return embedding[:n_components].T
            return math.transpose(embedding.slice(0,n_components));

        }

    }
    static csgraph_laplacian_dense(csgraph,
                                   normed=false,
                                   return_diag=false,
                                   use_out_degree=false){
        let degree_axis = 1;
        if(!use_out_degree){
            degree_axis = 0;
        }
        let [lap, d] = SpectralEmbedding_precomputed._laplacian_dense(
            csgraph,
            normed,
            degree_axis);
        if(return_diag){
            return [lap, d];
        }else{
            return lap;
        }
    }
    static _laplacian_dense(graph,
                            normed=false,
                            axis=0){
        let m=graph.slice();
        let mDim0=m.length;
        let mDim1=m[0].length;
        for(let i=0;i<mDim0;++i){
            m[i][i]=0;
        }
        let w=null;
        let wLen=null;
        if(axis===0){
            wLen=mDim1;
            w = new Array(mDim1).fill(0);
            for(let i=0;i<mDim0;++i){
                for(let j=0;j<mDim1;++j){
                    w[j]+=m[i][j];
                }
            }
        }else if(axis===1){
            wLen=mDim0;
            w = new Array(mDim0).fill(0);
            for(let i=0;i<mDim0;++i){
                for(let j=0;j<mDim1;++j){
                    w[i]+=m[i][j];
                }
            }
        }
        if(normed){
            let isolated_node_maskInverted=[];
            for(let i=0;i<wLen;++i){
                let cond = (w[i]===0);
                isolated_node_maskInverted.push(1-cond);
                if(cond){
                    w[i]=Math.sqrt(w[i]);
                }
            }
            let mDim0=m.length;
            let mDim1=m[0].length;
            // m /= w
            //means, divide first column by w[0], second column by w[1], third by w[2]
            // m /= w[:, np.newaxis]
            //means, divide first row by w[0], second row by w[1], third by w[2]
            // for(let i=0;i<mDim0;++i){
            //     for(let j=0;j<mDim1;++j){
            //         m[i][j]/=w[j];
            //     }
            // }
            // for(let i=0;i<mDim0;++i){
            //     for(let j=0;j<mDim1;++j){
            //         m[i][j]/=w[i];
            //     }
            // }
            // for(let i=0;i<mDim0;++i){
            //     for(let j=0;j<mDim1;++j){
            //         m[i][j]*=-1;
            //     }
            // }
            for(let i=0;i<mDim0;++i){
                for(let j=0;j<mDim1;++j){
                    m[i][j]/=-(w[i]*w[j]);
                }
            }
            SpectralEmbedding_precomputed._setdiag_dense(m, isolated_node_maskInverted);
        } else{
            let mDim0=m.length;
            let mDim1=m[0].length;
            for(let i=0;i<mDim0;++i){
                for(let j=0;j<mDim1;++j){
                    m[i][j]*=-1;
                }
            }
            SpectralEmbedding_precomputed._setdiag_dense(m, w);
        }
        return [m, w];
    }
    static _deterministic_vector_sign_flip(u){
        let uDim1=u[0].length;
        for(let i=0;i<u.length;++i){
            let maxVal=Math.max(...u[i]);
            if(maxVal<0){
                for(let j=0;j<uDim1;++j){
                    u[i][j]*=-1;
                }
            }
        }
    }
    static _setdiag_dense(A,d){
        let aDim0=A.length;
        for(let i=0;i<aDim0;++i){
            A[i][i]=d[i];
        }
    }
}