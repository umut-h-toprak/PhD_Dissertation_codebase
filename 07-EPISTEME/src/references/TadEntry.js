import {getGenomeBrowserLink, searchInPubMed} from "../Utils";

export class TadEntry {
    constructor(data){
        this.tadIndex=parseInt(data.tadIndex);
        this.chromosomeIndex=parseInt(data.chromosomeIndex);
        this.startPos=parseInt(data.startPos);
        this.endPos=parseInt(data.endPos);
        this.cytobandIndices=[];
        data.cytobandIndices.split(';').forEach((cytobandIndex)=>{
            this.cytobandIndices.push(parseInt(cytobandIndex));
        });
        this.geneIndices=[];
        if(data.geneIndices!=="-1"&&data.geneIndices!=="0"){
            data.geneIndices.split(';').forEach((geneIndex)=>{
                this.geneIndices.push(parseInt(geneIndex));
            });
        }
        this.offset0SvIndices=[];
        this.offset1SvIndices=[];
        this.offset2SvIndices=[];
        this.offset3SvIndices=[];
        this.offset0VdjSvIndices=[];
        this.offset1VdjSvIndices=[];
        this.offset2VdjSvIndices=[];
        this.offset3VdjSvIndices=[];
        this.offset0MidSvIndices=[];
        this.offset1MidSvIndices=[];
        this.offset2MidSvIndices=[];
        this.offset3MidSvIndices=[];
        this.offset0IndelIndices=[];
        this.offset1IndelIndices=[];
        this.offset2IndelIndices=[];
        this.offset3IndelIndices=[];
        this.svDonorContributorIndicesOffset0=new Set([]);
        this.svDonorContributorIndicesOffset1=new Set([]);
        this.svDonorContributorIndicesOffset2=new Set([]);
        this.svDonorContributorIndicesOffset3=new Set([]);
        this.indelDonorContributorIndicesOffset0=new Set([]);
        this.indelDonorContributorIndicesOffset1=new Set([]);
        this.indelDonorContributorIndicesOffset2=new Set([]);
        this.indelDonorContributorIndicesOffset3=new Set([]);

        this.cnvLossDonorContributorIndices=new Set([]);
        this.cnvGainDonorContributorIndices=new Set([]);
        this.lohDonorContributorIndices=new Set([]);
        this.cnnLohDonorContributorIndices=new Set([]);

        this.cnvLossFocalDonorContributorIndices=new Set([]);
        this.cnvGainFocalDonorContributorIndices=new Set([]);
        this.lohFocalDonorContributorIndices=new Set([]);
        this.cnnLohFocalDonorContributorIndices=new Set([]);
    }
    resetCohortContributions(){
        this.offset0SvIndices.length=0;
        this.offset1SvIndices.length=0;
        this.offset2SvIndices.length=0;
        this.offset3SvIndices.length=0;
        this.offset0MidSvIndices.length=0;
        this.offset1MidSvIndices.length=0;
        this.offset2MidSvIndices.length=0;
        this.offset3MidSvIndices.length=0;
        this.offset0IndelIndices.length=0;
        this.offset1IndelIndices.length=0;
        this.offset2IndelIndices.length=0;
        this.offset3IndelIndices.length=0;
        this.svDonorContributorIndicesOffset0.clear();
        this.svDonorContributorIndicesOffset1.clear();
        this.svDonorContributorIndicesOffset2.clear();
        this.svDonorContributorIndicesOffset3.clear();
        this.indelDonorContributorIndicesOffset0.clear();
        this.indelDonorContributorIndicesOffset1.clear();
        this.indelDonorContributorIndicesOffset2.clear();
        this.indelDonorContributorIndicesOffset3.clear();
        this.cnvLossDonorContributorIndices.clear();
        this.cnvGainDonorContributorIndices.clear();
        this.lohDonorContributorIndices.clear();
        this.cnnLohDonorContributorIndices.clear();
        this.cnvLossFocalDonorContributorIndices.clear();
        this.cnvGainFocalDonorContributorIndices.clear();
        this.lohFocalDonorContributorIndices.clear();
        this.cnnLohFocalDonorContributorIndices.clear();
    }
    printTadRange(references){
        return `${references.chromosomes[this.chromosomeIndex].chromosomeName}:${this.startPos}-${this.endPos}`;
    }
    printCytobandHits(references){
        let cytobandNames=[];
        for (let i = 0; i < this.cytobandIndices.length; ++i) {
            cytobandNames.push(references.cytobands[this.cytobandIndices[i]].cytobandName);
        }
        return cytobandNames.join(',');
    }
    annotate(metadata,references,currentDonorIndices,tadVariantClasses){
        let cytobandHits="";
        for (let i = 0; i < this.cytobandIndices.length; ++i) {
            cytobandHits+=searchInPubMed(references.cytobands[this.cytobandIndices[i]].cytobandName,metadata.diseaseNameAlternatives);
            if(i<this.cytobandIndices.length-1){
                cytobandHits += " and ";
            }
        }
        let displayedDistinctDonors=new Set();
        let hiddenDistinctDonors=new Set();
        tadVariantClasses.forEach((tadVariantClass)=>{
            let donorIndices=this[tadVariantClass];
            donorIndices.forEach((donorIndex)=>{
                if(currentDonorIndices.has(donorIndex)){
                    displayedDistinctDonors.add(donorIndex);
                    hiddenDistinctDonors.delete(donorIndex);
                }else{
                    if(!displayedDistinctDonors.has(donorIndex)){
                        hiddenDistinctDonors.add(donorIndex);
                    }
                }
            });
        });
        let tadReport = `TAD #${this.tadIndex} on ${cytobandHits} spans the region `;
        let span = this.printTadRange(references);
        tadReport += `${getGenomeBrowserLink(span)} containing the genes:`;
        tadReport += "<br />";
        for (let i = 0; i < this.geneIndices.length; ++i) {
            tadReport += references.genes.get(this.geneIndices[i]).getGeneCardsLink();
            if(i<this.geneIndices.length-1){
                tadReport += ", ";
            }
        }
        tadReport += "<br />";
        let sv0Donors = [...this.svDonorContributorIndicesOffset0].filter(x => displayedDistinctDonors.has(x));
        let sv1Donors = [...this.svDonorContributorIndicesOffset1].filter(x => displayedDistinctDonors.has(x));
        let sv2Donors = [...this.svDonorContributorIndicesOffset2].filter(x => displayedDistinctDonors.has(x));
        let sv3Donors = [...this.svDonorContributorIndicesOffset3].filter(x => displayedDistinctDonors.has(x));
        if(sv0Donors.length > 0||sv1Donors.length > 0||sv2Donors.length > 0||sv3Donors.length > 0){
            tadReport += "The following donors in this cohort have SVs that affect this TAD:";
            tadReport += "<br />";
        }if(sv0Donors.length > 0){
            tadReport +=`Direct TAD Hits (${sv0Donors.length}):`;
            for (let i = 0; i < sv0Donors.length; ++i) {
                tadReport += metadata.metadata[sv0Donors[i]].donor;
                if(i < sv0Donors.length-1){
                    tadReport += ", ";
                }
            }
            tadReport += "<br />";
        }if(sv1Donors.length > 0){
            tadReport +=`1-TAD offset (${sv1Donors.length}):`;
            for (let i = 0; i < sv1Donors.length; ++i) {
                tadReport += metadata.metadata[sv1Donors[i]].donor;
                if(i < sv1Donors.length-1){
                    tadReport += ", ";
                }
            }
            tadReport += "<br />";
        }if(sv2Donors.length > 0){
            tadReport +=`2-TAD offset (${sv2Donors.length}):`;
            for (let i = 0; i < sv2Donors.length; ++i) {
                tadReport += metadata.metadata[sv2Donors[i]].donor;
                if(i < sv2Donors.length-1){
                    tadReport += ", ";
                }
            }
            tadReport += "<br />";
        }if(sv3Donors.length > 0){
            tadReport +=`3-TAD offset (${sv3Donors.length}):`;
            for (let i = 0; i < sv3Donors.length; ++i) {
                tadReport += metadata.metadata[sv3Donors[i]].donor;
                if(i < sv3Donors.length-1){
                    tadReport += ", ";
                }
            }
            tadReport += "<br />";
        }

        let lossDonors = [...this.cnvLossDonorContributorIndices].filter(x => displayedDistinctDonors.has(x));
        if(lossDonors.length > 0){
            tadReport += `The following ${lossDonors.length} donor${lossDonors.length>1? "s":""} in this cohort ${lossDonors.length>1? "have":"has"} loss CNVs affecting this TAD:`;
            tadReport += "<br />";
            for (let i = 0; i < lossDonors.length; ++i) {
                tadReport += metadata.metadata[lossDonors[i]].donor;
                if(i < lossDonors.length-1){
                    tadReport += ", ";
                }
            }
            tadReport += "<br />";
        }
        let gainDonors = [...this.cnvGainDonorContributorIndices].filter(x => displayedDistinctDonors.has(x));
        if(gainDonors.length > 0){
            tadReport += `The following ${gainDonors.length} donor${gainDonors.length>1? "s":""} in this cohort ${gainDonors.length>1? "have":"has"} gain CNVs affecting this TAD:`;
            tadReport += "<br />";
            for (let i = 0; i < gainDonors.length; ++i) {
                tadReport += metadata.metadata[gainDonors[i]].donor;
                if(i < gainDonors.length-1){
                    tadReport += ", ";
                }
            }
            tadReport += "<br />";
        }
        let lohDonors = [...this.lohDonorContributorIndices].filter(x => displayedDistinctDonors.has(x));
        if(lohDonors.length > 0){
            tadReport += `The following ${lohDonors.length} donor${lohDonors.length>1? "s":""} in this cohort ${lohDonors.length>1? "have":"has"} LOH on this TAD:`;
            tadReport += "<br />";
            for (let i = 0; i < lohDonors.length; ++i) {
                tadReport += metadata.metadata[lohDonors[i]].donor;
                if(i < lohDonors.length-1){
                    tadReport += ", ";
                }
            }
        }
        return [tadReport,displayedDistinctDonors];
    }
    getGenomeBrowserLink(){
        return `<a href="https://genome.ucsc.edu/cgi-bin/hgTracks?org=human&db=hg19&position=chr${this.chromosomeIndex}:${this.startPos}-${this.endPos}" target="_blank">${this.tadIndex}</a>`;
    }
    getIndex(){
        return this.tadIndex;
    }


