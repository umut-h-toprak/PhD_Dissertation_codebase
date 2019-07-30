export class VolcanoEntry {
    constructor(data,numPossibleComparisonClasses){
        this.volcanoItemIndex=parseInt(data.volcanoItemIndex);
        if(data.hasOwnProperty("gene")){
            this.gene=parseInt(data.gene);
        }else if(data.hasOwnProperty("rppa")){
            this.rppa=parseInt(data.rppa);
        }
        this.x=0;
        this.y=0;
        if(data.hasOwnProperty("pValLog10")){
            this.pValLog10=+data.pValLog10;
        }
        if(data.hasOwnProperty("log2FcTrimean")){
            this.log2FcTrimean=+data.log2FcTrimean;
        }
        if(data.hasOwnProperty("log2FcMean")){
            this.log2FcMean=+data.log2FcMean;
        }
        if(data.hasOwnProperty("pearsonZ")){
            this.pearsonZ=data.pearsonZ;
        }
        if(data.hasOwnProperty("spearmanZ")){
            this.spearmanZ=data.spearmanZ;
        }
        if(data.hasOwnProperty("pearson")){
            this.pearson=data.pearson;
        }
        if(data.hasOwnProperty("spearman")){
            this.spearman=data.spearman;
        }
        if(data.hasOwnProperty("maxExpression")){
            this.maxExpression=data.maxExpression;
        }
        if(data.hasOwnProperty("numSelected")){
            this.numSelected=parseInt(data.numSelected);
        }
        if(data.hasOwnProperty("numInverted")){
            this.numInverted=parseInt(data.numInverted);
        }
        if(data.hasOwnProperty("numSwitched")){
            this.numSwitched=parseInt(data.numSwitched);
        }
        if(numPossibleComparisonClasses>0){
            this.includedComparisons=new Set();
            for(let i=0;i<numPossibleComparisonClasses;++i){
                if(parseInt(data[i.toString()])===1){
                    this.includedComparisons.add(i);
                }
            }
        }
    }
    setX(xField){
        this.x=this[xField];
    }
    setY(yField){
        this.y=this[yField];
    }
    getMag(){
        return Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2));
    }
    getBioIndex(){
        if(this.hasOwnProperty("gene")){
            return this.gene;
        }else{
            return this.rppa;
        }
    }
    getGeneIndices(references){
        if(this.hasOwnProperty("gene")){
            return [this.gene];
        } else if(this.hasOwnProperty("rppa")){
            let tmpList=[];
            references.rppaAntibodies[this.rppa].geneIds.forEach((geneId)=>{
                tmpList.push(geneId);
            });
            return tmpList;
        }
    }
    isPromising(){
        return this.hasOwnProperty("rppa") || Math.abs(this.pValLog10)>0.3 || Math.abs(this.log2FcMean)>0.5|| Math.abs(this.log2FcTrimean)>0.5;
    }
    getComparisonSummary(references){
        let comparisons=[];
        if(this.hasOwnProperty("includedComparisons")){
            this.includedComparisons.forEach((i)=>{
                comparisons.push(references.comparisonTypes[i]);
            });
        }
        return comparisons.join(',');
    }
    getName(references){
        if(this.hasOwnProperty("gene")){
            return references.genes.get(this.gene).geneName;
        }else{
            return references.rppaAntibodies[this.rppa].rppaName;
        }
    }
    getHoverLabel(references){
        let comparisonSummary=this.getComparisonSummary(references);
        if(this.hasOwnProperty("gene")){
            let cytobands=[];
            references.genes.get(this.gene).cytobandIndices.forEach((c)=>{
                cytobands.push(references.cytobands[c].cytobandName);
            });
            return `${references.genes.get(this.gene).geneName}\n(${cytobands.join(',')})\n${comparisonSummary}`;
        }else{
            let geneList=[];
            references.rppaAntibodies[this.rppa].geneIds.forEach((gene)=>{
                geneList.push(references.genes.get(gene).geneName);
            });
            geneList=Array.from(new Set(geneList)).sort();
            return `${references.rppaAntibodies[this.rppa].rppaName}: ${geneList.join(',')}\n${comparisonSummary}`;
        }
    }
    getLabel(references){
        if(this.hasOwnProperty("gene")){
            let cytobands=[];
            references.genes.get(this.gene).cytobandIndices.forEach((c)=>{
                cytobands.push(references.cytobands[c].cytobandName);
            });
            return `${references.genes.get(this.gene).getGeneCardsLinkPlain()} (${cytobands.join(',')})`;
        }else{
            let geneList=[];
            references.rppaAntibodies[this.rppa].geneIds.forEach((gene)=>{
                geneList.push(references.genes.get(gene).getGeneCardsLinkPlain());
            });
            return `${references.rppaAntibodies[this.rppa].rppaName}: ${geneList.join(',')}`;
        }
    }
    static generalHeaderExport(volcanoMode){
        if(volcanoMode==="variant"){
            return [
                "Gene/Rppa",
                "pValLog10",
                "log2FcTrimean",
                "log2FcMean",
                "numSelected",
                "numInverted",
                "numSwitched",
                "includedComparisons",
            ];
        }
        else if(volcanoMode==="subcohort"){
            return [
                "Gene/Rppa",
                "pValLog10",
                "log2FcTrimean",
                "log2FcMean",
            ];
        }
        else if(volcanoMode==="correlation"){
            return [
                "Gene/Rppa",
                "PearsonR",
                "SpearmanR",
            ];
        }

    }
    textExport_variant(references){
        let outputChunks=[];
        if(this.hasOwnProperty("gene")){
            outputChunks.push(references.genes.get(this.gene).geneName);
        }else if(this.hasOwnProperty("rppa")){
            outputChunks.push(references.rppaAntibodies[this.rppa].rppaName);
        }else{
            outputChunks.push("NA");
        }
        outputChunks.push(this.pValLog10);
        outputChunks.push(this.log2FcTrimean);
        outputChunks.push(this.log2FcMean);
        outputChunks.push(this.numSelected);
        outputChunks.push(this.numInverted);
        outputChunks.push(this.numSwitched);
        let comparisonDesc=[];
        this.includedComparisons.forEach((comparison)=>{
            comparisonDesc.push(references.comparisonTypes[comparison]);
        });
        outputChunks.push(comparisonDesc.join(','));
        return outputChunks;
    }
    textExport_subcohort(references){
        let outputChunks=[];
        if(this.hasOwnProperty("gene")){
            outputChunks.push(references.genes.get(this.gene).geneName);
        }else if(this.hasOwnProperty("rppa")){
            outputChunks.push(references.rppaAntibodies[this.rppa].rppaName);
        }else{
            outputChunks.push("NA");
        }
        outputChunks.push(this.pValLog10);
        outputChunks.push(this.log2FcTrimean);
        outputChunks.push(this.log2FcMean);
        return outputChunks;
    }
    textExport_correlation(references){
        let outputChunks=[];
        if(this.hasOwnProperty("gene")){
            outputChunks.push(references.genes.get(this.gene).geneName);
        }else if(this.hasOwnProperty("rppa")){
            outputChunks.push(references.rppaAntibodies[this.rppa].rppaName);
        }else{
            outputChunks.push("NA");
        }
        outputChunks.push(this.pearsonR);
        outputChunks.push(this.spearmanR);
        return outputChunks;
    }
}