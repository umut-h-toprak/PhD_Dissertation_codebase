import {getGenomeBrowserLink, padSE, searchInPubMed} from "../Utils";

export class VariantEntrySv {
    constructor(data,references){
        if(data.hasOwnProperty("svIndex")){
            this.svIndex=parseInt(data.svIndex);
        }else if(data.hasOwnProperty("midSvIndex")){
            this.svIndex=parseInt(data.midSvIndex);
        }
        this.startChrIndex=parseInt(data.startChrIndex);
        this.endChrIndex=parseInt(data.endChrIndex);
        this.startPos=parseInt(data.startPos);
        this.endPos=parseInt(data.endPos);
        this.eventScore=parseInt(data.eventScore);
        this.eventTypeIndex=parseInt(data.eventType);
        this.clonality=+data.clonality;
        if(data.source1!=="_"){
            this.source1=data.source1;
        }
        if(data.source2!=="_"){
            this.source2=data.source2;
        }
        if(data.overhang1!=="."){
            this.overhang1=data.overhang1;
        }
        if(data.overhang2!=="."){
            this.overhang2=data.overhang2;
        }
        this.startCytobandIndex=parseInt(data.startCytobandIndex);
        this.endCytobandIndex=parseInt(data.endCytobandIndex);
        // this.data=data
        if(data.gene1!=="."){
            let individualGenes=data.gene1.split(',');
            let gene1Info=[];
            for(let i=0;i<individualGenes.length;++i){
                let geneChunks=individualGenes[i].split('_');
                if(!isNaN(geneChunks[0])){
                    let geneId=parseInt(geneChunks[0]);
                    if(references.genes.has(geneId)){
                        if(geneChunks.length===2){
                            if(geneChunks[1].charAt(0)==="e"){
                                let exonIndex=parseInt(geneChunks[1].replace("exon",""));
                                gene1Info.push([geneId,"e",exonIndex]);
                            }
                            else if(geneChunks[1].charAt(0)==="i"){
                                let intronIndex=parseInt(geneChunks[1].replace("intron",""));
                                gene1Info.push([geneId,"i",intronIndex]);
                            }
                            else if(geneChunks[1].charAt(0)==="5"){
                                gene1Info.push([geneId,"p",0]);
                            }
                        }else{
                            gene1Info.push([geneId,"",0]);
                        }
                    }
                }
            }
            if(gene1Info.length>0){
                this.gene1Info=gene1Info;
            }
        }
        if(data.gene2!=="."){
            let individualGenes=data.gene2.split(',');
            let gene2Info=[];
            for(let i=0;i<individualGenes.length;++i){
                let geneChunks=individualGenes[i].split('_');
                if(!isNaN(geneChunks[0])){
                    let geneId=parseInt(geneChunks[0]);
                    if(references.genes.has(geneId)){
                        if(geneChunks.length===2){
                            if(geneChunks[1].charAt(0)==="e"){
                                let exonIndex=parseInt(geneChunks[1].replace("exon",""));
                                gene2Info.push([geneId,"e",exonIndex]);
                            }
                            else if(geneChunks[1].charAt(0)==="i"){
                                let intronIndex=parseInt(geneChunks[1].replace("intron",""));
                                gene2Info.push([geneId,"i",intronIndex]);
                            }
                            else if(geneChunks[1].charAt(0)==="5"){
                                gene2Info.push([geneId,"p",0]);
                            }
                        }else{
                            gene2Info.push([geneId,"",0]);
                        }
                    }
                }
            }
            if(gene2Info.length>0){
                this.gene2Info=gene2Info;
            }
        }
        let directHits=new Set();
        data.directHits.split(',').forEach((directHit)=>{
            if($.isNumeric(directHit)){
                let trueHit=parseInt(directHit);
                if(references.genes.has(trueHit)){
                    directHits.add(trueHit);
                }
            }
        });
        if(directHits.length>0){
            this.directHits=directHits;
        }
        if(data.nearestGeneUpstream1!=="-1"){
            this.nearestGeneUpstream1Ids=[];
            data.nearestGeneUpstream1.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.nearestGeneUpstream1Ids.push(geneId);
                }

            });
            this.nearestGeneUpstreamDistance1=parseInt(data.nearestGeneUpstreamDistance1);
        }
        if(data.nearestCancerGeneUpstream1!=="-1"){
            this.nearestCancerGeneUpstream1Ids=[];
            data.nearestCancerGeneUpstream1.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.nearestCancerGeneUpstream1Ids.push(geneId);
                }
            });
            this.nearestCancerGeneUpstreamDistance1=parseInt(data.nearestCancerGeneUpstreamDistance1);
        }
        if(data.nearestGeneDownstream1!=="-1"){
            this.nearestGeneDownstream1Ids=[];
            data.nearestGeneDownstream1.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.nearestGeneDownstream1Ids.push(parseInt(geneId));
                }
            });
            this.nearestGeneDownstreamDistance1=parseInt(data.nearestGeneDownstreamDistance1);
        }
        if(data.nearestCancerGeneDownstream1!=="-1"){
            this.nearestCancerGeneDownstream1Ids=[];
            data.nearestCancerGeneDownstream1.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.nearestCancerGeneDownstream1Ids.push(parseInt(geneId));
                }
            });
            this.nearestCancerGeneDownstreamDistance1=parseInt(data.nearestCancerGeneDownstreamDistance1);
        }
        if(data.nearestGeneUpstream2!=="-1"){
            this.nearestGeneUpstream2Ids=[];
            data.nearestGeneUpstream2.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.nearestGeneUpstream2Ids.push(parseInt(geneId));
                }
            });
            this.nearestGeneUpstreamDistance2=parseInt(data.nearestGeneUpstreamDistance2);
        }
        if(data.nearestCancerGeneUpstream2!=="-1"){
            this.nearestCancerGeneUpstream2Ids=[];
            data.nearestCancerGeneUpstream2.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.nearestCancerGeneUpstream2Ids.push(parseInt(geneId));
                }
            });
            this.nearestCancerGeneUpstreamDistance2=parseInt(data.nearestCancerGeneUpstreamDistance2);
        }
        if(data.nearestGeneDownstream2!=="-1"){
            this.nearestGeneDownstream2Ids=[];
            data.nearestGeneDownstream2.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.nearestGeneDownstream2Ids.push(parseInt(geneId));
                }
            });
            this.nearestGeneDownstreamDistance2=parseInt(data.nearestGeneDownstreamDistance2);
        }
        if(data.nearestCancerGeneDownstream2!=="-1"){
            this.nearestCancerGeneDownstream2Ids=[];
            data.nearestCancerGeneDownstream2.split(',').forEach((gene)=>{
                let geneId=parseInt(gene);
                if(references.genes.has(geneId)){
                    this.nearestCancerGeneDownstream2Ids.push(parseInt(geneId));
                }
            });
            this.nearestCancerGeneDownstreamDistance2=parseInt(data.nearestCancerGeneDownstreamDistance2);
        }
        if(parseInt(data.startFragileSiteIndex)!==-1){
            this.startFragileSiteIndex=parseInt(data.startFragileSiteIndex);
        }
        if(parseInt(data.endFragileSiteIndex)!==-1){
            this.endFragileSiteIndex=parseInt(data.endFragileSiteIndex);
        }
        if(data.dbSuperEntries1!==".") {
            this.dbSuperEntryIds1=[];
            data.dbSuperEntries1.split(',').forEach((dbSuperEntry)=>{
                this.dbSuperEntryIds1.push(parseInt(dbSuperEntry));
            });
        }
        if(data.dbSuperEntries2!==".") {
            this.dbSuperEntryIds2=[];
            data.dbSuperEntries2.split(',').forEach((dbSuperEntry)=>{
                this.dbSuperEntryIds2.push(parseInt(dbSuperEntry));
            });
        }

        if(parseInt(data.preRemapStartChrIndex)!==-1){
            this.preRemapStartChrIndex=parseInt(data.preRemapStartChrIndex);
            this.preRemapStartPos=parseInt(data.preRemapStartPos);
        }
        if(parseInt(data.preRemapEndChrIndex)!==-1){
            this.preRemapEndChrIndex=parseInt(data.preRemapEndChrIndex);
            this.preRemapEndPos=parseInt(data.preRemapEndPos);
        }
        this.tadIndicesOffset0=[];
        if(data.tadIndicesOffset0!=="."){
            data.tadIndicesOffset0.split(';').forEach((x)=>{
                this.tadIndicesOffset0.push(parseInt(x));
            });
        }
        this.tadIndicesOffset1=[];
        if(data.tadIndicesOffset1!=="."){
            data.tadIndicesOffset1.split(';').forEach((x)=>{
                this.tadIndicesOffset1.push(parseInt(x));
            });
        }
        this.tadIndicesOffset2=[];
        if(data.tadIndicesOffset2!=="."){
            data.tadIndicesOffset2.split(';').forEach((x)=>{
                this.tadIndicesOffset2.push(parseInt(x));
            });
        }
        this.tadIndicesOffset3=[];
        if(data.tadIndicesOffset3!=="."){
            data.tadIndicesOffset3.split(';').forEach((x)=>{
                this.tadIndicesOffset3.push(parseInt(x));
            });
        }
        this.maxRecurrence=parseInt(data.maxRecurrence);
        // this.maxIntraPatientRecurrence=parseInt(data.maxIntraPatientRecurrence);
        this.donorIndex=parseInt(data.donor);
        this.vdjGrade=-1;
        this.assignVdjTargets(references,0,false);
        this.eventTypeVizIndex=this.eventTypeIndex;
        this.parentVdjIndex=-1;
    }
    assignVdjTargets(references,grade,forcedMode){
        if(this.eventTypeIndex===6 || this.eventTypeIndex===7){
            this.vdjGrade=grade;
            let vdjTargets=this.estimateVdjTarget(references,forcedMode);
            if(this.eventTypeIndex===6 || this.eventTypeIndex===7){
                this.vdjTargets=references.mapKnownVdjTargets(vdjTargets);
            }
        }
    }
    transformToVdjSv(parentSv,sideToTransform,grade,references){
        // -1 left side is the VDJ source -> 7
        //  1 right side is the VDJ source -> 6
        this.parentVdjIndex=parentSv.svIndex;
        if(sideToTransform===-1){
            this.eventTypeIndex=7;
            this.eventTypeVizIndex=7;
        }
        if(sideToTransform===1){
            this.eventTypeIndex=6;
            this.eventTypeVizIndex=6;
        }
        this.assignVdjTargets(references,grade,true);
    }
    getEventHeight(){
        let eventHeight = 1;
        let eventSize=Math.abs(this.endPos - this.startPos);
        let smallEvent = this.startChrIndex === this.endChrIndex && eventSize < 9e6;
        let mediumEvent = !smallEvent &&  this.startChrIndex === this.endChrIndex && eventSize < 18e6;
        if(smallEvent||mediumEvent){
            if(this.eventTypeIndex===6||this.eventTypeIndex===7){
                return 0.5;
            }
            if(smallEvent) {
                eventHeight = 0.15
            } else if(mediumEvent) {
                eventHeight = 0.35
            }
        }
        return eventHeight
    }
    estimateVdjTarget(references,forcedMode){
        let geneDirect=undefined;
        let geneUp=undefined;
        let geneUpDist=undefined;
        let geneUpCancer=undefined;
        let geneDown=undefined;
        let geneDownDist=undefined;
        let geneDownCancer=undefined;
        if(this.eventTypeIndex===7){
            if(!forcedMode){
                if(this.gene2Info!==undefined){
                    for (let i = 0; i < this.gene2Info.length; ++i) {
                        if(references.genes.has(this.gene2Info[i][0])){
                            if(!references.genes.get(this.gene2Info[i][0]).checkVdjTargetValidity()){
                                this.eventTypeIndex=1;
                                return [-1];
                            }
                        }
                    }
                }
                if(this.nearestGeneUpstream2Ids!==undefined){
                    for (let i = 0; i < this.nearestGeneUpstream2Ids.length; ++i) {
                        if(references.genes.has(this.nearestGeneUpstream2Ids[i])){
                            if(!references.genes.get(this.nearestGeneUpstream2Ids[i]).checkVdjTargetValidity()){
                                this.eventTypeIndex=1;
                                return [-1];
                            }
                        }
                    }
                }
                if(this.nearestGeneDownstream2Ids!==undefined){
                    for (let i = 0; i < this.nearestGeneDownstream2Ids.length; ++i) {
                        if(references.genes.has(this.nearestGeneDownstream2Ids[i])){
                            if(!references.genes.get(this.nearestGeneDownstream2Ids[i]).checkVdjTargetValidity()){
                                this.eventTypeIndex=1;
                                return [-1];
                            }
                        }
                    }
                }
            }
            geneDirect=this.gene2Info;
            geneUp=this.nearestGeneUpstream2Ids;
            geneUpDist=this.nearestGeneUpstreamDistance2;
            geneUpCancer=this.nearestCancerGeneUpstream2Ids;
            geneDown=this.nearestGeneDownstream2Ids;
            geneDownDist=this.nearestGeneDownstreamDistance2;
            geneDownCancer=this.nearestCancerGeneDownstream2Ids;
        }else if(this.eventTypeIndex===6){
            if(!forcedMode){
                if(this.gene1Info!==undefined){
                    for (let i = 0; i < this.gene1Info.length; ++i) {
                        if(references.genes.has(this.gene1Info[i][0])){
                            if(!references.genes.get(this.gene1Info[i][0]).checkVdjTargetValidity()){
                                this.eventTypeIndex=1;
                                return [-1];
                            }
                        }
                    }
                }
                if(this.nearestGeneUpstream1Ids!==undefined){
                    for (let i = 0; i < this.nearestGeneUpstream1Ids.length; ++i) {
                        if(references.genes.has(this.nearestGeneUpstream1Ids[i])){
                            if(!references.genes.get(this.nearestGeneUpstream1Ids[i]).checkVdjTargetValidity()){
                                this.eventTypeIndex=1;
                                return [-1];
                            }
                        }
                    }
                }
                if(this.nearestGeneDownstream1Ids!==undefined){
                    for (let i = 0; i < this.nearestGeneDownstream1Ids.length; ++i) {
                        if(references.genes.has(this.nearestGeneDownstream1Ids[i])){
                            if(!references.genes.get(this.nearestGeneDownstream1Ids[i]).checkVdjTargetValidity()){
                                this.eventTypeIndex=1;
                                return [-1];
                            }
                        }
                    }
                }
            }
            geneDirect=this.gene1Info;
            geneUp=this.nearestGeneUpstream1Ids;
            geneUpDist=this.nearestGeneUpstreamDistance1;
            geneUpCancer=this.nearestCancerGeneUpstream1Ids;
            geneDown=this.nearestGeneDownstream1Ids;
            geneDownDist=this.nearestGeneDownstreamDistance1;
            geneDownCancer=this.nearestCancerGeneDownstream1Ids;
        }
        if(geneDirect!==undefined){
            for (let i = 0; i < geneDirect.length; ++i) {
                if(references.superVdjTargets.has(geneDirect[i][0])){
                    return [geneDirect[i][0]]
                }
            }
        }
        if(geneUp!==undefined){
            for (let i = 0; i < geneUp.length; ++i) {
                if(references.superVdjTargets.has(geneUp[i])){
                    return [geneUp[i]]
                }
            }
        }
        if(geneUpCancer!==undefined){
            for (let i = 0; i < geneUpCancer.length; ++i) {
                if(references.superVdjTargets.has(geneUpCancer[i])){
                    return [geneUpCancer[i]]
                }
            }
        }
        if(geneDown!==undefined){
            for (let i = 0; i < geneDown.length; ++i) {
                if(references.superVdjTargets.has(geneDown[i])){
                    return [geneDown[i]]
                }
            }
        }
        if(geneDownCancer!==undefined){
            for (let i = 0; i < geneDownCancer.length; ++i) {
                if(references.superVdjTargets.has(geneDownCancer[i])){
                    return [geneDownCancer[i]]
                }
            }
        }

        if(geneDirect!==undefined){
            let cancerGeneCandidates=[];
            geneDirect.forEach((g)=>{
                if(references.genes.get(g[0]).cancerGene){
                    cancerGeneCandidates.push(g[0]);
                }
            });
            if(cancerGeneCandidates.length>0){
                return cancerGeneCandidates;
            }
            let genesFirstClass=[];
            let genesSecondClass=[];
            geneDirect.forEach((g)=>{
                if(references.genes.get(g[0]).isSecondClassVdjTarget()){
                    genesSecondClass.push(g[0]);
                }else{
                    genesFirstClass.push(g[0]);
                }
            });
            if(genesFirstClass.length>0){
                return genesFirstClass;
            }
            if(genesSecondClass.length>0){
                return genesSecondClass;
            }
        }
        if(geneUpDist<=geneDownDist){
            return geneUp;
        }else{
            return geneDown;
        }
    }
    annotate(references,metadata){
        const cytobandDescription=`t(${this.startChrIndex},${this.endChrIndex})(${references.cytobands[this.startCytobandIndex].rawCytobandName};${references.cytobands[this.endCytobandIndex].rawCytobandName})`;
        let svReport = `This SV is a ${this.vdjGrade>=0?`Grade ${this.vdjGrade}`:""} ${references.variantVizTypes[this.eventTypeIndex].variantDesc} ${searchInPubMed(cytobandDescription,metadata.diseaseNameAlternatives)} in donor ${metadata.metadata[this.donorIndex].donor}`;
        if(this.eventTypeIndex>5){
            svReport += ` with the predicted target${this.vdjTargets.length>1?"s":""} `;
            this.vdjTargets.forEach((vdjTarget)=>{
                svReport += `${references.genes.get(vdjTarget).getGeneCardsLink()}`;
            });
        }
        let posDescription = "";
        let spans = [];

        if(this.startChrIndex !== this.endChrIndex){
            posDescription = `${this.startChrIndex}:${this.startPos}-${this.endChrIndex}:${this.endPos}`;
            spans.push(getGenomeBrowserLink(`${references.chromosomes[this.startChrIndex].chromosomeName}:${Math.max(0,this.startPos-1000000)}-${Math.min(references.chromosomes[this.startChrIndex].chromosomeSize,this.startPos+1000000)}`));
            spans.push(getGenomeBrowserLink(`${references.chromosomes[this.endChrIndex].chromosomeName}:${Math.max(0,this.endPos-1000000)}-${Math.min(references.chromosomes[this.endChrIndex].chromosomeSize,this.endPos+1000000)}`));
        }else{
            posDescription = `${getGenomeBrowserLink(`${this.startChrIndex}:${this.startPos}-${this.endChrIndex}:${this.endPos}`)} spanning ${Math.abs(this.endPos-this.startPos)} bases`;
            if (this.getEventHeight()!==0.15){
                spans.push(getGenomeBrowserLink(`${references.chromosomes[this.startChrIndex].chromosomeName}:${Math.max(0,this.startPos-1000000)}-${Math.min(references.chromosomes[this.startChrIndex].chromosomeSize,this.startPos+1000000)}`));
                spans.push(getGenomeBrowserLink(`${references.chromosomes[this.endChrIndex].chromosomeName}:${Math.max(0,this.endPos-1000000)}-${Math.min(references.chromosomes[this.endChrIndex].chromosomeSize,this.endPos+1000000)}`));
            } else{
                spans.push(getGenomeBrowserLink(`${references.chromosomes[this.startChrIndex].chromosomeName}:${this.startPos}-${this.endPos}`));
            }
        }
        posDescription += " with the possible regions of interest:";
        let spanDescription = spans.join(", ");
        let scoreDescription=`The SOPHIA "EventScore" is ${this.eventScore} with the evidence:`;
        let source1="_";
        if(this.hasOwnProperty("source1")){
            source1=this.source1;
        }
        let source2="_";
        if(this.hasOwnProperty("source2")){
            source2=this.source2;
        }
        let evidenceDescription = `${source1}-${source2}`;
        let overhang1 ="_";
        if(this.hasOwnProperty("overhang1")){
            overhang1 = `${VariantEntrySv.submitBlastSearch(this.overhang1)}`;
        }
        let overhang2 ="_";
        if(this.hasOwnProperty("overhang2")){
            overhang2 = `${VariantEntrySv.submitBlastSearch(this.overhang2)}`;
        }
        let overhangDescription = `${overhang1}-${overhang2}`;

        let geneLoc1=getGenomeBrowserLink(`${references.chromosomes[this.startChrIndex].chromosomeName}:${this.startPos}`);
        let geneDirect1 = `${geneLoc1} is intergenic,`;
        if(this.hasOwnProperty("gene1Info")){
            geneDirect1 = `${geneLoc1} is on `;
            for (let i = 0; i < this.gene1Info.length; ++i) {
                geneDirect1 += `${references.genes.get(this.gene1Info[i][0]).getGeneCardsLink()}`;
                if(this.gene1Info[i][1]==="e"){
                    geneDirect1 += ` (exon ${this.gene1Info[i][2]})`;
                }
                else if(this.gene1Info[i][1]==="i"){
                    geneDirect1 += ` (intron ${this.gene1Info[i][2]})`;
                }
                else if(this.gene1Info[i][1]==="p"){
                    geneDirect1 += ` (5kbPromoter)`;
                }
                if(i < this.gene1Info.length-1){
                    geneDirect1 += ", ";
                }
            }
        }
        let fragileSite1="is not on an annotated common fragile site";
        if(this.hasOwnProperty("startFragileSiteIndex")){
            fragileSite1 = `is on the fragile site ${references.fragileSites[this.startFragileSiteIndex].getGeneCardsLink()}`;
        }

        let nearestGeneUpstream1 = "has no coding genes upstream";
        if(this.hasOwnProperty("nearestGeneUpstream1Ids")){
            nearestGeneUpstream1 = `has the nearest upstream coding gene${this.nearestGeneUpstream1Ids.length>1?"s":""} `;
            for (let i = 0; i < this.nearestGeneUpstream1Ids.length; ++i) {
                nearestGeneUpstream1 += `${references.genes.get(this.nearestGeneUpstream1Ids[i]).getGeneCardsLink()}`;
                if(i < this.nearestGeneUpstream1Ids.length-1){
                    geneDirect1 += ", ";
                }
            }
            nearestGeneUpstream1 += ` ${Math.abs(this.nearestGeneUpstreamDistance1)} bases away,`;
        }
        let nearestCancerGeneUpstream1 = "has no known cancer-related genes upstream";
        if(this.hasOwnProperty("nearestCancerGeneUpstream1Ids")){
            nearestCancerGeneUpstream1 = `has the nearest upstream cancer-related gene${this.nearestCancerGeneUpstream1Ids.length>1?"s":""} `;
            for (let i = 0; i < this.nearestCancerGeneUpstream1Ids.length; ++i) {
                nearestCancerGeneUpstream1 += `${references.genes.get(this.nearestCancerGeneUpstream1Ids[i]).getGeneCardsLink()}`;
                if(i < this.nearestCancerGeneUpstream1Ids.length-1){
                    nearestCancerGeneUpstream1 += ", ";
                }
            }
            nearestCancerGeneUpstream1 += ` ${Math.abs(this.nearestCancerGeneUpstreamDistance1)} bases away,`;
        }
        let nearestGeneDownstream1 = "has no coding genes downstream";
        if(this.hasOwnProperty("nearestGeneDownstream1Ids")){
            nearestGeneDownstream1 = `has the nearest downstream coding gene${this.nearestGeneDownstream1Ids.length>1?"s":""} `;
            for (let i = 0; i < this.nearestGeneDownstream1Ids.length; ++i) {
                nearestGeneDownstream1 += `${references.genes.get(this.nearestGeneDownstream1Ids[i]).getGeneCardsLink()}`;
                if(i < this.nearestGeneDownstream1Ids.length-1){
                    geneDirect1 += ", ";
                }
            }
            nearestGeneDownstream1 += ` ${Math.abs(this.nearestGeneDownstreamDistance1)} bases away,`;
        }
        let nearestCancerGeneDownstream1 = "has no known cancer-related genes downstream";
        if(this.hasOwnProperty("nearestCancerGeneDownstream1Ids")){
            nearestCancerGeneDownstream1 = `has the nearest downstream cancer-related gene${this.nearestCancerGeneDownstream1Ids.length>1?"s":""} `;
            for (let i = 0; i < this.nearestCancerGeneDownstream1Ids.length; ++i) {
                nearestCancerGeneDownstream1 += `${references.genes.get(this.nearestCancerGeneDownstream1Ids[i]).getGeneCardsLink()}`;
                if(i < this.nearestCancerGeneDownstream1Ids.length-1){
                    nearestCancerGeneDownstream1 += ", ";
                }
            }
            nearestCancerGeneDownstream1 += ` ${Math.abs(this.nearestCancerGeneDownstreamDistance1)} bases away,`;
        }
        let dbSuperHits1 = "is on no dbSUPER entries";
        if(this.hasOwnProperty("dbSuperEntryIds1")){
            dbSuperHits1 = "is on the dbSUPER entries ";
            let individualHits1 = this.dbSuperEntryIds1;
            for (let i = 0; i < individualHits1.length; ++i) {
                dbSuperHits1 += VariantEntrySv.getDbSuperLink(individualHits1[i]);
                if(i < individualHits1.length-1){
                    dbSuperHits1 += ", ";
                }
            }
        }
        let gene1Summary=[
            geneDirect1,
            fragileSite1,
            nearestGeneUpstream1,
            nearestCancerGeneUpstream1,
            nearestGeneDownstream1,
            nearestCancerGeneDownstream1,
            dbSuperHits1,
            "",
        ];
        let geneLoc2=getGenomeBrowserLink(`${references.chromosomes[this.endChrIndex].chromosomeName}:${this.endPos}`);
        let geneDirect2 = `${geneLoc2} is intergenic,`;
        if(this.hasOwnProperty("gene2Info")){
            geneDirect2 = `${geneLoc2} is on `;
            for (let i = 0; i < this.gene2Info.length; ++i) {
                geneDirect2 += `${references.genes.get(this.gene2Info[i][0]).getGeneCardsLink()}`;
                if(this.gene2Info[i][1]==="e"){
                    geneDirect2 += ` (exon ${this.gene2Info[i][2]})`;
                }
                else if(this.gene2Info[i][1]==="i"){
                    geneDirect2 += ` (intron ${this.gene2Info[i][2]})`;
                }
                else if(this.gene2Info[i][1]==="p"){
                    geneDirect2 += ` (5kbPromoter)`;
                }
                if(i < this.gene2Info.length-1){
                    geneDirect2 += ", ";
                }
            }
        }

        let fragileSite2="is not on an annotated common fragile site";
        if(this.hasOwnProperty("endFragileSiteIndex")){
            fragileSite2 = `is on the fragile site ${references.fragileSites[this.endFragileSiteIndex].getGeneCardsLink()}`;
        }
        let nearestGeneUpstream2 = "has no coding genes upstream";
        if(this.hasOwnProperty("nearestGeneUpstream2Ids")){
            nearestGeneUpstream2 = `has the nearest upstream coding gene${this.nearestGeneUpstream2Ids.length>1?"s":""} `;
            for (let i = 0; i < this.nearestGeneUpstream2Ids.length; ++i) {
                nearestGeneUpstream2 += `${references.genes.get(this.nearestGeneUpstream2Ids[i]).getGeneCardsLink()}`;
                if(i < this.nearestGeneUpstream2Ids.length-1){
                    geneDirect1 += ", ";
                }
            }
            nearestGeneUpstream2 += ` ${Math.abs(this.nearestGeneUpstreamDistance2)} bases away,`;
        }
        let nearestCancerGeneUpstream2 = "has no known cancer-related genes upstream";
        if(this.hasOwnProperty("nearestCancerGeneUpstream2Ids")){
            nearestCancerGeneUpstream2 = `has the nearest upstream cancer-related gene${this.nearestCancerGeneUpstream2Ids.length>1?"s":""} `;
            for (let i = 0; i < this.nearestCancerGeneUpstream2Ids.length; ++i) {
                nearestCancerGeneUpstream2 += `${references.genes.get(this.nearestCancerGeneUpstream2Ids[i]).getGeneCardsLink()}`;
                if(i < this.nearestCancerGeneUpstream2Ids.length-1){
                    nearestCancerGeneUpstream2 += ", ";
                }
            }
            nearestCancerGeneUpstream2 += ` ${Math.abs(this.nearestCancerGeneUpstreamDistance2)} bases away,`;
        }
        let nearestGeneDownstream2 = "has no coding genes downstream";
        if(this.hasOwnProperty("nearestGeneDownstream2Ids")){
            nearestGeneDownstream2 = `has the nearest downstream coding gene${this.nearestGeneDownstream2Ids.length>1?"s":""} `;
            for (let i = 0; i < this.nearestGeneDownstream2Ids.length; ++i) {
                nearestGeneDownstream2 += `${references.genes.get(this.nearestGeneDownstream2Ids[i]).getGeneCardsLink()}`;
                if(i < this.nearestGeneDownstream2Ids.length-1){
                    geneDirect1 += ", ";
                }
            }
            nearestGeneDownstream2 += ` ${Math.abs(this.nearestGeneDownstreamDistance2)} bases away,`;
        }
        let nearestCancerGeneDownstream2 = "has no known cancer-related genes downstream";
        if(this.hasOwnProperty("nearestCancerGeneDownstream2Ids")){
            nearestCancerGeneDownstream2 = `has the nearest downstream cancer-related gene${this.nearestCancerGeneDownstream2Ids.length>1?"s":""} `;
            for (let i = 0; i < this.nearestCancerGeneDownstream2Ids.length; ++i) {
                nearestCancerGeneDownstream2 += `${references.genes.get(this.nearestCancerGeneDownstream2Ids[i]).getGeneCardsLink()}`;
                if(i < this.nearestCancerGeneDownstream2Ids.length-1){
                    nearestCancerGeneDownstream2 += ", ";
                }
            }
            nearestCancerGeneDownstream2 += ` ${Math.abs(this.nearestCancerGeneDownstreamDistance2)} bases away,`;
        }
        let dbSuperHits2 = "is on no dbSUPER entries";
        if(this.hasOwnProperty("dbSuperEntryIds2")){
            dbSuperHits2 = "is on the dbSUPER entries ";
            let individualHits2 = this.dbSuperEntryIds2;
            for (let i = 0; i < individualHits2.length; ++i) {
                dbSuperHits2 += VariantEntrySv.getDbSuperLink(individualHits2[i]);
                if(i < individualHits2.length-1){
                    dbSuperHits2 += ", ";
                }
            }
        }
        let gene2Summary=[
            geneDirect2,
            fragileSite2,
            nearestGeneUpstream2,
            nearestCancerGeneUpstream2,
            nearestGeneDownstream2,
            nearestCancerGeneDownstream2,
            dbSuperHits2,
            "",
        ];

        let genesCumulative=new Set();
        let genesOffset0=new Set();
        let genesOffset1=new Set();
        let genesOffset2=new Set();
        let genesOffset3=new Set();
        for (let i = 0; i < this.tadIndicesOffset0.length; ++i) {
            for (let j = 0; j < references.tads[this.tadIndicesOffset0[i]].geneIndices.length; ++j) {
                genesOffset0.add(references.tads[this.tadIndicesOffset0[i]].geneIndices[j]);
                genesCumulative.add(references.tads[this.tadIndicesOffset0[i]].geneIndices[j]);
            }
        }
        for (let i = 0; i < this.tadIndicesOffset1.length; ++i) {
            for (let j = 0; j < references.tads[this.tadIndicesOffset1[i]].geneIndices.length; ++j) {
                if(!genesCumulative.has(references.tads[this.tadIndicesOffset1[i]].geneIndices[j])){
                    genesCumulative.add(references.tads[this.tadIndicesOffset1[i]].geneIndices[j]);
                    genesOffset1.add(references.tads[this.tadIndicesOffset1[i]].geneIndices[j]);
                }
            }
        }
        for (let i = 0; i < this.tadIndicesOffset2.length; ++i) {
            for (let j = 0; j < references.tads[this.tadIndicesOffset2[i]].geneIndices.length; ++j) {
                if(!genesCumulative.has(references.tads[this.tadIndicesOffset2[i]].geneIndices[j])){
                    genesCumulative.add(references.tads[this.tadIndicesOffset2[i]].geneIndices[j]);
                    genesOffset2.add(references.tads[this.tadIndicesOffset2[i]].geneIndices[j]);
                }
            }
        }
        for (let i = 0; i < this.tadIndicesOffset3.length; ++i) {
            for (let j = 0; j < references.tads[this.tadIndicesOffset3[i]].geneIndices.length; ++j) {
                if(!genesCumulative.has(references.tads[this.tadIndicesOffset3[i]].geneIndices[j])){
                    genesOffset3.add(references.tads[this.tadIndicesOffset3[i]].geneIndices[j]);
                }
            }
        }
        let tadReportOffset0="";
        if(this.tadIndicesOffset0.length!==0){
            tadReportOffset0 = `The SV directly hits the TAD${this.tadIndicesOffset0.length>1?"s":""}: `;
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
        let tadReportOffset1="";
        if(this.tadIndicesOffset1.length!==0){
            tadReportOffset1 = `The SV indirectly hits the TAD${this.tadIndicesOffset1.length>1?"s":""} up to 1 TAD away: `;
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
        let tadReportOffset2="";
        if(this.tadIndicesOffset2.length!==0){
            tadReportOffset2 = `The SV indirectly hits the TAD${this.tadIndicesOffset2.length>1?"s":""} up to 2 TADs away: `;
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
        let tadReportOffset3="";
        if(this.tadIndicesOffset3.length!==0){
            tadReportOffset3 = `The SV indirectly hits the TAD${this.tadIndicesOffset3.length>1?"s":""} up to 3 TADs away: `;
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

        return [
            svReport,
            posDescription,
            spanDescription,
            scoreDescription,
            evidenceDescription,
            overhangDescription,
            ""].concat(gene1Summary).concat(gene2Summary).concat([tadReportOffset0,tadReportOffset1,tadReportOffset2,tadReportOffset3])
            .join('<br />');
    }
    getIndex(){
        return this.svIndex;
    }
    setIndex(index){
        this.svIndex=index;
    }
    static submitBlastSearch(overhang){
        return `<a href="https://blast.ncbi.nlm.nih.gov/Blast.cgi?QUERY=${overhang.replace("|","")}&DATABASE=nt&PROGRAM=blastn&CMD=Put&FILTER=F" target="_blank" style="font-size: 10px; text-decoration: none">${overhang}</a>`;
    }

    static getDbSuperLink(dbSuperEntry) {
        let dbSuperEntryFinal = padSE(dbSuperEntry);
        return `<a href="http://bioinfo.au.tsinghua.edu.cn/dbsuper/details.php?se_id=${dbSuperEntryFinal}" target="_blank">${dbSuperEntryFinal}</a>`;
    }
    getVdjLabel(references,vdjCountMapper,maxVdjGrade){
        if(this.vdjTargets.length===0){
            return "?";
        }
        let vdjLabels=[];
        if(vdjCountMapper===null){
            this.vdjTargets.forEach((x)=>{
                vdjLabels.push(references.genes.get(x).geneName);
            });
        }else{
            this.vdjTargets.forEach((x)=>{
                if(vdjCountMapper.has(x)){
                    let donorCount=0;
                    let tmpMap=vdjCountMapper.get(x);
                    tmpMap.forEach((val,key,map)=>{
                        if(val<=maxVdjGrade){
                            donorCount+=1;
                        }
                    });
                    vdjLabels.push(`${references.genes.get(x).geneName} (${donorCount})`);
                }
            });
        }
        return vdjLabels.join(';');
    }
    static generalHeaderExport(){
        return [
            "chr1",
            "start1",
            "end1",
            "chr2",
            "start2",
            "end2",
            "eventScore",
            "eventType",
            "clonalityEstimate",
            "source1",
            "source2",
            "overhang1",
            "overhang2",
            "cytoband1",
            "cytoband2",
            "fragileSites1",
            "fragileSites2",

            "dbSuperEntries1",
            "dbSuperEntries2",

            "gene1",
            "cancerGene1",
            "nearestGeneUpstream1",
            "nearestGeneUpstreamDistance1",
            "nearestcancerGeneUpstream1",
            "nearestcancerGeneUpstreamDistance1",
            "nearestGeneDownstream1",
            "nearestGeneDownstreamDistance1",
            "nearestcancerGeneDownstream1",
            "nearestcancerGeneDownstreamDistance1",

            "gene2",
            "cancerGene2",
            "nearestGeneUpstream2",
            "nearestGeneUpstreamDistance2",
            "nearestcancerGeneUpstream2",
            "nearestcancerGeneUpstreamDistance2",
            "nearestGeneDownstream2",
            "nearestGeneDownstreamDistance2",
            "nearestcancerGeneDownstream2",
            "nearestcancerGeneDownstreamDistance2",

            "vdjTargetEstimates",
            "Donor"
        ];
    }
    svSimilarity(sv2,sideToCheck,distanceThreshold=2e5){
        //sideToCheck: -1 left, 0 both, 1 right
        //similarSide: -1 left,1 right
        if(sideToCheck===-1){
            if(this.startChrIndex===sv2.startChrIndex && Math.abs(this.startPos-sv2.startPos)<=distanceThreshold){
                return [true,-1];
            }
            if(this.startChrIndex===sv2.endChrIndex && Math.abs(this.startPos-sv2.endPos)<=distanceThreshold){
                return [true,1];
            }
            return [false,0];
        }else if(sideToCheck===0){
            if(this.startChrIndex===sv2.startChrIndex && Math.abs(this.startPos-sv2.startPos)<=distanceThreshold){
                return [true,-1];
            }
            if(this.startChrIndex===sv2.endChrIndex && Math.abs(this.startPos-sv2.endPos)<=distanceThreshold){
                return [true,1];
            }
            if(this.endChrIndex===sv2.startChrIndex && Math.abs(this.endPos-sv2.startPos)<=distanceThreshold){
                return [true,-1];
            }
            if(this.endChrIndex===sv2.endChrIndex && Math.abs(this.endPos-sv2.endPos)<=distanceThreshold){
                return [true,1];
            }
            return [false,0];
        }else if(sideToCheck===1){
            if(this.endChrIndex===sv2.startChrIndex && Math.abs(this.endPos-sv2.startPos)<=distanceThreshold){
                return [true,-1];
            }
            if(this.endChrIndex===sv2.endChrIndex && Math.abs(this.endPos-sv2.endPos)<=distanceThreshold){
                return [true,1];
            }
            return [false,0];
        }
        return [false,0];
    }
    textExport(references,metadata) {
        let outputChunks = [
            references.chromosomes[this.startChrIndex].chromosomeName,
            this.startPos,
            this.startPos + 1,
            references.chromosomes[this.endChrIndex].chromosomeName,
            this.endPos,
            this.endPos + 1,
            this.eventScore,
            references.variantVizTypes[this.eventTypeIndex].variantDesc,
            this.clonality,
            this.source1,
            this.source2,
            this.overhang1,
            this.overhang2,
            references.cytobands[this.startCytobandIndex].cytobandName,
            references.cytobands[this.endCytobandIndex].cytobandName,
        ];
        if (this.hasOwnProperty("startFragileSiteIndex")) {
            outputChunks.push(references.fragileSites[this.startFragileSiteIndex].fragileSiteNames.join(','));
        } else {
            outputChunks.push("NA");
        }
        if (this.hasOwnProperty("endFragileSiteIndex")) {
            outputChunks.push(references.fragileSites[this.endFragileSiteIndex].fragileSiteNames.join(','));
        } else {
            outputChunks.push("NA");
        }


        if (this.hasOwnProperty("dbSuperEntryIds1")) {
            let superEnhancers1 = [];
            for (let i = 0; i < this.dbSuperEntryIds1.length; ++i) {
                superEnhancers1.push(padSE(this.dbSuperEntryIds1[i]));
            }
            outputChunks.push(superEnhancers1.join(','));
        } else {
            outputChunks.push("NA");
        }
        if (this.hasOwnProperty("dbSuperEntryIds2")) {
            let superEnhancers2 = [];
            for (let i = 0; i < this.dbSuperEntryIds2.length; ++i) {
                superEnhancers2.push(padSE(this.dbSuperEntryIds2[i]));
            }
            outputChunks.push(superEnhancers2.join(','));
        } else {
            outputChunks.push("NA");
        }

        if (this.hasOwnProperty("vdjTargets")) {
            let vdjTargets = [];
            for (let i = 0; i < this.vdjTargets.length; ++i) {
                vdjTargets.push(references.genes.get(this.vdjTargets[i]).geneName);
            }
            outputChunks.push(vdjTargets.join(','));
        } else {
            outputChunks.push("NA");
        }


        if (this.hasOwnProperty("gene1Info")) {
            let genes1 = [];
            let cancerGenes1 = [];
            for (let i = 0; i < this.gene1Info.length; ++i) {
                let geneDirect1 = "";
                let gene1 = references.genes.get(this.gene1Info[i][0]);
                geneDirect1 += gene1.geneName;
                if (this.gene1Info[i][1] === "e") {
                    geneDirect1 += ` (exon ${this.gene1Info[i][2]})`;
                } else if (this.gene1Info[i][1] === "i") {
                    geneDirect1 += ` (intron ${this.gene1Info[i][2]})`;
                } else if (this.gene1Info[i][1] === "p") {
                    geneDirect1 += ` (5kbPromoter)`;
                }
                genes1.push(geneDirect1);
                if (gene1.cancerGene) {
                    cancerGenes1.push(geneDirect1);
                }
            }
            outputChunks.push(genes1.join(','));
            if (cancerGenes1.length > 0) {
                outputChunks.push(cancerGenes1.join(','));
            } else {
                outputChunks.push("NA")
            }
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }


        if (this.hasOwnProperty("nearestGeneUpstream1Ids")) {
            let nearestGeneUpstream1Names = [];
            for (let i = 0; i < this.nearestGeneUpstream1Ids.length; ++i) {
                nearestGeneUpstream1Names.push(`${references.genes.get(this.nearestGeneUpstream1Ids[i]).geneName}`);
            }
            outputChunks.push(nearestGeneUpstream1Names.join(','));
            outputChunks.push(this.nearestGeneUpstreamDistance1);
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }
        if (this.hasOwnProperty("nearestCancerGeneUpstream1Ids")) {
            let nearestCancerGeneUpstream1Names = [];
            for (let i = 0; i < this.nearestCancerGeneUpstream1Ids.length; ++i) {
                nearestCancerGeneUpstream1Names.push(`${references.genes.get(this.nearestCancerGeneUpstream1Ids[i]).geneName}`);
            }
            outputChunks.push(nearestCancerGeneUpstream1Names.join(','));
            outputChunks.push(this.nearestCancerGeneUpstreamDistance1);
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }
        if (this.hasOwnProperty("nearestGeneDownstream1Ids")) {
            let nearestGeneDownstream1Names = [];
            for (let i = 0; i < this.nearestGeneDownstream1Ids.length; ++i) {
                nearestGeneDownstream1Names.push(`${references.genes.get(this.nearestGeneDownstream1Ids[i]).geneName}`);
            }
            outputChunks.push(nearestGeneDownstream1Names.join(','));
            outputChunks.push(this.nearestGeneDownstreamDistance1);
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }
        if (this.hasOwnProperty("nearestCancerGeneDownstream1Ids")) {
            let nearestCancerGeneDownstream1Names = [];
            for (let i = 0; i < this.nearestCancerGeneDownstream1Ids.length; ++i) {
                nearestCancerGeneDownstream1Names.push(`${references.genes.get(this.nearestCancerGeneDownstream1Ids[i]).geneName}`);
            }
            outputChunks.push(nearestCancerGeneDownstream1Names.join(','));
            outputChunks.push(this.nearestCancerGeneDownstreamDistance1);
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }

        if (this.hasOwnProperty("gene2Info")) {
            let genes2 = [];
            let cancerGenes2 = [];
            for (let i = 0; i < this.gene2Info.length; ++i) {
                let geneDirect2 = "";
                let gene2 = references.genes.get(this.gene2Info[i][0]);
                geneDirect2 += gene2.geneName;
                if (this.gene2Info[i][1] === "e") {
                    geneDirect2 += ` (exon ${this.gene2Info[i][2]})`;
                } else if (this.gene2Info[i][1] === "i") {
                    geneDirect2 += ` (intron ${this.gene2Info[i][2]})`;
                } else if (this.gene2Info[i][1] === "p") {
                    geneDirect2 += ` (5kbPromoter)`;
                }
                genes2.push(geneDirect2);
                if (gene2.cancerGene) {
                    cancerGenes2.push(geneDirect2);
                }
            }
            outputChunks.push(genes2.join(','));
            if (cancerGenes2.length > 0) {
                outputChunks.push(cancerGenes2.join(','));
            } else {
                outputChunks.push("NA")
            }
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }

        if (this.hasOwnProperty("nearestGeneUpstream2Ids")) {
            let nearestGeneUpstream2Names = [];
            for (let i = 0; i < this.nearestGeneUpstream2Ids.length; ++i) {
                nearestGeneUpstream2Names.push(`${references.genes.get(this.nearestGeneUpstream2Ids[i]).geneName}`);
            }
            outputChunks.push(nearestGeneUpstream2Names.join(','));
            outputChunks.push(this.nearestGeneUpstreamDistance2);
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }
        if (this.hasOwnProperty("nearestCancerGeneUpstream2Ids")) {
            let nearestCancerGeneUpstream2Names = [];
            for (let i = 0; i < this.nearestCancerGeneUpstream2Ids.length; ++i) {
                nearestCancerGeneUpstream2Names.push(`${references.genes.get(this.nearestCancerGeneUpstream2Ids[i]).geneName}`);
            }
            outputChunks.push(nearestCancerGeneUpstream2Names.join(','));
            outputChunks.push(this.nearestCancerGeneUpstreamDistance2);
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }
        if (this.hasOwnProperty("nearestGeneDownstream2Ids")) {
            let nearestGeneDownstream2Names = [];
            for (let i = 0; i < this.nearestGeneDownstream2Ids.length; ++i) {
                nearestGeneDownstream2Names.push(`${references.genes.get(this.nearestGeneDownstream2Ids[i]).geneName}`);
            }
            outputChunks.push(nearestGeneDownstream2Names.join(','));
            outputChunks.push(this.nearestGeneDownstreamDistance2);
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }
        if (this.hasOwnProperty("nearestCancerGeneDownstream2Ids")) {
            let nearestCancerGeneDownstream2Names = [];
            for (let i = 0; i < this.nearestCancerGeneDownstream2Ids.length; ++i) {
                nearestCancerGeneDownstream2Names.push(`${references.genes.get(this.nearestCancerGeneDownstream2Ids[i]).geneName}`);
            }
            outputChunks.push(nearestCancerGeneDownstream2Names.join(','));
            outputChunks.push(this.nearestCancerGeneDownstreamDistance2);
        } else {
            outputChunks.push("NA");
            outputChunks.push("NA");
        }

        outputChunks.push(metadata.metadata[this.donorIndex].donor);
        for (let i = 0; i < outputChunks.length; ++i) {
            if (outputChunks[i] === undefined) {
                outputChunks[i] = "NA";
            }
        }
        return outputChunks;
    }
}