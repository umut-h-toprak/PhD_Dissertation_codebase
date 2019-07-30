import {StatsTests} from "../statsTests/StatsTests";

export class VolcanoMutexEntry {
    constructor(identifier,donorIndicesPre,donorIndices,subcohort1DonorIndices,subcohort2DonorIndices,mutexEntryType,mutexEntrySecondaryType){
        this.volcanoItemIndex=0;
        this.identifier=identifier;
        //0:chromosomeArm,1:cytoband,2:tad,3:gene
        this.mutexEntryType=mutexEntryType;
        //0:_ 1:cnvGain,2:cnvLoss,3:LOH,4:cnnLOH,5:cnvLossOrLOH,6:SV
        this.mutexEntrySecondaryType=mutexEntrySecondaryType;
        this.x=0;
        this.y=0;
        const [contingencyTable,total,isValid, isInverse]=VolcanoMutexEntry.generateContingencyTable(donorIndices,subcohort1DonorIndices,subcohort2DonorIndices);
        if(isValid){
            this.quant=1/total;
            this.subcohort1MutRatio=contingencyTable[0][0]/total;
            this.subcohort1WtRatio=contingencyTable[1][0]/total;
            this.subcohort2MutRatio=contingencyTable[1][0]/total;
            this.subcohort2WtRatio=contingencyTable[1][1]/total;
            this.subcohort1Mut=contingencyTable[0][0];
            this.subcohort1Wt=contingencyTable[0][1];
            this.subcohort2Mut=contingencyTable[1][0];
            this.subcohort2Wt=contingencyTable[1][1];
            this.totalMut=donorIndices.size;
            if(isInverse){
                [contingencyTable[0], contingencyTable[1]] = [contingencyTable[1], contingencyTable[0]];
            }
            this.pValLog10=-Math.log10(StatsTests.fisherExactNonCentered(contingencyTable,1));
        }else{
            this.pValLog10=-1;
        }
    }
    generateVennSets(references,subcohort1Name,subcohort2Name,commonCases){
        let mutName=this.getName(references);
        return [
            {sets: [subcohort1Name],
                size: this.subcohort1Mut+this.subcohort1Wt,
                label:`${subcohort1Name}\n(${this.subcohort1Wt})`},
            {sets: [subcohort2Name],
                size: this.subcohort2Mut+this.subcohort2Wt,
                label:`${subcohort2Name}\n(${this.subcohort2Wt})`},
            {sets: [subcohort1Name,subcohort2Name], size: commonCases.size,label:`${commonCases.size}`},
            {sets: [mutName], size: this.totalMut},
            {sets: [mutName,subcohort1Name], size: this.subcohort1Mut, label:`${this.subcohort1Mut}`},
            {sets: [mutName,subcohort2Name], size: this.subcohort2Mut, label:`${this.subcohort2Mut}`},
            ];
    }
    static getSecondaryDescription(index){
        //0:_ 1:cnvGain,2:cnvLoss,3:LOH,4:cnnLOH,5:cnvLossOrLOH,6:SV
        return ["","Gain","Loss","LOH","cnLOH","LossOrLOH","SV"][index];
    }
    addNoise(){
        return Math.random()*this.quant*0.8-this.quant*0.4;
    }
    static generateContingencyTable(donorIndices,subcohort1DonorIndices,subcohort2DonorIndices){
        let contingencyTable=[
            [0,0],
            [0,0]
        ];
        let total=0;
        subcohort1DonorIndices.forEach((donorIndex)=>{
            if(donorIndices.has(donorIndex)){
                contingencyTable[0][0]+=1;
            }else{
                contingencyTable[0][1]+=1;
            }
            total+=1;
        });
        subcohort2DonorIndices.forEach((donorIndex)=>{
            if(donorIndices.has(donorIndex)){
                contingencyTable[1][0]+=1;
            }else{
                contingencyTable[1][1]+=1;
            }
            total+=1;
        });
        const isValid=contingencyTable[0][0]+contingencyTable[0][1]>0 &&
            contingencyTable[1][0]+contingencyTable[1][1]>0 &&
            contingencyTable[0][1]+contingencyTable[1][1]>0 &&
            contingencyTable[0][0]+contingencyTable[1][0]>0;
        const isInverseTable=contingencyTable[0][0]<contingencyTable[1][0];
        return [contingencyTable,total,isValid,isInverseTable];
    }
    setX(){
        if(this.subcohort1MutRatio>=this.subcohort2MutRatio){
            this.x=this.subcohort1MutRatio+this.addNoise();
        }else{
            this.x=-(this.subcohort2MutRatio+this.addNoise());
        }
    }
    setY(yField){
        this.y=this.pValLog10;
    }
    // getMag(){
    //     return Math.sqrt(Math.pow(this.x,2)+Math.pow(this.y,2));
    // }
    getGeneIndices(references){
        if(this.mutexEntryType===3){
            return [this.identifier];
        }else{
            return [];
        }
    }
    getName(references){
        switch(this.mutexEntryType) {
            case 3:
                return references.genes.get(this.identifier).geneName;
            case 2:
                return `${references.tads[this.identifier].printTadRange(references)} ${VolcanoMutexEntry.getSecondaryDescription(this.mutexEntrySecondaryType)}`;
            case 1:
                return `${references.cytobands[this.identifier].cytobandName} ${VolcanoMutexEntry.getSecondaryDescription(this.mutexEntrySecondaryType)}`;
            case 0:
                return `${references.chromosomeArms[this.identifier].chromosomeArmName} ${VolcanoMutexEntry.getSecondaryDescription(this.mutexEntrySecondaryType)}`;
            default:
                return "";
        }
    }
    getHoverLabel(references){
        switch(this.mutexEntryType) {
            case 3:
                let cytobands=[];
                references.genes.get(this.identifier).cytobandIndices.forEach((c)=>{
                    cytobands.push(references.cytobands[c].cytobandName);
                });
                return `${references.genes.get(this.identifier).geneName}\n(${cytobands.join(',')})`;
            case 2:
                return `${references.tads[this.identifier].printTadRange(references)} (${references.tads[this.identifier].printCytobandHits(references)}) ${VolcanoMutexEntry.getSecondaryDescription(this.mutexEntrySecondaryType)}`;
            case 1:
                return `${references.cytobands[this.identifier].cytobandName} ${VolcanoMutexEntry.getSecondaryDescription(this.mutexEntrySecondaryType)}`;
            case 0:
                return `${references.chromosomeArms[this.identifier].chromosomeArmName} ${VolcanoMutexEntry.getSecondaryDescription(this.mutexEntrySecondaryType)}`;
            default:
                return "";
        }
    }
    getLabel(references){
        switch(this.mutexEntryType) {
            case 3:
                let cytobands=[];
                references.genes.get(this.identifier).cytobandIndices.forEach((c)=>{
                    cytobands.push(references.cytobands[c].cytobandName);
                });
                return `${references.genes.get(this.identifier).getGeneCardsLinkPlain()} (${cytobands.join(',')})`;
            case 2:
                return `${references.tads[this.identifier].printTadRange(references)} (${references.tads[this.identifier].printCytobandHits(references)}) ${VolcanoMutexEntry.getSecondaryDescription(this.mutexEntrySecondaryType)}`;
            case 1:
                return `${references.cytobands[this.identifier].cytobandName} ${VolcanoMutexEntry.getSecondaryDescription(this.mutexEntrySecondaryType)}`;
            case 0:
                return `${references.chromosomeArms[this.identifier].chromosomeArmName} ${VolcanoMutexEntry.getSecondaryDescription(this.mutexEntrySecondaryType)}`;
            default:
                return "";
        }
    }
    static generalHeaderExport(){
        return [
            "Item",
            "pValLog10",
            "subcohort1MutRatio",
            "subcohort1WtRatio",
            "subcohort2MutRatio",
            "subcohort2WtRatio",
            "subcohort1Mut",
            "subcohort1Wt",
            "subcohort2Mut",
            "subcohort2Wt",
        ];
    }
    textExport(references){
        let outputChunks=[];
        outputChunks.push(this.getName(references));
        outputChunks.push(this.pValLog10);
        outputChunks.push(this.subcohort1MutRatio);
        outputChunks.push(this.subcohort1WtRatio);
        outputChunks.push(this.subcohort2MutRatio);
        outputChunks.push(this.subcohort2WtRatio);
        outputChunks.push(this.subcohort1Mut);
        outputChunks.push(this.subcohort1Wt);
        outputChunks.push(this.subcohort2Mut);
        outputChunks.push(this.subcohort2Wt);
        return outputChunks;
    }
    static createVolcanoMutexEntryChromosomeArm(identifier,donorIndicesPre,donorIndices,subcohort1DonorIndices,subcohort2DonorIndices,mutexEntrySecondaryType){
        return new VolcanoMutexEntry(identifier,donorIndicesPre,donorIndices,subcohort1DonorIndices,subcohort2DonorIndices,0,mutexEntrySecondaryType);
    }
    static createVolcanoMutexEntryCytoband(identifier,donorIndicesPre,donorIndices,subcohort1DonorIndices,subcohort2DonorIndices,mutexEntrySecondaryType){
        return new VolcanoMutexEntry(identifier,donorIndicesPre,donorIndices,subcohort1DonorIndices,subcohort2DonorIndices,1,mutexEntrySecondaryType);
    }
    static createVolcanoMutexEntryTad(identifier,donorIndicesPre,donorIndices,subcohort1DonorIndices,subcohort2DonorIndices,mutexEntrySecondaryType){
        return new VolcanoMutexEntry(identifier,donorIndicesPre,donorIndices,subcohort1DonorIndices,subcohort2DonorIndices,2,mutexEntrySecondaryType);
    }
    static createVolcanoMutexEntryGene(identifier,donorIndicesPre,donorIndices,subcohort1DonorIndices,subcohort2DonorIndices){
        return new VolcanoMutexEntry(identifier,donorIndicesPre,donorIndices,subcohort1DonorIndices,subcohort2DonorIndices,3,-1);
    }
}