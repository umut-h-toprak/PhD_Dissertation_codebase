import {queue as d3Xqueue} from "d3-queue";
import {VariantRecurrenceEntryGene} from "../variantRecurrenceEntries/VariantRecurrenceEntryGene";
import {VariantRecurrenceEntryCnv} from "../variantRecurrenceEntries/VariantRecurrenceEntryCnv";
import {VariantRecurrenceEntrySv} from "../variantRecurrenceEntries/VariantRecurrenceEntrySv";
import {VariantRecurrenceEntryIndel} from "../variantRecurrenceEntries/VariantRecurrenceEntryIndel";
import {VariantEntryIndel} from "../variants/VariantEntryIndel";
import {VariantEntrySv} from "../variants/VariantEntrySv";

export class CohortData {
    constructor(commonSettings,references,cohortMetadata){
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.Svs=[];
        this.VdjSvs=[];
        this.midSizedSvs=[];
        this.currentGeneMutRecurrence=[];
        this.currentSingleGeneRecurrence={};
        this.currentSmallVariants=new Map();
    }
    fetchRecData(mainCallback){
        let qR = d3Xqueue();
        qR.defer((callback)=>{this.fetchTadRecurrenceCnvData(callback);});
        qR.defer((callback)=>{this.fetchTadRecurrenceSvData(callback);});
        qR.defer((callback)=>{this.fetchTadRecurrenceIndelData(callback);});
        qR.awaitAll(()=>{
            mainCallback(null);
        });
    }
    fetchVarData(mainCallback){
        let qV = d3Xqueue();
        qV.defer((callback)=>{this.fetchSvData(callback);});
        qV.defer((callback)=>{this.fetchMidSizedSvData(callback);});
        qV.defer((callback)=>{this.fetchOffIndelData(callback);});
        qV.awaitAll(()=>{
            mainCallback(null);
        });
    }
    findSvsSimilarToNewVdjPool(masterVdjPool,currentVdjPool,svPool,references,grade){
        const vdjPoolSize=currentVdjPool.length;
        const svPoolSize=svPool.length;
        let newVdjPool=[];
        let newSvPool=[];
        let visitedSvIndices=new Set();
        for(let i=0;i<vdjPoolSize;++i){
            const existingVdj=currentVdjPool[i];
            const existingVdjDonorIndex=existingVdj.donorIndex;
            for(let j=0;j<svPoolSize;++j){
                if(visitedSvIndices.has(j)){
                    continue;
                }
                const candidateSv=svPool[j];
                const candidateSvDonorIndex=candidateSv.donorIndex;
                if(existingVdjDonorIndex!==candidateSvDonorIndex){
                    continue;
                }
                if(existingVdj.eventTypeIndex===6){
                    const [isSimilar,similaritySide]=existingVdj.svSimilarity(candidateSv,-1);
                    if(isSimilar){
                        newVdjPool.push(candidateSv);
                        newVdjPool[newVdjPool.length-1].transformToVdjSv(existingVdj,similaritySide,grade,references);
                        visitedSvIndices.add(j);
                    }
                }else if(existingVdj.eventTypeIndex===7){
                    const [isSimilar,similaritySide]=existingVdj.svSimilarity(candidateSv,1);
                    if(isSimilar){
                        newVdjPool.push(candidateSv);
                        newVdjPool[newVdjPool.length-1].transformToVdjSv(existingVdj,similaritySide,grade,references);
                        visitedSvIndices.add(j);
                    }
                }
            }
            masterVdjPool.push(existingVdj);
        }
        for(let j=0;j<svPoolSize;++j){
            if(!visitedSvIndices.has(j)){
                newSvPool.push(svPool[j])
            }
        }
        return [newVdjPool.length,newVdjPool,newSvPool];
    }
    fetchSvData(callback){
        if(this.commonSettings.wesMode){
            callback(null);
        }else{
            let thisRef=this;
            $.ajax({
                url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
                type: 'GET',
                dataType:'json',
                data: ({
                    cohort: thisRef.cohortMetadata.cohortName,
                    suffix: "cohortAllSvs",
                    columnsToSelect: "*",
                    keyColumn: "",
                    keysToSearchRaw:"*",
                }),
                success: function(data){
                    let tmpSvs=[];
                    let masterVdjPool=[];
                    data.forEach((x)=>{
                        const newSv = new VariantEntrySv(x,thisRef.references);
                        if(newSv.eventTypeVizIndex===6|| newSv.eventTypeVizIndex===7){
                            masterVdjPool.push(newSv);
                        }else{
                            tmpSvs.push(newSv);
                        }
                    });
                    let currentVdjPool=masterVdjPool.slice();
                    masterVdjPool.length=0;
                    if(currentVdjPool.length>0){
                        let grade=1;
                        while(true){
                            const [numHits,newVdjPool,newSvPool]=thisRef.findSvsSimilarToNewVdjPool(masterVdjPool,currentVdjPool,tmpSvs,thisRef.references,grade);
                            if(numHits===0){
                                break;
                            }else{
                                currentVdjPool=newVdjPool;
                                tmpSvs=newSvPool;
                                grade+=1;
                            }
                        }
                        thisRef.VdjSvs=masterVdjPool;
                        thisRef.Svs=tmpSvs;
                    }else{
                        thisRef.VdjSvs=[];
                        thisRef.Svs=tmpSvs;
                    }
                    if(thisRef.VdjSvs.length>0){
                        thisRef.cohortMetadata.metadataDataTypes.set("vdjTargets","multicategorical");
                        thisRef.cohortMetadata.metadataDataPossibleValues.set("vdjTargets",new Set());
                        thisRef.cohortMetadata.metadataDataPossibleValues.get("vdjTargets").add("NONE");
                        for(let i=0;i<thisRef.cohortMetadata.metadata.length;++i){
                            thisRef.cohortMetadata.metadata[i].vdjTargets=new Set();
                        }
                        thisRef.cohortMetadata.addPossibleMetadataColumn("vdjTargets");
                    }
                    if(thisRef.VdjSvs.length>0){
                        let prevIndexToNextIndex=new Map();
                        for(let i=0;i<thisRef.VdjSvs.length;++i){
                            prevIndexToNextIndex.set(thisRef.VdjSvs[i].svIndex,i);
                            thisRef.VdjSvs[i].svIndex=i;
                        }
                        for(let i=0;i<thisRef.VdjSvs.length;++i){
                            let vdjSv=thisRef.VdjSvs[i];
                            if(vdjSv.vdjGrade>0){
                                vdjSv.parentVdjIndex=prevIndexToNextIndex.get(vdjSv.parentVdjIndex);
                            }
                        }
                        for(let i=0;i<thisRef.VdjSvs.length;++i){
                            let vdjSv=thisRef.VdjSvs[i];
                            let parentIndices=[];
                            let parentIndex=vdjSv.parentVdjIndex;
                            while(parentIndex!==-1){
                                parentIndices.push(parentIndex);
                                let parentVdj=thisRef.VdjSvs[parentIndex];
                                parentIndex=parentVdj.parentVdjIndex;
                            }
                            const donorIndex = thisRef.VdjSvs[i].donorIndex;
                            const svIndex = thisRef.VdjSvs[i].svIndex;
                            vdjSv.tadIndicesOffset0.forEach((tadIndex)=>{
                                thisRef.references.tads[tadIndex].cytobandIndices.forEach((cytobandIndex)=>{
                                    thisRef.references.cytobands[cytobandIndex].vdjSvDonorContributorIndices.add(donorIndex);
                                });
                                thisRef.references.tads[tadIndex].offset0VdjSvIndices.push(svIndex);
                                parentIndices.forEach((parentIndexCurrent)=>{
                                    thisRef.references.tads[tadIndex].offset0VdjSvIndices.push(parentIndexCurrent);
                                });
                                const tmpRec=new Set([...thisRef.references.tads[tadIndex].svDonorContributorIndicesOffset0,...thisRef.references.tads[tadIndex].svDonorContributorIndicesOffset1]).size;
                                if(tmpRec>vdjSv.maxRecurrence){
                                    thisRef.VdjSvs[i].maxRecurrence=tmpRec;
                                }
                            });
                            vdjSv.tadIndicesOffset1.forEach((tadIndex)=>{
                                thisRef.references.tads[tadIndex].offset1VdjSvIndices.push(svIndex);
                                parentIndices.forEach((parentIndexCurrent)=>{
                                    thisRef.references.tads[tadIndex].offset1VdjSvIndices.push(parentIndexCurrent);
                                });
                                const tmpRec=new Set([...thisRef.references.tads[tadIndex].svDonorContributorIndicesOffset0,...thisRef.references.tads[tadIndex].svDonorContributorIndicesOffset1]).size;
                                if(tmpRec>vdjSv.maxRecurrence){
                                    thisRef.VdjSvs[i].maxRecurrence=tmpRec;
                                }
                            });
                            vdjSv.tadIndicesOffset2.forEach((tadIndex)=>{
                                thisRef.references.tads[tadIndex].offset2VdjSvIndices.push(svIndex);
                                parentIndices.forEach((parentIndexCurrent)=>{
                                    thisRef.references.tads[tadIndex].offset2VdjSvIndices.push(parentIndexCurrent);
                                });
                            });
                            vdjSv.tadIndicesOffset3.forEach((tadIndex)=>{
                                thisRef.references.tads[tadIndex].offset3VdjSvIndices.push(svIndex);
                                parentIndices.forEach((parentIndexCurrent)=>{
                                    thisRef.references.tads[tadIndex].offset3VdjSvIndices.push(parentIndexCurrent);
                                });
                            });
                            vdjSv.vdjTargets.forEach((vdjTarget)=>{
                                const targetName=thisRef.references.genes.get(vdjTarget).geneName;
                                thisRef.cohortMetadata.metadataDataPossibleValues.get("vdjTargets").add(targetName);
                                thisRef.cohortMetadata.metadata[donorIndex].vdjTargets.add(targetName);
                            })
                        }
                        for(let i=0;i<thisRef.cohortMetadata.metadata.length;++i){
                            let newVal=Array.from(thisRef.cohortMetadata.metadata[i].vdjTargets).sort().join(';');
                            if(thisRef.cohortMetadata.metadata[i].vdjTargets.size===0){
                                newVal="NONE";
                            }
                            thisRef.cohortMetadata.metadata[i].vdjTargets=newVal;
                        }
                        thisRef.cohortMetadata.refreshMetadata();
                    }
                    for(let i=0;i<thisRef.Svs.length;++i){
                        thisRef.Svs[i].svIndex=i;
                        thisRef.Svs[i].tadIndicesOffset0.forEach((x)=>{
                            thisRef.references.tads[x].offset0SvIndices.push(thisRef.Svs[i].svIndex);
                            const tmpRec=new Set([...thisRef.references.tads[x].svDonorContributorIndicesOffset0,...thisRef.references.tads[x].svDonorContributorIndicesOffset1]).size;
                            if(tmpRec>thisRef.Svs[i].maxRecurrence){
                                thisRef.Svs[i].maxRecurrence=tmpRec;
                            }
                        });
                        thisRef.Svs[i].tadIndicesOffset1.forEach((x)=>{
                            thisRef.references.tads[x].offset1SvIndices.push(thisRef.Svs[i].svIndex);
                            const tmpRec=new Set([...thisRef.references.tads[x].svDonorContributorIndicesOffset0,...thisRef.references.tads[x].svDonorContributorIndicesOffset1]).size;
                            if(tmpRec>thisRef.Svs[i].maxRecurrence){
                                thisRef.Svs[i].maxRecurrence=tmpRec;
                            }
                        });
                        thisRef.Svs[i].tadIndicesOffset2.forEach((x)=>{
                            thisRef.references.tads[x].offset2SvIndices.push(thisRef.Svs[i].svIndex);
                        });
                        thisRef.Svs[i].tadIndicesOffset3.forEach((x)=>{
                            thisRef.references.tads[x].offset3SvIndices.push(thisRef.Svs[i].svIndex);
                        });
                    }
                    callback(null);
                },
                error: function (err) {
                    console.error(err);
                }
            });
        }

    }
    fetchMidSizedSvData(callback){
        if(this.commonSettings.wesMode){
            callback(null);
        }else{
            let thisRef=this;
            $.ajax({
                url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
                type: 'GET',
                dataType:'json',
                data: ({
                    cohort: thisRef.cohortMetadata.cohortName,
                    suffix: "cohortAllSvsMidSize",
                    columnsToSelect: "*",
                    keyColumn: "",
                    keysToSearchRaw:"*",
                }),
                success: function(data){
                    data.forEach((x)=>{
                        let newSv = new VariantEntrySv(x,thisRef.references);
                        newSv.tadIndicesOffset0.forEach((x)=>{
                            thisRef.references.tads[x].offset0MidSvIndices.push(newSv.svIndex);
                            let tmpRec=new Set([...thisRef.references.tads[x].indelDonorContributorIndicesOffset0,...thisRef.references.tads[x].indelDonorContributorIndicesOffset1]).size;
                            if(tmpRec>newSv.maxRecurrence){
                                newSv.maxRecurrence=tmpRec;
                            }
                        });
                        newSv.tadIndicesOffset1.forEach((x)=>{
                            thisRef.references.tads[x].offset1MidSvIndices.push(newSv.svIndex);
                            let tmpRec=new Set([...thisRef.references.tads[x].indelDonorContributorIndicesOffset0,...thisRef.references.tads[x].indelDonorContributorIndicesOffset1]).size;
                            if(tmpRec>newSv.maxRecurrence){
                                newSv.maxRecurrence=tmpRec;
                            }
                        });
                        newSv.tadIndicesOffset2.forEach((x)=>{
                            thisRef.references.tads[x].offset2MidSvIndices.push(newSv.svIndex);
                        });
                        newSv.tadIndicesOffset3.forEach((x)=>{
                            thisRef.references.tads[x].offset3MidSvIndices.push(newSv.svIndex);
                        });
                        thisRef.midSizedSvs.push(newSv);
                    });
                    callback(null);
                },
                error: function (err) {
                    console.error(err);
                }
            });
        }
    }
    fetchOffIndelData(callback){
        if(this.commonSettings.wesMode){
            callback(null);
        }else{
            let thisRef=this;
            $.ajax({
                url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
                type: 'GET',
                dataType:'json',
                data: ({
                    cohort: thisRef.cohortMetadata.cohortName,
                    suffix: "cohortAllIndels",
                    columnsToSelect: "*",
                    keyColumn: "",
                    keysToSearchRaw:"*",
                }),
                success: function(data){
                    data.forEach((x)=>{
                        let newIndel = new VariantEntryIndel(x,thisRef.references);
                        if(newIndel.hasOwnProperty("tadIndicesOffset0")){
                            newIndel.tadIndicesOffset0.forEach((x)=>{
                                thisRef.references.tads[x].offset0IndelIndices.push(newIndel.indelIndex);
                            });
                        }
                        if(newIndel.hasOwnProperty("tadIndicesOffset1")){
                            newIndel.tadIndicesOffset1.forEach((x)=>{
                                thisRef.references.tads[x].offset1IndelIndices.push(newIndel.indelIndex);
                            });
                        }
                        if(newIndel.hasOwnProperty("tadIndicesOffset2")){
                            newIndel.tadIndicesOffset2.forEach((x)=>{
                                thisRef.references.tads[x].offset2IndelIndices.push(newIndel.indelIndex);
                            });
                        }
                        if(newIndel.hasOwnProperty("tadIndicesOffset3")){
                            newIndel.tadIndicesOffset3.forEach((x)=>{
                                thisRef.references.tads[x].offset3IndelIndices.push(newIndel.indelIndex);
                            });
                        }

                    });
                    callback(null);
                },
                error: function (err) {
                    console.error(err);
                }
            });
        }
    }
    fetchTadRecurrenceSvData(callback){
        if(this.commonSettings.wesMode){
            callback(null);
        }else{
            let thisRef=this;
            $.ajax({
                url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
                type: 'GET',
                dataType:'json',
                data: ({
                    cohort: thisRef.cohortMetadata.cohortName,
                    suffix: "tadRecurrenceSv",
                    columnsToSelect: "*",
                    keyColumn: "",
                    keysToSearchRaw:"*",
                }),
                success: function(data){
                    data.forEach((x)=>{
                        let newRec = new VariantRecurrenceEntrySv(x);
                        newRec.offset0donors.forEach((x)=>{
                            thisRef.references.tads[newRec.tadIndex].svDonorContributorIndicesOffset0.add(x);
                        });
                        newRec.offset1donors.forEach((x)=>{
                            thisRef.references.tads[newRec.tadIndex].svDonorContributorIndicesOffset1.add(x);
                        });
                        newRec.offset2donors.forEach((x)=>{
                            thisRef.references.tads[newRec.tadIndex].svDonorContributorIndicesOffset2.add(x);
                        });
                        newRec.offset3donors.forEach((x)=>{
                            thisRef.references.tads[newRec.tadIndex].svDonorContributorIndicesOffset3.add(x);
                        });
                    });
                    callback(null);
                },
                error: function (err) {
                    console.error(err);
                }
            });
        }
    }
    fetchTadRecurrenceCnvData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: "tadRecurrenceCnv",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let newRec = new VariantRecurrenceEntryCnv(x);
                    newRec.lossDonors.forEach((x)=>{
                        thisRef.references.tads[newRec.tadIndex].cnvLossDonorContributorIndices.add(x);
                    });
                    newRec.gainDonors.forEach((x)=>{
                        thisRef.references.tads[newRec.tadIndex].cnvGainDonorContributorIndices.add(x);
                    });
                    newRec.lohDonors.forEach((x)=>{
                        thisRef.references.tads[newRec.tadIndex].lohDonorContributorIndices.add(x);
                        if(!(thisRef.references.tads[newRec.tadIndex].cnvGainDonorContributorIndices.has(x)||thisRef.references.tads[newRec.tadIndex].cnvLossDonorContributorIndices.has(x))){
                            thisRef.references.tads[newRec.tadIndex].cnnLohDonorContributorIndices.add(x);
                        }
                    });
                });
                callback(null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    assessChromosomeArmLevelCnvEffects(){
        for(let i=1;i<this.references.chromosomeArms.length;++i){
            if(this.references.chromosomeArms[i].chromosomeIndex===24){
                break;
            }
            this.references.chromosomeArms[i].assessChromosomeArmLevelCnvEffects(this.references);
        }
    }
    assessFocalCnvEffects(){
        for(let i=1;i<this.references.tads.length;++i){
            let tad = this.references.tads[i];
            if(tad.chromosomeIndex===24){
                break;
            }
            let chromosomeArm=this.references.chromosomeArms[this.references.cytobands[tad.cytobandIndices[0]].chromosomeArmIndex];
            tad.cnvLossFocalDonorContributorIndices=new Set([...tad.cnvLossDonorContributorIndices].filter(x => !chromosomeArm.cnvLossDonorContributorIndices.has(x)));
            tad.cnvGainFocalDonorContributorIndices=new Set([...tad.cnvGainDonorContributorIndices].filter(x => !chromosomeArm.cnvGainDonorContributorIndices.has(x)));
            tad.lohFocalDonorContributorIndices=new Set([...tad.lohDonorContributorIndices].filter(x => !chromosomeArm.lohDonorContributorIndices.has(x)));
            tad.cnnLohFocalDonorContributorIndices=new Set([...tad.cnnLohDonorContributorIndices].filter(x => !chromosomeArm.cnnLohDonorContributorIndices.has(x)));
        }
    }
    propagateTadCnvsToCytobands(){
        for(let i=0;i<this.references.cytobands.length;++i){
            let cytoband = this.references.cytobands[i];
            if(cytoband.chromosomeIndex===24){
                break;
            }
            for(let j=cytoband.firstTadIndex;j<=cytoband.lastTadIndex;++j){
                let tad = this.references.tads[j];
                tad.cnvLossDonorContributorIndices.forEach((donorIndex)=>{
                    cytoband.cnvLossDonorContributorIndices.add(donorIndex);
                });
                tad.cnvGainDonorContributorIndices.forEach((donorIndex)=>{
                    cytoband.cnvGainDonorContributorIndices.add(donorIndex);
                });
                tad.lohDonorContributorIndices.forEach((donorIndex)=>{
                    cytoband.lohDonorContributorIndices.add(donorIndex);
                });
                tad.cnnLohDonorContributorIndices.forEach((donorIndex)=>{
                    cytoband.cnnLohDonorContributorIndices.add(donorIndex);
                });
                tad.cnvLossFocalDonorContributorIndices.forEach((donorIndex)=>{
                    cytoband.cnvLossFocalDonorContributorIndices.add(donorIndex);
                });
                tad.cnvGainFocalDonorContributorIndices.forEach((donorIndex)=>{
                    cytoband.cnvGainFocalDonorContributorIndices.add(donorIndex);
                });
                tad.lohFocalDonorContributorIndices.forEach((donorIndex)=>{
                    cytoband.lohFocalDonorContributorIndices.add(donorIndex);
                });
                tad.cnnLohFocalDonorContributorIndices.forEach((donorIndex)=>{
                    cytoband.cnnLohFocalDonorContributorIndices.add(donorIndex);
                });
            }
        }
    }
    propagateTadSvsToCytobands(){
        for(let i=1;i<this.references.cytobands.length;++i){
            let cytoband = this.references.cytobands[i];
            if(cytoband.chromosomeIndex===24){
                break;
            }
            for(let j=cytoband.firstTadIndex;j<=cytoband.lastTadIndex;++j){
                this.references.tads[j].svDonorContributorIndicesOffset0.forEach((donorIndex)=>{
                    this.references.cytobands[i].svDonorContributorIndices.add(donorIndex);
                });
            }
        }
    }
    fetchTadRecurrenceIndelData(callback){
        if(this.commonSettings.wesMode){
            callback(null);
        }else{
            let thisRef=this;
            $.ajax({
                url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
                type: 'GET',
                dataType:'json',
                data: ({
                    cohort: thisRef.cohortMetadata.cohortName,
                    suffix: "tadRecurrenceIndel",
                    columnsToSelect: "*",
                    keyColumn: "",
                    keysToSearchRaw:"*",
                }),
                success: function(data){
                    data.forEach((x)=>{
                        let newRec = new VariantRecurrenceEntryIndel(x);
                        newRec.offset0donors.forEach((x)=>{
                            thisRef.references.tads[newRec.tadIndex].indelDonorContributorIndicesOffset0.add(x);
                        });
                        newRec.offset1donors.forEach((x)=>{
                            thisRef.references.tads[newRec.tadIndex].indelDonorContributorIndicesOffset1.add(x);
                        });
                        newRec.offset2donors.forEach((x)=>{
                            thisRef.references.tads[newRec.tadIndex].indelDonorContributorIndicesOffset2.add(x);
                        });
                        newRec.offset3donors.forEach((x)=>{
                            thisRef.references.tads[newRec.tadIndex].indelDonorContributorIndicesOffset3.add(x);
                        });
                    });
                    callback(null);
                },
                error: function (err) {
                    console.error(err);
                }
            });
        }
    }
    fetchCurrentGeneVariantData(callback){
        this.currentGeneMutRecurrence.length=0;
        let searchColPre=["\`Gene"].concat(Array.from(this.commonSettings.currentGeneMutTypes).sort().map(String));
        let searchCol=searchColPre.join('\`, \`')+"\`";
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: "geneRecurrence",
                columnsToSelect: searchCol,
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let geneId=parseInt(x.Gene);
                    if(thisRef.references.genes.has(geneId)){
                        let tmpRec = new VariantRecurrenceEntryGene(x,thisRef.commonSettings.currentGeneMutTypes);
                        if(tmpRec.isValid){
                            let tmpEntry=thisRef.references.genes.get(geneId);
                            tmpEntry.addCurrentDonorContributions(tmpRec.contributions);
                            thisRef.currentGeneMutRecurrence.push(tmpEntry);
                        }
                    }
                });
                callback(null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchSingleGeneRecurrenceData(callback,geneId){
        this.currentSingleGeneRecurrence={};
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: "geneRecurrence",
                columnsToSelect: "*",
                keyColumn: "Gene",
                keysToSearchRaw: geneId,
            }),
            success: function(data){
                thisRef.currentSingleGeneRecurrence=data[0];
                callback(null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
}