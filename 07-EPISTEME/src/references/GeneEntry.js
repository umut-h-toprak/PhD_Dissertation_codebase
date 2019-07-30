import {getGenomeBrowserLink, padENSG, searchInPubMed} from "../Utils";

export class GeneEntry {
    constructor(data){
        this.geneId=parseInt(data.geneId);
        this.chromosomeIndex=parseInt(data.chromosomeIndex);
        this.startPos=parseInt(data.startPos);
        this.endPos=parseInt(data.endPos);
        this.geneTypeIndex=parseInt(data.geneTypeIndex);
        this.cytobandIndices=[];
        data.cytobandIndices.split(';').forEach((cytobandIndex)=>{
            this.cytobandIndices.push(parseInt(cytobandIndex));
        });
        this.tadIndices=[];
        data.tadIndices.split(';').forEach((tadIndex)=>{
            this.tadIndices.push(parseInt(tadIndex));
        });
        this.rppaIds=[];
        if(data.rppaIds!=="."){
            data.rppaIds.split(';').forEach((rppaId)=>{
                this.rppaIds.push(parseInt(rppaId));
            });
        }
        this.geneName=data.geneName;
        this.cancerGene=parseInt(data.cancerGene)===1;
        this.batch=parseInt(data.batch);
        this.reactomePathwayIds=[];
        if(data.reactomePathwayIds !=="."){
            data.reactomePathwayIds.split(';').forEach((reactomePathwayId)=>{
                this.reactomePathwayIds.push(parseInt(reactomePathwayId));
            });
        }
        if(data.hasOwnProperty("expressions")){
            this.expressions=data.expressions;
        }
        if(data.hasOwnProperty("singleDonorVariantContributions")){
            this.singleDonorVariantContributions=data.singleDonorVariantContributions;
        }
        this.currentDonorContributions=new Map();
        this.currentVolcanoContributions=new Map();
    }
    getMidAngle(references){
        return references.genomicTheta(this.chromosomeIndex, 0.5*(this.startPos+this.endPos));
    }
    checkVdjTargetValidity(){
        if(this.geneName.startsWith("IGH")||this.geneName.startsWith("IGK")||this.geneName.startsWith("IGL")){
            if(this.geneName.includes("OR")){
                return false;
            }
        }
        return true;
    }
    isSecondClassVdjTarget(){
        return this.geneName.startsWith("RP11") || this.geneName.startsWith("RP5")|| this.geneName.startsWith("AC0")|| this.geneName.startsWith("LOC");
    }
    addCurrentDonorContributions(x){
        this.currentDonorContributions=x;
    }
    getGeneCardsLink(){
        if(this.geneId===-1){
            return `<a>${this.geneName}</a>`;
        }
        if(!this.cancerGene){
            return `<a href="https://www.genecards.org/cgi-bin/carddisp.pl?gene=${padENSG(this.geneId)}#aliases_descriptions" target="_blank">${this.geneName}</a>`;
        }else{
            return `<a href="https://www.genecards.org/cgi-bin/carddisp.pl?gene=${padENSG(this.geneId)}#aliases_descriptions" target="_blank"><font color="red">${this.geneName}</font></a>`;
        }
    }
    getGeneCardsLinkPlain(){
        if(this.geneId===-1){
            return `<a>${this.geneName}</a>`;
        }
        return `
            <a href="https://www.genecards.org/cgi-bin/carddisp.pl?gene=${padENSG(this.geneId)}#aliases_descriptions" target="_blank">
                ${this.geneName}
            </a>`;
    }

