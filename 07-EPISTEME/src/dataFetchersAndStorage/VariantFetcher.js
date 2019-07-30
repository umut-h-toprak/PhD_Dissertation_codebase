import {queue as d3Xqueue} from "d3-queue";
import {VariantEntryIndel} from "../variants/VariantEntryIndel";
import {VariantEntrySnv} from "../variants/VariantEntrySnv";

export class VariantFetcher {
    constructor(commonSettings,references,cohortMetadata,selectionManager,geneIds){
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.geneIds=geneIds;
        this.variantsForPhenotypePlots=new Map();
        this.variantsForVariantPlots=new Map();
        this.offIndels=new Map();
        this.directIndels=new Map();
        this.directSnvs=new Map();
        this.Svs=new Map();
        this.VdjSvs=new Map();
        this.MidsizeSvs=new Map();
        this.MidsizeDirectHitSvs=new Map();
        this.geneIds.forEach((geneId)=>{
            let tmpMap1=new Map();
            this.references.variantTypes.forEach((variantType)=>{
                let tmpMap2=new Map();
                for(let i=0;i<this.cohortMetadata.metadata.length;++i){
                    tmpMap2.set(i,[]);
                }
                tmpMap1.set(variantType.uniqueLoc,tmpMap2);
            });
            this.variantsForPhenotypePlots.set(geneId,tmpMap1);
            let tmpMap3=new Map();
            tmpMap3.set('svData',[]);
            tmpMap3.set('midSizedSvData',[]);
            tmpMap3.set('vdjSvData',[]);
            tmpMap3.set('smallVariantData',[]);
            this.variantsForVariantPlots.set(geneId,tmpMap3);
            this.offIndels.set(geneId,[]);
            this.directIndels.set(geneId,[]);
            this.directSnvs.set(geneId,[]);
            this.Svs.set(geneId,[]);
            this.VdjSvs.set(geneId,[]);
            this.MidsizeSvs.set(geneId,[]);
            this.MidsizeDirectHitSvs.set(geneId,[]);
        });
    }
    getVariantDataForPhenotypePlotsFromGeneId(svMaxTadOffset,offIndelMaxTadOffset,callback){
        let q=d3Xqueue();
        let tmpIds=[];
        this.geneIds.forEach((geneId)=>{
            if(geneId!==0){
                tmpIds.push(geneId);
            }
        });
        this.geneIds=tmpIds;
        this.geneIds.forEach((geneId)=>{
            let tadIndices=this.references.genes.get(geneId).tadIndices;
            q.defer((callback)=>{
                this.getSvs(tadIndices,geneId,svMaxTadOffset,0,callback);
            });
            q.defer((callback)=>{
                this.getVdjSvs(tadIndices,geneId,svMaxTadOffset,0,callback);
            });
            q.defer((callback)=>{
                this.getMidsizedSvs(tadIndices,geneId,offIndelMaxTadOffset,0,callback);
            });
            q.defer((callback)=>{
                this.getMidsizedDirectHitSvs(tadIndices,geneId,0,callback);
            });
            q.defer((callback)=>{
                this.getOffIndels(tadIndices,geneId,offIndelMaxTadOffset,0,callback);
            });
            q.defer((callback)=>{
                this.getDirectIndels(geneId,0,callback);
            });
            q.defer((callback)=>{
                this.getDirectSnvs(geneId,0,callback);
            });
        });
        let thisRef=this;
        q.awaitAll(function(error){
            thisRef.geneIds.forEach((geneId)=>{
                thisRef.Svs.get(geneId).forEach((svItem)=>{
                    thisRef.variantsForPhenotypePlots.get(geneId).get(1).get(svItem.donorIndex).push(svItem);
                });
                thisRef.VdjSvs.get(geneId).forEach((svItem)=>{
                    thisRef.variantsForPhenotypePlots.get(geneId).get(1).get(svItem.donorIndex).push(svItem);
                });
                thisRef.MidsizeSvs.get(geneId).forEach((svItem)=>{
                    thisRef.variantsForPhenotypePlots.get(geneId).get(2).get(svItem.donorIndex).push(svItem);
                });
                thisRef.MidsizeDirectHitSvs.get(geneId).forEach((svItem)=>{
                    thisRef.variantsForPhenotypePlots.get(geneId).get(1).get(svItem.donorIndex).push(svItem);
                });
                thisRef.directSnvs.get(geneId).forEach((directSnv)=>{
                    let donorIndex=directSnv.donorIndex;
                    let uniqueLoc=thisRef.references.variantTypes[directSnv.eventTypeIndex].uniqueLoc;
                    thisRef.variantsForPhenotypePlots.get(geneId).get(uniqueLoc).get(donorIndex).push(directSnv);
                });
                thisRef.offIndels.get(geneId).forEach((offIndel)=>{
                    let donorIndex=offIndel.donorIndex;
                    thisRef.variantsForPhenotypePlots.get(geneId).get(2).get(donorIndex).push(offIndel);
                });
                thisRef.directIndels.get(geneId).forEach((directIndel)=>{
                    let donorIndex=directIndel.donorIndex;
                    let uniqueLoc=thisRef.references.variantTypes[directIndel.eventTypeIndex].uniqueLoc;
                    thisRef.variantsForPhenotypePlots.get(geneId).get(uniqueLoc).get(donorIndex).push(directIndel);
                });
            });
            callback();
        });
    }
    getVariantDataForVariantPlotsFromTadIndices(tadIndices,offIndelMaxTadOffset,svMaxTadOffset,selectedSubcohortIndex,callback){
        let geneId=0;
        let q=d3Xqueue();
        q.defer((callback)=>{
            this.getSvs(tadIndices,geneId,svMaxTadOffset,selectedSubcohortIndex,callback)
        });
        q.defer((callback)=>{
            this.getVdjSvs(tadIndices,geneId,svMaxTadOffset,selectedSubcohortIndex,callback)
        });
        q.defer((callback)=>{
            this.getMidsizedSvs(tadIndices,geneId,offIndelMaxTadOffset,selectedSubcohortIndex,callback)
        });
        q.awaitAll(()=>{
            this.Svs.get(geneId).forEach((svItem)=>{
                this.variantsForVariantPlots.get(geneId).get("svData").push(svItem);
            });
            this.VdjSvs.get(geneId).forEach((svItem)=>{
                this.variantsForVariantPlots.get(geneId).get("vdjSvData").push(svItem);
            });
            this.MidsizeSvs.get(geneId).forEach((svItem)=>{
                this.variantsForVariantPlots.get(geneId).get("midSizedSvData").push(svItem);
            });
            callback();
        });
    }
    getSmallVariantDataForVariantPlotsFromTadIndices(tadIndices,offIndelMaxTadOffset,svMaxTadOffset,selectedSubcohortIndex,callback){
        let q=d3Xqueue();
        q.defer((callback)=>{
            this.getOffIndels(tadIndices,0,offIndelMaxTadOffset,selectedSubcohortIndex,callback)
        });
        new Set(tadIndices).forEach((tadIndex)=>{
            this.references.tads[tadIndex].geneIndices.forEach((geneId)=>{
                this.directIndels.set(geneId,[]);
                this.directSnvs.set(geneId,[]);
                q.defer((callback)=>{
                    this.getDirectIndels(geneId,selectedSubcohortIndex,callback)
                });
                q.defer((callback)=>{
                    this.getDirectSnvs(geneId,selectedSubcohortIndex,callback)
                });
            });
        });

        q.awaitAll(()=>{
            this.offIndels.get(0).forEach((offIndel)=>{
                this.variantsForVariantPlots.get(0).get("smallVariantData").push(offIndel);
            });
            new Set(tadIndices).forEach((tadIndex)=>{
                this.references.tads[tadIndex].geneIndices.forEach((geneId)=>{
                    this.directIndels.get(geneId).forEach((directIndel)=>{
                        this.variantsForVariantPlots.get(0).get("smallVariantData").push(directIndel);
                    });
                    this.directSnvs.get(geneId).forEach((directSnv)=>{
                        this.variantsForVariantPlots.get(0).get("smallVariantData").push(directSnv);
                    });
                });
            });
            callback();
        });
    }
    getVariantDataForVariantPlotsFromCytobandIndex(cytobandIndex,selectedSubcohortIndex,callback){
        let tadIndices=[];
        for(let i=this.references.cytobands[cytobandIndex].firstTadIndex;i<=this.references.cytobands[cytobandIndex].lastTadIndex;++i){
            tadIndices.push(i);
        }
        this.getVariantDataForVariantPlotsFromTadIndices(tadIndices,0,0,selectedSubcohortIndex,callback);
    }
    getSmallVariantDataForVariantPlotsFromCytobandIndex(cytobandIndex,selectedSubcohortIndex,callback){
        let cytoband=this.references.cytobands[cytobandIndex];
        let tadIndices=[];
        for(let i=cytoband.firstTadIndex;i<=cytoband.lastTadIndex;++i){
            tadIndices.push(i);
        }
        this.getSmallVariantDataForVariantPlotsFromTadIndices(tadIndices,0,0,selectedSubcohortIndex,callback);
    }
    getVariantDataForVariantPlotsFromGeneId(geneId,offIndelMaxTadOffset,svMaxTadOffset,selectedSubcohortIndex,callback){
        let q=d3Xqueue();
        let tadIndices=this.references.genes.get(geneId).tadIndices;
        q.defer((callback)=>{
            this.getSvs(tadIndices,geneId,svMaxTadOffset,selectedSubcohortIndex,callback)
        });
        q.defer((callback)=>{
            this.getVdjSvs(tadIndices,geneId,svMaxTadOffset,selectedSubcohortIndex,callback)
        });
        q.defer((callback)=>{
            this.getMidsizedSvs(tadIndices,geneId,offIndelMaxTadOffset,selectedSubcohortIndex,callback)
        });
        q.awaitAll(()=>{
            this.Svs.get(geneId).forEach((svItem)=>{
                this.variantsForVariantPlots.get(0).get("svData").push(svItem);
            });
            this.VdjSvs.get(geneId).forEach((svItem)=>{
                this.variantsForVariantPlots.get(0).get("vdjSvData").push(svItem);
            });
            this.MidsizeSvs.get(geneId).forEach((svItem)=>{
                this.variantsForVariantPlots.get(0).get("midSizedSvData").push(svItem);
            });
            callback();
        });
    }
    getSmallVariantDataForVariantPlotsFromGeneId(geneId,offIndelMaxTadOffset,svMaxTadOffset,selectedSubcohortIndex,callback){
        let q=d3Xqueue();
        let tadIndices=this.references.genes.get(geneId).tadIndices;
        q.defer((callback)=>{
            this.getOffIndels(tadIndices,geneId,offIndelMaxTadOffset,selectedSubcohortIndex,callback)
        });
        q.defer((callback)=>{
            this.getDirectIndels(geneId,selectedSubcohortIndex,callback)
        });
        q.defer((callback)=>{
            this.getDirectSnvs(geneId,selectedSubcohortIndex,callback)
        });
        q.awaitAll(()=>{
            this.offIndels.get(geneId).forEach((offIndel)=>{
                this.variantsForVariantPlots.get(0).get("smallVariantData").push(offIndel);
            });
            this.directIndels.get(geneId).forEach((directIndel)=>{
                this.variantsForVariantPlots.get(0).get("smallVariantData").push(directIndel);
            });
            this.directSnvs.get(geneId).forEach((directSnv)=>{
                this.variantsForVariantPlots.get(0).get("smallVariantData").push(directSnv);
            });
            callback();
        });
    }
    getOffIndels(tadIndices,geneId,offIndelMaxTadOffset,selectedSubcohortIndex,callback){
        if(offIndelMaxTadOffset===-1){
            callback();
        }
        let thisRef=this;
        let indicesToGet=new Set();
        tadIndices.forEach((tadIndex)=>{
            this.references.tads[tadIndex].offset0IndelIndices.forEach((indelIndex)=>{
                indicesToGet.add(indelIndex)
            });
            if(offIndelMaxTadOffset>0){
                this.references.tads[tadIndex].offset1IndelIndices.forEach((indelIndex)=>{
                    indicesToGet.add(indelIndex)
                });
            }
            if(offIndelMaxTadOffset>1){
                this.references.tads[tadIndex].offset2IndelIndices.forEach((indelIndex)=>{
                    indicesToGet.add(indelIndex)
                });
            }
            if(offIndelMaxTadOffset>2){
                this.references.tads[tadIndex].offset3IndelIndices.forEach((indelIndex)=>{
                    indicesToGet.add(indelIndex)
                });
            }
        });
        if(indicesToGet.size===0){
            callback()
        }else{
            $.ajax({
                url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDbPOST.php`,
                type: 'POST',
                dataType:'json',
                data: ({
                    // tableToSearch: thisRef.cohortMetadata.cohortAllIndelsTable,
                    cohort: thisRef.cohortMetadata.cohortName,
                    suffix: "cohortAllIndels",
                    columnsToSelect: "*",
                    keyColumn: 'indelIndex',
                    keysToSearchRaw: Array.from(indicesToGet).sort().join(','),
                }),
                error: function(err){
                    console.error(err);
                },
                success: function(data){
                    let uniqueLoc=2;
                    data.forEach((x)=>{
                        let newIndel = new VariantEntryIndel(x,thisRef.references);
                        if(thisRef.selectionManager.registeredSubcohorts.get(selectedSubcohortIndex).has(newIndel.donorIndex)){
                            thisRef.offIndels.get(geneId).push(newIndel);
                        }
                    });
                    callback();
                }
            });
        }
    }
    getDirectIndels(geneId,selectedSubcohortIndex,callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDbLIKE.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                // tableToSearch: thisRef.cohortMetadata.cohortAllIndelsTable,
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: "cohortAllIndels",
                columnsToSelect: "*",
                keyColumn: 'gene',
                keysToSearchRaw: geneId,
            }),
            error: function(err){
                console.error(err);
            },
            success: function(data){
                data.forEach((x)=>{
                    let newIndel = new VariantEntryIndel(x,thisRef.references);
                    if(thisRef.selectionManager.registeredSubcohorts.get(selectedSubcohortIndex).has(newIndel.donorIndex)){
                        if(newIndel.hasOwnProperty("geneIds")){
                            if(new Set(newIndel.geneIds).has(geneId)){
                                thisRef.directIndels.get(geneId).push(newIndel);
                            }
                        }
                    }
                });
                callback();
            }
        });
    }
    getDirectSnvs(geneId,selectedSubcohortIndex,callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDbLIKE.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                // tableToSearch: thisRef.cohortMetadata.cohortAllSnvsTable,
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: "cohortAllSnvs",
                columnsToSelect: "*",
                keyColumn: 'gene',
                keysToSearchRaw: geneId,
            }),
            error: function(err){
                console.error(err);
            },
            success: function(data){
                data.forEach((x)=>{
                    let newSnv = new VariantEntrySnv(x,thisRef.references);
                    if(thisRef.selectionManager.registeredSubcohorts.get(selectedSubcohortIndex).has(newSnv.donorIndex)){
                        if(newSnv.hasOwnProperty("geneIds")){
                            if(new Set(newSnv.geneIds).has(geneId)){
                                thisRef.directSnvs.get(geneId).push(newSnv);
                            }
                        }
                    }
                });
                callback();
            }
        });
    }
    getSvs(tadIndices,geneId,svMaxTadOffset,selectedSubcohortIndex,callback){
        if(svMaxTadOffset===-1){
            callback();
        }
        let svIndicesToGet=new Set();
        tadIndices.forEach((tadIndex)=>{
            this.references.tads[tadIndex].offset0SvIndices.forEach((svIndex)=>{
                svIndicesToGet.add(svIndex)
            });
            if(svMaxTadOffset>0){
                this.references.tads[tadIndex].offset1SvIndices.forEach((svIndex)=>{
                    svIndicesToGet.add(svIndex)
                });
            }
            if(svMaxTadOffset>1){
                this.references.tads[tadIndex].offset2SvIndices.forEach((svIndex)=>{
                    svIndicesToGet.add(svIndex)
                });
            }
            if(svMaxTadOffset>2){
                this.references.tads[tadIndex].offset3SvIndices.forEach((svIndex)=>{
                    svIndicesToGet.add(svIndex)
                });
            }
        });
        svIndicesToGet.forEach((svIndex)=>{
            let svItem=this.references.currentCohort.cohortData.Svs[svIndex];
            if(this.selectionManager.registeredSubcohorts.get(selectedSubcohortIndex).has(svItem.donorIndex)){
                this.Svs.get(geneId).push(svItem);
            }
        });
        callback();
    }
    getVdjSvs(tadIndices,geneId,svMaxTadOffset,selectedSubcohortIndex,callback){
        if(svMaxTadOffset===-1){
            callback();
        }
        let vdjSvIndicesToGet=new Set();
        tadIndices.forEach((tadIndex)=>{
            this.references.tads[tadIndex].offset0VdjSvIndices.forEach((svIndex)=>{
                vdjSvIndicesToGet.add(svIndex)
            });
            if(svMaxTadOffset>0){
                this.references.tads[tadIndex].offset1VdjSvIndices.forEach((svIndex)=>{
                    vdjSvIndicesToGet.add(svIndex)
                });
            }
            if(svMaxTadOffset>1){
                this.references.tads[tadIndex].offset2VdjSvIndices.forEach((svIndex)=>{
                    vdjSvIndicesToGet.add(svIndex)
                });
            }
            if(svMaxTadOffset>2){
                this.references.tads[tadIndex].offset3VdjSvIndices.forEach((svIndex)=>{
                    vdjSvIndicesToGet.add(svIndex)
                });
            }
        });
        vdjSvIndicesToGet.forEach((svIndex)=>{
            let svItem=this.references.currentCohort.cohortData.VdjSvs[svIndex];
            if(this.selectionManager.registeredSubcohorts.get(selectedSubcohortIndex).has(svItem.donorIndex)){
                this.VdjSvs.get(geneId).push(svItem);
            }
        });
        callback();
    }
    getMidsizedSvs(tadIndices,geneId,offIndelMaxTadOffset,selectedSubcohortIndex,callback){
        if(offIndelMaxTadOffset===-1){
            callback();
        }
        let indicesToGet=new Set();
        tadIndices.forEach((tadIndex)=>{
            this.references.tads[tadIndex].offset0MidSvIndices.forEach((svIndex)=>{
                indicesToGet.add(svIndex)
            });
            if(offIndelMaxTadOffset>0){
                this.references.tads[tadIndex].offset1MidSvIndices.forEach((svIndex)=>{
                    indicesToGet.add(svIndex)
                });
            }
            if(offIndelMaxTadOffset>1){
                this.references.tads[tadIndex].offset2MidSvIndices.forEach((svIndex)=>{
                    indicesToGet.add(svIndex)
                });
            }
            if(offIndelMaxTadOffset>2){
                this.references.tads[tadIndex].offset3MidSvIndices.forEach((svIndex)=>{
                    indicesToGet.add(svIndex)
                });
            }
        });
        indicesToGet.forEach((svIndex)=>{
            let svItem=this.references.currentCohort.cohortData.midSizedSvs[svIndex];
            if(this.selectionManager.registeredSubcohorts.get(selectedSubcohortIndex).has(svItem.donorIndex)){
                this.MidsizeSvs.get(geneId).push(svItem);
            }
        });
        callback();
    }
    getMidsizedDirectHitSvs(tadIndices,geneId,selectedSubcohortIndex,callback){
        let indicesToGet=new Set();
        tadIndices.forEach((tadIndex)=>{
            this.references.tads[tadIndex].offset0MidSvIndices.forEach((svIndex)=>{
                indicesToGet.add(svIndex)
            });
        });
        indicesToGet.forEach((svIndex)=>{
            let svItem=this.references.currentCohort.cohortData.midSizedSvs[svIndex];
            if(this.selectionManager.registeredSubcohorts.get(selectedSubcohortIndex).has(svItem.donorIndex)){
                if(svItem.hasOwnProperty("directHits")){
                    if(svItem.directHits.has(geneId)){
                        this.MidsizeDirectHitSvs.get(geneId).push(svItem);
                    }
                }
            }
        });
        callback();
    }
}