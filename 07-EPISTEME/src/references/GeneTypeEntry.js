export class GeneTypeEntry {
    constructor(data){
        this.geneTypeIndex=parseInt(data.geneTypeIndex);
        this.geneType=data.geneType;
        this.geneSupertype=data.geneSupertype;
    }
}