export class ChromosomeArmEntry {
    constructor(data){
        this.chromosomeArmIndex=parseInt(data.chromosomeArmIndex);
        this.chromosomeIndex=parseInt(data.chromosomeIndex);
        this.startPos=parseInt(data.startPos);
        this.endPos=parseInt(data.endPos);
        this.chromosomeArmSize=this.endPos-this.startPos;
        this.chromosomeArmName=data.chromosomeArmName;
        this.firstTadIndex=parseInt(data.firstTadIndex);
        this.lastTadIndex=parseInt(data.lastTadIndex);
        this.firstCytobandIndex=parseInt(data.firstCytobandIndex);
        this.lastCytobandIndex=parseInt(data.lastCytobandIndex);
        this.coefficientInit=+data.coefficientInit;
        this.coefficient=this.coefficientInit;
        this.cnvLossDonorContributorIndices=new Set([]);
        this.cnvGainDonorContributorIndices=new Set([]);
        this.lohDonorContributorIndices=new Set([]);
        this.cnnLohDonorContributorIndices=new Set([]);
    }
    assessChromosomeArmLevelCnvEffects(references){
        let fakeLength=0;
        let tmp_cnvLossDonorContributorIndices=new Map([]);
        let tmp_cnvGainDonorContributorIndices=new Map([]);
        let tmp_lohDonorContributorIndices=new Map([]);
        let tmp_cnnLohDonorContributorIndices=new Map([]);
        for(let i=this.firstTadIndex;i<=this.lastTadIndex;++i){
            let tad = references.tads[i];
            fakeLength+=tad.endPos-tad.startPos;
            tad.cnvLossDonorContributorIndices.forEach((donorIndex)=>{
                if(!tmp_cnvLossDonorContributorIndices.has(donorIndex)){
                    tmp_cnvLossDonorContributorIndices.set(donorIndex,new Set());
                }
                tmp_cnvLossDonorContributorIndices.get(donorIndex).add(tad.tadIndex);
            });
            tad.cnvGainDonorContributorIndices.forEach((donorIndex)=>{
                if(!tmp_cnvGainDonorContributorIndices.has(donorIndex)){
                    tmp_cnvGainDonorContributorIndices.set(donorIndex,new Set());
                }
                tmp_cnvGainDonorContributorIndices.get(donorIndex).add(tad.tadIndex);
            });
            tad.lohDonorContributorIndices.forEach((donorIndex)=>{
                if(!tmp_lohDonorContributorIndices.has(donorIndex)){
                    tmp_lohDonorContributorIndices.set(donorIndex,new Set());
                }
                tmp_lohDonorContributorIndices.get(donorIndex).add(tad.tadIndex);
            });
            tad.cnnLohDonorContributorIndices.forEach((donorIndex)=>{
                if(!tmp_cnnLohDonorContributorIndices.has(donorIndex)){
                    tmp_cnnLohDonorContributorIndices.set(donorIndex,new Set());
                }
                tmp_cnnLohDonorContributorIndices.get(donorIndex).add(tad.tadIndex);
            });
        }
        tmp_cnvLossDonorContributorIndices.forEach((tadIndices, donorIndex, map)=> {
            let totalTadlength=0;
            tadIndices.forEach(tadIndex=>{
                totalTadlength+=references.tads[tadIndex].endPos-references.tads[tadIndex].startPos;
            });
            if(totalTadlength/fakeLength>0.33){
                this.cnvLossDonorContributorIndices.add(donorIndex);
            }
        });
        tmp_cnvGainDonorContributorIndices.forEach((tadIndices, donorIndex, map)=> {
            let totalTadlength=0;
            tadIndices.forEach(tadIndex=>{
                totalTadlength+=references.tads[tadIndex].endPos-references.tads[tadIndex].startPos;
            });
            if(totalTadlength/fakeLength>0.33){
                this.cnvGainDonorContributorIndices.add(donorIndex);
            }
        });
        tmp_lohDonorContributorIndices.forEach((tadIndices, donorIndex, map)=> {
            let totalTadlength=0;
            tadIndices.forEach(tadIndex=>{
                totalTadlength+=references.tads[tadIndex].endPos-references.tads[tadIndex].startPos;
            });
            if(totalTadlength/fakeLength>0.33){
                this.lohDonorContributorIndices.add(donorIndex);
            }
        });
        tmp_cnnLohDonorContributorIndices.forEach((tadIndices, donorIndex, map)=> {
            let totalTadlength=0;
            tadIndices.forEach(tadIndex=>{
                totalTadlength+=references.tads[tadIndex].endPos-references.tads[tadIndex].startPos;
            });
            if(totalTadlength/fakeLength>0.33){
                this.cnnLohDonorContributorIndices.add(donorIndex);
            }
        });
    }
    getGeneIndices(references){
        let tmpGenes=new Set();
        for(let i=this.firstTadIndex;i<=this.lastTadIndex;++i){
            references.tads[i].geneIndices.forEach((g)=>{
                tmpGenes.add(g);
            });
        }
        return Array.from(tmpGenes);
    }
    launchDefaultDb(){
        window.open(`https://www.ncbi.nlm.nih.gov/pubmed?term=Chr${this.chromosomeArmName}`, '_blank');
    }
    getMidAngle(references){
        return references.genomicTheta(this.chromosomeIndex, 0.5*(this.startPos+this.endPos));
    }
    resetCoefficient(){
        this.coefficient=this.coefficientInit;
    }
    resetCohortContributions(){
        this.coefficient=this.coefficientInit;
        this.cnvLossDonorContributorIndices.clear();
        this.cnvGainDonorContributorIndices.clear();
        this.lohDonorContributorIndices.clear();
        this.cnnLohDonorContributorIndices.clear();
    }
    getIndex(){
        return this.chromosomeArmIndex;
    }
}