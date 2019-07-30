import {getGenomeBrowserLink, searchInPubMed} from "../Utils";

export class CytobandEntry {
    constructor(data){
        this.cytobandIndex=parseInt(data.cytobandIndex);
        this.chromosomeIndex=parseInt(data.chromosomeIndex);
        this.startPos=parseInt(data.startPos);
        this.endPos=parseInt(data.endPos);
        this.cytobandSize=this.endPos-this.startPos;
        this.colourIndex=parseInt(data.colourIndex);
        this.cytobandName=data.cytobandName;
        let foundLetter=false;
        this.rawCytobandName="";
        for(let i=0; i<this.cytobandName.length; ++i){
            if(!foundLetter){
                if(this.cytobandName.charAt(i)==="q"|| this.cytobandName.charAt(i)==="p"){
                    foundLetter=true;
                }
            }
            if(foundLetter){
                this.rawCytobandName+=data.cytobandName.charAt(i);
            }
        }
        if(this.rawCytobandName.length===0){
            this.rawCytobandName=this.cytobandName;
        }
        this.chromosomeArmIndex=parseInt(data.chromosomeArmIndex);
        this.firstTadIndex=parseInt(data.firstTadIndex);
        this.lastTadIndex=parseInt(data.lastTadIndex);
        this.gapSize=parseInt(data.gapSize);
        this.coefficientInit=+data.coefficientInit;
        this.coefficient=this.coefficientInit;
        this.vdjSvDonorContributorIndices=new Set();
        this.svDonorContributorIndices=new Set();
        this.cnvLossDonorContributorIndices = new Set();
        this.cnvGainDonorContributorIndices = new Set();
        this.lohDonorContributorIndices = new Set();
        this.cnnLohDonorContributorIndices = new Set();
        this.cnvLossFocalDonorContributorIndices = new Set();
        this.cnvGainFocalDonorContributorIndices = new Set();
        this.lohFocalDonorContributorIndices = new Set();
        this.cnnLohFocalDonorContributorIndices = new Set();
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
        window.open(`https://www.ncbi.nlm.nih.gov/pubmed?term=${this.cytobandName}`, '_blank');
    }
    getMidAngle(references){
        return references.genomicTheta(this.chromosomeIndex, 0.5*(this.startPos+this.endPos));
    }
    resetCoefficient(){
        this.coefficient=this.coefficientInit;
    }
    getFullSize(){
        return this.cytobandSize*this.coefficient+this.gapSize;
    }
    resetCohortContributions(){
        this.coefficient=this.coefficientInit;
        this.vdjSvDonorContributorIndices.clear();
        this.svDonorContributorIndices.clear();
        this.cnvLossDonorContributorIndices.clear();
        this.cnvGainDonorContributorIndices.clear();
        this.lohDonorContributorIndices.clear();
        this.cnnLohDonorContributorIndices.clear();
        this.cnvLossFocalDonorContributorIndices.clear();
        this.cnvGainFocalDonorContributorIndices.clear();
        this.lohFocalDonorContributorIndices.clear();
        this.cnnLohFocalDonorContributorIndices.clear();
    }
    getIndex(){
        return this.cytobandIndex;
    }
    annotate(references,metadata){
        let cytReport = `The Cytoband ${searchInPubMed(this.cytobandName,metadata.diseaseNameAlternatives)} spans the region `;
        let span = `${references.chromosomes[this.chromosomeIndex].chromosomeName}:${this.startPos}-${this.endPos}`;
        cytReport += `${getGenomeBrowserLink(span)} containing the genes:`;
        cytReport += "<br />";
        let geneIndices=this.getGeneIndices(references);
        for (let i = 0; i < geneIndices.length; ++i) {
            cytReport += references.genes.get(geneIndices[i]).getGeneCardsLink();
            if(i<geneIndices.length-1){
                cytReport += ", ";
            }
        }
        cytReport += "<br />";
        return cytReport;
    }
}