    static generalHeaderExportCnv(){
        return [
            "TAD Chromosome",
            "TAD Start",
            "TAD End",
            "Cytobands",
            "Gain Recurrence",
            "Loss Recurrence",
            "LOH Recurrence",
            "Loss/LOH Recurrence",
            "Donors with Gains",
            "Donors with Losses",
            "Donors with LOH",
            "Donors with Loss/LOH",
        ];
    }
    textExportCnv(metadata,references){
        let outputChunks=[];
        outputChunks.push(references.chromosomes[this.chromosomeIndex].chromosomeName);
        outputChunks.push(this.startPos);
        outputChunks.push(this.endPos);
        let cytobandHits=[];
        for (let i = 0; i < this.cytobandIndices.length; ++i) {
            cytobandHits.push(references.cytobands[this.cytobandIndices[i]].cytobandName);
        }
        outputChunks.push(cytobandHits.join(','));
        outputChunks.push(this.cnvGainDonorContributorIndices.size);
        outputChunks.push(this.cnvLossDonorContributorIndices.size);
        outputChunks.push(this.lohDonorContributorIndices.size);
        if(this.cnvGainDonorContributorIndices.size+this.cnvLossDonorContributorIndices.size+this.lohDonorContributorIndices.size===0){
            return[];
        }
        let lohLossDonors=new Set([...this.lohDonorContributorIndices,...this.cnvLossDonorContributorIndices]);
        outputChunks.push(lohLossDonors.size);
        let gainDonorNames=[];
        this.cnvGainDonorContributorIndices.forEach((donorIndex)=>{
            gainDonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(gainDonorNames.join(','));

        let lossDonorNames=[];
        this.cnvLossDonorContributorIndices.forEach((donorIndex)=>{
            lossDonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(lossDonorNames.join(','));

        let lohDonorNames=[];
        this.lohDonorContributorIndices.forEach((donorIndex)=>{
            lohDonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(lohDonorNames.join(','));

        let lohLossDonorNames=[];
        lohLossDonors.forEach((donorIndex)=>{
            lohLossDonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(lohLossDonorNames.join(','));
        return outputChunks;
    }


    static generalHeaderExportSv(){
        return [
            "TAD Chromosome",
            "TAD Start",
            "TAD End",
            "Cytobands",
            "Total Shown Recurrence",
            "Donors with Direct SV Hits on the TAD",
            "Donors with SV Hits On 1-Offset Neighbors",
            "Donors with SV Hits On 2-Offset Neighbors",
            "Donors with SV Hits On 3-Offset Neighbors"
        ];
    }
    textExportSv(metadata,references,maxOffset){
        let outputChunks=[];
        outputChunks.push(references.chromosomes[this.chromosomeIndex].chromosomeName);
        outputChunks.push(this.startPos);
        outputChunks.push(this.endPos);
        let cytobandHits=[];
        for (let i = 0; i < this.cytobandIndices.length; ++i) {
            cytobandHits.push(references.cytobands[this.cytobandIndices[i]].cytobandName);
        }
        outputChunks.push(cytobandHits.join(','));
        let recurrence=this.svDonorContributorIndicesOffset0.size;
        if(maxOffset>=1){
            recurrence+=this.svDonorContributorIndicesOffset1.size;
        }
        if(maxOffset>=2){
            recurrence+=this.svDonorContributorIndicesOffset2.size;
        }
        if(maxOffset>=3){
            recurrence+=this.svDonorContributorIndicesOffset3.size;
        }
        if(recurrence===0){
            return[];
        }
        outputChunks.push(recurrence);
        let offset0DonorNames=[];
        this.svDonorContributorIndicesOffset0.forEach((donorIndex)=>{
            offset0DonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(offset0DonorNames.join(','));
        let offset1DonorNames=[];
        this.svDonorContributorIndicesOffset1.forEach((donorIndex)=>{
            offset1DonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(offset1DonorNames.join(','));
        let offset2DonorNames=[];
        this.svDonorContributorIndicesOffset2.forEach((donorIndex)=>{
            offset2DonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(offset2DonorNames.join(','));
        let offset3DonorNames=[];
        this.svDonorContributorIndicesOffset3.forEach((donorIndex)=>{
            offset3DonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(offset3DonorNames.join(','));
        return outputChunks;
    }


    static generalHeaderExportIndel(){
        let outputChunks=[
            "TAD Chromosome",
            "TAD Start",
            "TAD End",
            "Cytobands",
            "Total Shown Recurrence",
            "Donors with Direct Indel Hits on the TAD",
            "Donors with Indel Hits On 1-Offset Neighbors",
            "Donors with Indel Hits On 2-Offset Neighbors",
            "Donors with Indel Hits On 3-Offset Neighbors"
        ];
    }
    textExportIndel(metadata,references,maxOffset){
        let outputChunks=[];
        outputChunks.push(references.chromosomes[this.chromosomeIndex].chromosomeName);
        outputChunks.push(this.startPos);
        outputChunks.push(this.endPos);
        let cytobandHits=[];
        for (let i = 0; i < this.cytobandIndices.length; ++i) {
            cytobandHits.push(references.cytobands[this.cytobandIndices[i]].cytobandName);
        }
        outputChunks.push(cytobandHits.join(','));

        let recurrence=this.indelDonorContributorIndicesOffset0.size;
        if(maxOffset>=1){
            recurrence+=this.indelDonorContributorIndicesOffset1.size;
        }
        if(maxOffset>=2){
            recurrence+=this.indelDonorContributorIndicesOffset2.size;
        }
        if(maxOffset>=3){
            recurrence+=this.indelDonorContributorIndicesOffset3.size;
        }
        if(recurrence===0){
            return[];
        }
        outputChunks.push(recurrence);
        let offset0IndelDonorNames=[];
        this.indelDonorContributorIndicesOffset0.forEach((donorIndex)=>{
            offset0IndelDonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(offset0IndelDonorNames.join(','));
        let offset1IndelDonorNames=[];
        this.indelDonorContributorIndicesOffset1.forEach((donorIndex)=>{
            offset1IndelDonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(offset1IndelDonorNames.join(','));
        let offset2IndelDonorNames=[];
        this.indelDonorContributorIndicesOffset2.forEach((donorIndex)=>{
            offset2IndelDonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(offset2IndelDonorNames.join(','));
        let offset3IndelDonorNames=[];
        this.indelDonorContributorIndicesOffset3.forEach((donorIndex)=>{
            offset3IndelDonorNames.push(metadata.metadata[donorIndex].donor);
        });
        outputChunks.push(offset3IndelDonorNames.join(','));
        return outputChunks;
    }
}