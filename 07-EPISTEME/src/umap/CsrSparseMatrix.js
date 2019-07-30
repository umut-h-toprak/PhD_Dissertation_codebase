export class CsrSparseMatrix{
    constructor() {
        this.data=[];
        this.indices=[];
        this.indptr=[];
        this.dim0=0;
        this.dim1=0;
    }
    addCooData(cooIn){
        if(!cooIn.has_canonical_format){
            cooIn.eliminate_zeros();
        }
        cooIn.sum_duplicates();
    //     * Input Arguments:
    //     *   I  n_row      - number of rows in A (cooIn.dim0)
    //     *   I  n_col      - number of columns in A (cooIn.dim1)
    //     *   I  nnz        - number of nonzeros in A (cooIn.data.length)
    //     *   I  Ai[nnz(A)] - row indices
    //     *   I  Aj[nnz(A)] - column indices
    //     *   T  Ax[nnz(A)] - nonzeros
    //     * Output Arguments:
    //     *   I Bp  - row pointer (this.indptr)
    //     *   I Bj  - column indices (this.indices)
    //     *   T Bx  - nonzeros (this.data)
        const n_nonzero=cooIn.data.length;
        const n_row=cooIn.dim0;
        this.indptr=new Array(n_row+1).fill(0);
        for (let n = 0; n < n_nonzero; ++n){
            this.indptr[cooIn.row[n]]+=1;
        }
        for(let i = 0, cumsum = 0; i < n_row; ++i){
            const temp = this.indptr[i];
            this.indptr[i] = cumsum;
            cumsum += temp;
        }
        this.indptr[n_row] = n_nonzero;
        for(let n = 0; n < n_nonzero; ++n){
            const row  = cooIn.row[n];
            const dest = this.indptr[row];
            this.indices[dest] = cooIn.col[n];
            this.data[dest] = cooIn.data[n];
            this.indptr[row]+=1;
        }
        for(let i = 0, last = 0; i <= n_row; i++){
            const temp = this.indptr[i];
            this.indptr[i]  = last;
            last = temp;
        }
        this.dim0=cooIn.dim0;
        this.dim1=cooIn.dim1;
        // this.sum_duplicates();
        // this.eliminate_zeros();
    }
    todense(){
        let res=[];
        for(let i = 0; i < this.dim0; ++i){
            res.push(new Array(this.dim1).fill(0));
            for(let j = this.indptr[i]; j < this.indptr[i+1]; ++j){
                res[i][this.indices[j]] += this.data[j];

            }
        }
        return res;
    }
    // sum_duplicates(){
    //     let nnz = 0;
    //     let row_end = 0;
    //     for(let i = 0; i < this.dim0; ++i){
    //         let jj = row_end;
    //         row_end = this.indptr[i+1];
    //         while( jj < row_end ){
    //             let j = this.indices[jj];
    //             let x = this.data[jj];
    //             jj+=1;
    //             while(jj < row_end && this.indices[jj] === j ){
    //                 x += this.data[jj];
    //                 jj++;
    //             }
    //             this.indices[nnz] = j;
    //             this.data[nnz] = x;
    //             nnz+=1;
    //         }
    //         this.indptr[i+1] = nnz;
    //     }
    // }
    // eliminate_zeros(){
    //     let nnz = 0;
    //     let row_end = 0;
    //     for(let i = 0; i < this.dim0; ++i){
    //         let jj = row_end;
    //         row_end = this.indptr[i+1];
    //         while( jj < row_end ){
    //             let j = this.indices[jj];
    //             let x = this.data[jj];
    //             if(x !== 0){
    //                 this.indices[nnz] = j;
    //                 this.data[nnz] = x;
    //                 nnz++;
    //             }
    //             jj++;
    //         }
    //         this.indptr[i+1] = nnz;
    //     }
    //     this.prune();
    // }
    // prune(){
    //
    // }
}