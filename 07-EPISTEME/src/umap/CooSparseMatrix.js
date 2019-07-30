import {CsrSparseMatrix} from "./CsrSparseMatrix";

export class CooSparseMatrix{
    constructor() {
        this.data=[];
        this.row=[];
        this.col=[];
        this.dim0=0;
        this.dim1=0;
        this.has_canonical_format=false;
    }
    addIdentityData(dim){
        this.dim0=dim;
        this.dim1=dim;
        for(let i=0;i<dim;++i){
            this.data.push(1);
            this.row.push(i);
            this.col.push(i);
        }
        this.has_canonical_format=true;
    }
    addMainDiagonalData(mainDiagArray){
        const dim=mainDiagArray.length;
        this.dim0=dim;
        this.dim1=dim;
        for(let i=0;i<dim;++i){
            this.data.push(1);
            this.row.push(mainDiagArray[i]);
            this.col.push(mainDiagArray[i]);
        }
        this.has_canonical_format=true;
    }
    sortCooRowOnly(newDataPoints){
        if(newDataPoints===null){
            newDataPoints=[];
            let dataLen=this.data.length;
            for(let i=0;i<dataLen;++i){
                newDataPoints.push(
                    {
                        row:this.row[i],
                        col:this.col[i],
                        data:this.data[i]
                    }
                )
            }
        }
        newDataPoints.sort(function(a,b) {
            if(a.row<b.row){
                return -1;
            }
            if(a.row>b.row){
                return 1;
            }
            return -1;
        });
        this.data=[];
        this.row=[];
        this.col=[];
        const lenNewData=newDataPoints.length;
        for(let i=0;i<lenNewData;++i){
            let newDataPoint=newDataPoints[i];
            this.data.push(newDataPoint.data);
            this.row.push(newDataPoint.row);
            this.col.push(newDataPoint.col);
        }
    }
    sortCoo(newDataPoints){
        if(newDataPoints===null){
            newDataPoints=[];
            let dataLen=this.data.length;
            for(let i=0;i<dataLen;++i){
                newDataPoints.push(
                    {
                        row:this.row[i],
                        col:this.col[i],
                        data:this.data[i]
                    }
                )
            }
        }
        newDataPoints.sort(function(a,b) {
            if(a.row<b.row){
                return -1;
            }
            if(a.row>b.row){
                return 1;
            }
            if(a.col<b.col){
                return -1;
            }
            if(a.col>b.col){
                return 1;
            }
            return -1;
        });
        this.data=[];
        this.row=[];
        this.col=[];
        const lenNewData=newDataPoints.length;
        for(let i=0;i<lenNewData;++i){
            let newDataPoint=newDataPoints[i];
            this.data.push(newDataPoint.data);
            this.row.push(newDataPoint.row);
            this.col.push(newDataPoint.col);
        }
    }
    addDenseData(denseMatrix){
        const denseDim0=denseMatrix.length;
        const denseDim1=denseMatrix[0].length;
        for(let i=0;i<denseDim0;++i){
            for(let j=0;j<denseDim1;++j){
                const val=denseMatrix[i][j];
                if(val!==0){
                    this.data.push(val);
                    this.row.push(i);
                    this.col.push(j);
                }
            }
        }
        this.dim0=denseDim0;
        this.dim1=denseDim1;
        this.has_canonical_format=true;
    }
    addCooData(cooData,rowIndices,columnIndices,dim0,dim1){
        this.data=cooData.slice();
        this.row=rowIndices.slice();
        this.col=columnIndices.slice();
        this.dim0=dim0;
        this.dim1=dim1;
    }
    addCooMatrix(cooMatrix){
        this.data=cooMatrix.data.slice();
        this.row=cooMatrix.row.slice();
        this.col=cooMatrix.col.slice();
        this.dim0=cooMatrix.dim0;
        this.dim1=cooMatrix.dim1;
    }
    sum_duplicates(){
        if(this.has_canonical_format){
            return;
        }
        let compressor=new Array(this.dim0*this.dim1).fill(0);
        let visitedRows=[];
        let visitedCols=[];
        let lenData=this.data.length;
        for(let i=0;i<lenData;++i){
            const val=this.data[i];
            if(val!==0){
                const row=this.row[i];
                const col=this.col[i];
                const expanded=row*this.dim1+col;
                compressor[expanded]+=val;
                visitedRows.push(row);
                visitedCols.push(col);
            }
        }
        const lenVisited=visitedRows.length;
        let newDataPoints=[];
        for(let i=0;i<lenVisited;++i){
            const row=visitedRows[i];
            const col=visitedCols[i];
            const expanded=row*this.dim1+col;
            const val=compressor[expanded];
            if(val!==0 && val!==undefined){
                compressor[expanded]=undefined;
                newDataPoints.push(
                    {
                        data:val,
                        row:row,
                        col:col
                    }
                )
            }
        }
        this.sortCoo(newDataPoints);
        this.has_canonical_format=true;
    }
    mult_duplicates(){
        if(this.has_canonical_format){
            return;
        }
        let compressor=new Array(this.dim0*this.dim1).fill(1);
        let visitationCounts=new Array(this.dim0*this.dim1).fill(0);
        let visitedRows=[];
        let visitedCols=[];
        let lenData=this.data.length;
        for(let i=0;i<lenData;++i){
            const val=this.data[i];
            if(val!==0){
                const row=this.row[i];
                const col=this.col[i];
                const expanded=row*this.dim1+col;
                compressor[expanded]*=val;
                visitationCounts[expanded]+=1;
                visitedRows.push(row);
                visitedCols.push(col);
            }
        }
        let newDataPoints=[];
        const lenVisited=visitedRows.length;
        for(let i=0;i<lenVisited;++i){
            const row=visitedRows[i];
            const col=visitedCols[i];
            const expanded=row*this.dim1+col;
            const visitationCount=visitationCounts[expanded];
            if(visitationCount>1){
                const val=compressor[expanded];
                if(val!==0 && val!==undefined){
                    compressor[expanded]=undefined;
                    newDataPoints.push(
                        {
                            data:val,
                            row:row,
                            col:col
                        }
                    )
                }
            }
        }
        this.sortCoo(newDataPoints);
        this.has_canonical_format=true;
    }
    eliminate_zeros(){
        const lenData=this.data.length;
        let dataNew=[];
        let rowNew=[];
        let colNew=[];
        for(let i=0;i<lenData;++i){
            if(this.data[i]!==0){
                dataNew.push(this.data[i]);
                rowNew.push(this.row[i]);
                colNew.push(this.col[i]);
            }
        }
        this.data.length=0;
        this.row.length=0;
        this.col.length=0;
        this.data=dataNew;
        this.row=rowNew;
        this.col=colNew;
    }
    transpose(){
        let transposed=new CooSparseMatrix();
        transposed.addCooData(this.data,this.col,this.row,this.dim1,this.dim0);
        return transposed;
    }
    add(cooMatrix2){
        let dataNew=this.data.concat(cooMatrix2.data);
        let rowNew=this.row.concat(cooMatrix2.row);
        let colNew=this.col.concat(cooMatrix2.col);
        let added=new CooSparseMatrix();
        added.addCooData(dataNew,rowNew,colNew,this.dim0,this.dim1);
        added.sum_duplicates();
        return added;
    }
    multiplyByScalar(scalar){
        let dataNew=this.data.slice();
        let rowNew=this.row.slice();
        let colNew=this.col.slice();
        let mult=new CooSparseMatrix();
        const dataLen=this.data.length;
        for(let i=0;i<dataLen;++i){
            dataNew[i]*=scalar;
        }
        mult.addCooData(dataNew,rowNew,colNew,this.dim0,this.dim1);
        return mult;
    }
    multiplyElementwise(cooMatrix2){
        let dataNew=this.data.concat(cooMatrix2.data);
        let rowNew=this.row.concat(cooMatrix2.row);
        let colNew=this.col.concat(cooMatrix2.col);
        let multiplied=new CooSparseMatrix();
        multiplied.addCooData(dataNew,rowNew,colNew,this.dim0,this.dim1);
        multiplied.mult_duplicates();
        return multiplied;
    }
    sumOverAxis0(){
        let res=new Array(this.dim1).fill(0);
        const lenData=this.data.length;
        for(let i=0;i<lenData;++i){
            const val=this.data[i];
            const col=this.col[i];
            res[col]+=val;
        }
        return res;
    }
    toDense(){
        let result=[];
        for(let i=0;i<this.dim0;++i){
            result.push([]);
            for(let j=0;j<this.dim1;++j){
                result[i].push(0);
            }
        }
        const lenData=this.data.length;
        for(let i=0;i<lenData;++i){
            result[this.row[i]][this.col[i]]=this.data[i];
        }
        return result;
    }
    toCsr(){
        let res = new CsrSparseMatrix();
        res.addCooData(this);
        return res;
    }
    filterByRowCol(validIndices,validIndicesReverse){
        const validIndicesSet=new Set(validIndices);
        // console.log(validIndicesSet,"validIndicesSet")
        const lenData=this.data.length;
        let dataNew=[];
        let rowNew=[];
        let colNew=[];
        // let chosens=[]
        const newDim0=Math.min(this.dim0,validIndicesSet.size);
        const newDim1=Math.min(this.dim1,validIndicesSet.size);
        for(let i=0;i<lenData;++i){
            const row = this.row[i];
            const col = this.col[i];
            if(validIndicesSet.has(row)&&validIndicesSet.has(col)){
                // chosens.push([row,col])
                dataNew.push(this.data[i]);
                rowNew.push(validIndicesReverse.get(row));
                colNew.push(validIndicesReverse.get(col));
            }
        }
        // console.log(chosens,"chosens")
        let res=new CooSparseMatrix();
        res.addCooData(dataNew,rowNew,colNew,newDim0,newDim1);
        return res;
    }
}