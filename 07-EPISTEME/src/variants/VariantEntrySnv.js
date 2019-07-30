import {getGenomeBrowserLink} from "../Utils";

export class VariantEntrySnv {
    constructor(data,references){
        this.snvIndex=parseInt(data.snvIndex);
        if(data.pos!=="CENSORED"){
            this.startChrIndex=parseInt(data.chrIndex);
            this.endChrIndex=this.startChrIndex;
            this.startPos=parseInt(data.pos);
            this.endPos=this.startPos;
            this.ref=data.ref;
            this.alt=data.alt;
        }else{

        }
        if(data.gene!=="."){
            this.geneIds=[];
            data.gene.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.geneIds.push(geneId);
                }
            });
        }
        this.clonality=1;
        this.eventTypeIndex=parseInt(data.smallVarType);
        this.eventTypeVizIndex=references.variantTypes[this.eventTypeIndex].variantVizTypeIndex;
        this.donorIndex=parseInt(data.donor);
    }
    getIndex(){
        return this.snvIndex;
    }
    setIndex(index){
        this.snvIndex=index;
    }
    clickListener(references,metadata){
        $('#smallVariantDescriptionPaneControl').css("display","inline");
        $("#smallVariantDescription").html(this.annotate(references,metadata));
    }
    annotate(references,metadata){
        let snvReport = `This is a ${this.ref}>${this.alt} ${references.variantTypes[this.eventTypeIndex].variantType} in donor ${metadata.metadata[this.donorIndex].donor}`;
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
        return [
            snvReport,
            geneDirect,
            ""].join('<br />');
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