    launchDefaultDb(){
        window.open(`https://www.genecards.org/cgi-bin/carddisp.pl?gene=${padENSG(this.geneId)}#aliases_descriptions`, '_blank');
    }
    annotateDonorContributions(metadata,references,contributions,currentGeneMutTypes,currentDonorIndices){
        let displayedContributions=new Map();
        let hiddenContributions=new Map();
        let displayedDistinctDonors=new Set();
        contributions.forEach((variants,variantType,)=>{
            if(currentGeneMutTypes.has(variantType)){
                let variantsValid=[];
                let variantsInvalid=[];
                for(let i=0;i<variants.length;++i){
                    if(currentDonorIndices.has(variants[i])){
                        variantsValid.push(variants[i]);
                        displayedDistinctDonors.add(variants[i]);
                    }else{
                        variantsInvalid.push(variants[i]);
                    }
                }
                if(variantsValid.length>0){
                    displayedContributions.set(variantType,variantsValid);
                }
                if(variantsInvalid.length>0){
                    hiddenContributions.set(variantType,variantsInvalid);
                }
            }else{
                hiddenContributions.set(variantType,variants);
            }
        });
        let cytobandHits="";
        for (let i = 0; i < this.cytobandIndices.length; ++i) {
            cytobandHits+=searchInPubMed(references.cytobands[this.cytobandIndices[i]].cytobandName,metadata.diseaseNameAlternatives);
            if(i<this.cytobandIndices.length-1){
                cytobandHits += " and ";
            }
        }
        let geneRecReport = `${this.getGeneCardsLink()} on ${cytobandHits} spans the region `;
        let span = `${references.chromosomes[this.chromosomeIndex].chromosomeName}:${this.startPos}-${this.endPos}`;
        geneRecReport+= `${getGenomeBrowserLink(span)} (${((this.endPos-this.startPos)/1e6).toFixed(1)} Mb)`;
        geneRecReport+= "<br />";
        geneRecReport+= "and overlaps with the TADs ";
        for (let i = 0; i < this.tadIndices.length; ++i) {
            geneRecReport += references.tads[this.tadIndices[i]].getGenomeBrowserLink();
            if(i < this.tadIndices.length-1){
                geneRecReport += ", ";
            }
        }
        geneRecReport += "<br />";
        geneRecReport += "The following variant classes and donors are displayed on the clicked recurrence layer:";
        geneRecReport += "<br />";
        displayedContributions.forEach((variants,variantType,)=>{
            geneRecReport += `${references.variantTypes[variantType].variantType} in ${variants.length} donor${variants.length>1? "s":""} : `;
            for (let i = 0; i < variants.length; ++i) {
                geneRecReport += metadata.metadata[variants[i]].donor;
                if(i < variants.length-1){
                    geneRecReport += ", ";
                }
            }
            geneRecReport += "<br />";
        });
        geneRecReport += "<br />";
        geneRecReport += "The following variant classes and donors have been observed in the cohort but are not displayed on the clicked recurrence layer:";
        geneRecReport += "<br />";
        hiddenContributions.forEach((variants,variantType,)=>{
            geneRecReport += `${references.variantTypes[variantType].variantType} in ${variants.length} donor${variants.length>1? "s":""}: `;
            for (let i = 0; i < variants.length; ++i) {
                geneRecReport += metadata.metadata[variants[i]].donor;
                if(i < variants.length-1){
                    geneRecReport += ", ";
                }
            }
            geneRecReport += "<br />";
        });
        return [geneRecReport,displayedDistinctDonors];
    }
    searchInPubMed(diseaseNameAlternatives){
        window.open(`https://www.ncbi.nlm.nih.gov/pubmed?term=("${diseaseNameAlternatives.join('"%20OR%20"')}")%20AND%20${this.geneName}`, '_blank');
    }
    getIndex(){
        return this.geneId;
    }
    resetCohortContributions(){
        this.currentVolcanoContributions=new Map();
    }

    static generalHeaderExport(references,expectedTypes){
        let outputChunks=[
            "Gene Chromosome",
            "Gene Start",
            "Gene End",
            "Gene Name",
            "Gene Type",
            "Total Recurrence"
        ];
        for(let i=0;i<expectedTypes.length;++i){
            outputChunks.push(references.variantTypes[expectedTypes[i]].variantType+" Donors");
        }
        return outputChunks;
    }
    textExport(references,metadata,expectedTypes){
        let outputChunks=[
            references.chromosomes[this.chromosomeIndex].chromosomeName,
            this.startPos,
            this.endPos,
            this.geneName,
            references.geneTypes[this.geneTypeIndex].geneType,
        ];
        let outputChunks2=[

        ];
        let recurrence=0;
        for(let i=0;i<expectedTypes.length;++i){
            if(this.currentDonorContributions.has(expectedTypes[i])){
                let currentDonorIndices=this.currentDonorContributions.get(expectedTypes[i]);
                recurrence+=currentDonorIndices.length;
                let currentDonors=[];
                for(let j=0;j<currentDonorIndices.length;++j){
                    currentDonors.push(metadata.metadata[currentDonorIndices[j]].donor);
                }
                if(currentDonors.length>0){
                    outputChunks2.push(currentDonors.join(','));
                }else{
                    outputChunks2.push("");
                }
            }else{
                outputChunks2.push("");
            }
        }
        if(recurrence>0){
            outputChunks.push(recurrence);
            return outputChunks.concat(outputChunks2);
        }else{
            return[];
        }
    }
}