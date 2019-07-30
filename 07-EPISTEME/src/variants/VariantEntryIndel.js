import {getGenomeBrowserLink} from "../Utils";

export class VariantEntryIndel {
    constructor(data,references){
        this.indelIndex=parseInt(data.indelIndex);
        if(data.pos!=="CENSORED"){
            this.startChrIndex=parseInt(data.chrIndex);
            this.endChrIndex=this.startChrIndex;
            this.startPos=parseInt(data.pos);
            this.endPos=this.startPos;
        }
        this.ref=data.ref;
        this.alt=data.alt;
        if(data.gene!=="."){
            this.geneIds=[];
            data.gene.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.geneIds.push(geneId);
                }
            });
        }
        if(data.hasOwnProperty("tadIndicesOffset0")){
            if(data.tadIndicesOffset0!=="."){
                this.tadIndicesOffset0=[];
                data.tadIndicesOffset0.split(';').forEach((x)=>{
                    this.tadIndicesOffset0.push(parseInt(x));
                });
            }
        }
        if(data.hasOwnProperty("tadIndicesOffset1")){
            if(data.tadIndicesOffset1!=="."){
                this.tadIndicesOffset1=[];
                data.tadIndicesOffset1.split(';').forEach((x)=>{
                    this.tadIndicesOffset1.push(parseInt(x));
                });
            }
        }
        if(data.hasOwnProperty("tadIndicesOffset2")){
            if(data.tadIndicesOffset2!=="."){
                this.tadIndicesOffset2=[];
                data.tadIndicesOffset2.split(';').forEach((x)=>{
                    this.tadIndicesOffset2.push(parseInt(x));
                });
            }
        }
        if(data.hasOwnProperty("tadIndicesOffset3")){
            if(data.tadIndicesOffset3!=="."){
                this.tadIndicesOffset3=[];
                data.tadIndicesOffset3.split(';').forEach((x)=>{
                    this.tadIndicesOffset3.push(parseInt(x));
                });
            }
        }
        this.clonality=1;
        this.eventTypeIndex=parseInt(data.smallVarType);
        this.eventTypeVizIndex=references.variantTypes[this.eventTypeIndex].variantVizTypeIndex;
        this.donorIndex=parseInt(data.donor);
    }
    getIndex(){
        return this.indelIndex;
    }
    setIndex(index){
        this.indelIndex=index;
    }
    annotate(references,metadata){
        let indelReport = `This is a ${this.ref}>${this.alt} ${references.variantTypes[this.eventTypeIndex].variantType} in donor ${metadata.metadata[this.donorIndex].donor}`;
        let posDescription = `${getGenomeBrowserLink(`${this.startChrIndex}:${this.startPos}-${this.endPos}`)}`;
        let geneDirect = `The ${references.variantTypes[this.eventTypeIndex].variantType} at ${posDescription} is intergenic,`;
        if(this.hasOwnProperty("geneIds")){
            if(this.geneIds.length>0){
                geneDirect = `The ${references.variantTypes[this.eventTypeIndex].variantType} at ${posDescription} is on `;
                for (let i = 0; i < this.geneIds.length; ++i) {
                    geneDirect += `${references.genes.get(this.geneIds[i]).getGeneCardsLink()}`;
                    if(i < this.geneIds.length-1){
                        geneDirect += ", ";
                    }
                }
            }
        }
        let tadReportOffset0="";
        let tadReportOffset1="";
        let tadReportOffset2="";
        let tadReportOffset3="";
        let genesCumulative=new Set();

        if(this.hasOwnProperty("tadIndicesOffset0")){
            let genesOffset0=new Set();
            for (let i = 0; i < this.tadIndicesOffset0.length; ++i) {
                for (let j = 0; j < references.tads[this.tadIndicesOffset0[i]].geneIndices.length; ++j) {
                    genesOffset0.add(references.tads[this.tadIndicesOffset0[i]].geneIndices[j]);
                    genesCumulative.add(references.tads[this.tadIndicesOffset0[i]].geneIndices[j]);
                }
            }
            if(this.tadIndicesOffset0.length!==0){
                tadReportOffset0 = `The ${references.variantTypes[this.eventTypeIndex].variantType} directly hits the TAD${this.tadIndicesOffset0.length>1?"s":""}: `;
                for (let i = 0; i < this.tadIndicesOffset0.length; ++i) {
                    tadReportOffset0 += references.tads[this.tadIndicesOffset0[i]].getGenomeBrowserLink();
                    if(i < this.tadIndicesOffset0.length-1){
                        tadReportOffset0 += ", ";
                    }
                }
                tadReportOffset0 += "<br />containing the genes:<br />";
                let genesList = Array.from(genesOffset0).sort();
                for (let i = 0; i < genesList.length; ++i) {
                    tadReportOffset0 += references.genes.get(genesList[i]).getGeneCardsLink();
                    if(i < genesList.length-1){
                        tadReportOffset0 += ", ";
                    }
                }
            }
        }
        if(this.hasOwnProperty("tadIndicesOffset1")){
            let genesOffset1=new Set();
            for (let i = 0; i < this.tadIndicesOffset1.length; ++i) {
                for (let j = 0; j < references.tads[this.tadIndicesOffset1[i]].geneIndices.length; ++j) {
                    if(!genesCumulative.has(references.tads[this.tadIndicesOffset1[i]].geneIndices[j])){
                        genesCumulative.add(references.tads[this.tadIndicesOffset1[i]].geneIndices[j]);
                        genesOffset1.add(references.tads[this.tadIndicesOffset1[i]].geneIndices[j]);
                    }
                }
            }
            if(this.tadIndicesOffset1.length!==0){
                tadReportOffset1 = `The ${references.variantTypes[this.eventTypeIndex].variantType} indirectly hits the TAD${this.tadIndicesOffset1.length>1?"s":""} up to 1 TAD away: `;
                for (let i = 0; i < this.tadIndicesOffset1.length; ++i) {
                    tadReportOffset1 += references.tads[this.tadIndicesOffset1[i]].getGenomeBrowserLink();
                    if(i < this.tadIndicesOffset1.length-1){
                        tadReportOffset1 += ", ";
                    }
                }
                tadReportOffset1 += "<br />containing the genes:<br />";
                let genesList = Array.from(genesOffset1).sort();
                for (let i = 0; i < genesList.length; ++i) {
                    tadReportOffset1 += references.genes.get(genesList[i]).getGeneCardsLink();
                    if(i < genesList.length-1){
                        tadReportOffset1 += ", ";
                    }
                }
            }
        }
        if(this.hasOwnProperty("tadIndicesOffset2")){
            let genesOffset2=new Set();
            for (let i = 0; i < this.tadIndicesOffset2.length; ++i) {
                for (let j = 0; j < references.tads[this.tadIndicesOffset2[i]].geneIndices.length; ++j) {
                    if(!genesCumulative.has(references.tads[this.tadIndicesOffset2[i]].geneIndices[j])){
                        genesCumulative.add(references.tads[this.tadIndicesOffset2[i]].geneIndices[j]);
                        genesOffset2.add(references.tads[this.tadIndicesOffset2[i]].geneIndices[j]);
                    }
                }
            }
            if(this.tadIndicesOffset2.length!==0){
                tadReportOffset2 = `The ${references.variantTypes[this.eventTypeIndex].variantType} indirectly hits the TAD${this.tadIndicesOffset2.length>1?"s":""} up to 2 TADs away: `;
                for (let i = 0; i < this.tadIndicesOffset2.length; ++i) {
                    tadReportOffset2 += references.tads[this.tadIndicesOffset2[i]].getGenomeBrowserLink();
                    if(i < this.tadIndicesOffset2.length-1){
                        tadReportOffset2 += ", ";
                    }
                }
                tadReportOffset2 += "<br />containing the genes:<br />";
                let genesList = Array.from(genesOffset2).sort();
                for (let i = 0; i < genesList.length; ++i) {
                    tadReportOffset2 += references.genes.get(genesList[i]).getGeneCardsLink();
                    if(i < genesList.length-1){
                        tadReportOffset2 += ", ";
                    }
                }
            }
        }
        if(this.hasOwnProperty("tadIndicesOffset3")){
            let genesOffset3=new Set();
            for (let i = 0; i < this.tadIndicesOffset3.length; ++i) {
                for (let j = 0; j < references.tads[this.tadIndicesOffset3[i]].geneIndices.length; ++j) {
                    if(!genesCumulative.has(references.tads[this.tadIndicesOffset3[i]].geneIndices[j])){
                        genesOffset3.add(references.tads[this.tadIndicesOffset3[i]].geneIndices[j]);
                    }
                }
            }
            if(this.tadIndicesOffset3.length!==0){
                tadReportOffset3 = `The ${references.variantTypes[this.eventTypeIndex].variantType} indirectly hits the TAD${this.tadIndicesOffset3.length>1?"s":""} up to 3 TADs away: `;
                for (let i = 0; i < this.tadIndicesOffset3.length; ++i) {
                    tadReportOffset3 += references.tads[this.tadIndicesOffset3[i]].getGenomeBrowserLink();
                    if(i < this.tadIndicesOffset3.length-1){
                        tadReportOffset3 += ", ";
                    }
                }
                tadReportOffset3 += "<br />containing the genes:<br />";
                let genesList = Array.from(genesOffset3).sort();
                for (let i = 0; i < genesList.length; ++i) {
                    tadReportOffset3 += references.genes.get(genesList[i]).getGeneCardsLink();
                    if(i < genesList.length-1){
                        tadReportOffset3 += ", ";
                    }
                }
            }
        }

        return [
            indelReport,
            geneDirect,
            ""].concat([tadReportOffset0,tadReportOffset1,tadReportOffset2,tadReportOffset3]).join('<br />');
    }
    static generalHeaderExport(){
        return [
            "chromosome",
            "pos",
            "REF",
            "ALT",
            "SNV Type",
            "Genes",
            "Donor"
        ];
    }
    textExport(references,metadata){
        let outputChunks=[
            references.chromosomes[this.startChrIndex].chromosomeName,
            this.startPos,
            this.ref,
            this.alt,
            references.variantTypes[this.eventTypeIndex].variantType,
        ];
        if(this.hasOwnProperty("geneIds")){
            let genes=[];
            for(let i=0; i< this.geneIds.length; ++i){
                genes.push(this.geneIds[i].geneName);
            }
            outputChunks.push(genes.join(','));
        }else{
            outputChunks.push("NA");
        }
        outputChunks.push(metadata.metadata[this.donorIndex].donor);
        return outputChunks;
    }
}