import {
    scaleLinear as d3XscaleLinear,
    axisBottom as d3XaxisBottom,
    axisLeft as d3XaxisLeft,
    axisRight as d3XaxisRight,
    path as d3Xpath,
    select as d3Xselect,
    event as d3Xevent,
    arc as d3Xarc,
    line as d3Xline,
    symbol as d3Xsymbol,
    symbols as d3Xsymbols,
} from "d3";
import {queue as d3Xqueue } from 'd3-queue';
import {SingleDonorVariantContribution} from "./SingleDonorVariantContribution";
import {VariantFetcher} from "../dataFetchersAndStorage/VariantFetcher";
import {clearAnnotations, saveSvg, switchElements} from "../Utils";
export class SinglePhenotypeExpression {
    constructor(commonSettings,references,cohortMetadata,selectionManager,volcanoMode,expressionPhenotype,bioId,bioId2,svMaxTadOffset,offIndelMaxTadOffset,group1Index,group2Index,fontManager,singleDonorVariantContributionsIn=null,singleDonorVariantContributions2In=null,customMagFactor=1){
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.fontManager=fontManager;
        this.volcanoMode=volcanoMode;
        this.svMaxTadOffset=svMaxTadOffset;
        this.offIndelMaxTadOffset=offIndelMaxTadOffset;
        this.blacklistedVariantTypes=new Set();
        this.currentRelevantVariants=[];
        this.currentRelevantVariantDescriptionRoot="";
        this.currentRelevantVariantIndex=0;
        this.plotSupportGroup=null;
        this.determineBlacklistedVariants();
        this.bioId=bioId;
        this.bioId2=bioId2;
        this.geneIds=[bioId];
        this.geneIds2=[bioId2];
        this.expressionPhenotype=expressionPhenotype;
        this.circleClassNameAnchor=`${this.expressionPhenotype}ExpressionCirclesAnchor`;
        this.circleClassNameTarget=`${this.expressionPhenotype}ExpressionCirclesTarget`;
        this.circleGroupNameAnchor=`${this.expressionPhenotype}CircleGroupAnchor`;
        this.circleGroupNameTarget=`${this.expressionPhenotype}CircleGroupTarget`;
        this.plotSupportGroupName=`${this.expressionPhenotype}PlotSupportGroup`;
        this.expressionFrame=`${this.expressionPhenotype}ExpressionFrame`;
        this.targetLocationID=`${this.expressionPhenotype}ExpressionContent`;

        this.group1Index=group1Index;
        this.group2Index=group2Index;
        this.uniqueGroup1Donors=new Set([...this.selectionManager.registeredSubcohorts.get(this.group1Index)].filter(x => !this.selectionManager.registeredSubcohorts.get(this.group2Index).has(x)));
        this.uniqueGroup2Donors=new Set([...this.selectionManager.registeredSubcohorts.get(this.group2Index)].filter(x => !this.selectionManager.registeredSubcohorts.get(this.group1Index).has(x)));
        if(this.uniqueGroup1Donors.size===0 && this.uniqueGroup2Donors.size!==0){
            this.uniqueGroup1Donors=this.selectionManager.registeredSubcohorts.get(this.group1Index);
        }else if(this.uniqueGroup1Donors.size!==0 && this.uniqueGroup2Donors.size===0){
            this.uniqueGroup2Donors=this.selectionManager.registeredSubcohorts.get(this.group2Index);
        }
        if(this.expressionPhenotype==="rppa"){
            this.geneIds=this.references.rppaAntibodies[bioId].geneIds;
            if(bioId2!==null){
                this.geneIds2=this.references.rppaAntibodies[bioId2].geneIds;
            }
        }
        this.numDonors=this.cohortMetadata[`${this.expressionPhenotype}ExpressionAvailable`];
        this.magFactor=1.25;
        if(this.numDonors > 100){
            this.magFactor = 0.5;
        }else if(this.numDonors>50){
            this.magFactor = 0.75;
        }
        this.magFactor*=customMagFactor;
        this.baseRadius = 7.25 * this.magFactor;
        this.tracerStroke=3 * this.magFactor;

        this.currentWidth = $('#mainSide').width();
        this.viewBoxChunks=[-this.currentWidth*0.1,-this.currentWidth*0.00005,this.currentWidth*1.2,this.currentWidth*1.2];
        this.svgSize="100%";
        this.svg = null;
        this.targetWidth = null;
        this.xScale = null;
        this.yScale = null;
        this.yScale2 = null;
        if(this.volcanoMode){
            this.volcanoModeDefinitions();
        }
        this.viewBox=this.viewBoxChunks.map(x=>x.toString()).join(" ");
        $(`#${this.targetLocationID}`).empty();
        this.maxExpression = 0;
        this.minExpression = 1e10;
        this.maxExpression2 = 0;
        this.minExpression2 = 1e10;
        this.expressions=new Map();
        this.expressions2=new Map();
        this.variantExistence=new Map();
        this.variantExistence2=new Map();
        this.singleDonorVariantContributions=[];
        this.singleDonorVariantContributionsBg=[];

        this.singleDonorVariantContributions2=[];

        this.sortingHelperMapper=new Map();
        this.xAxisHelper=[];
        this.variantFetcher=null;
        this.variantFetcher2=null;
        let q=d3Xqueue();
        if(!singleDonorVariantContributionsIn && bioId!==-1){
            q.defer((callback)=>{this.getExpressionData(true,callback)});
            q.defer((callback)=>{this.getVariantExistenceData(true,callback)});
        }else{
            if(bioId===-1){
                this.singleDonorVariantContributions=this.generateContributionObjects(null,null,false,true);
                this.singleDonorVariantContributions.forEach((singleDonorVariantContribution)=>{
                    if(singleDonorVariantContribution.phenotypeExpression>this.maxExpression){
                        this.maxExpression=singleDonorVariantContribution.phenotypeExpression
                    }
                    if(singleDonorVariantContribution.phenotypeExpression<this.minExpression){
                        this.minExpression=singleDonorVariantContribution.phenotypeExpression
                    }
                });
            }else{
                singleDonorVariantContributionsIn.forEach((singleDonorVariantContribution)=>{
                    this.singleDonorVariantContributions.push(singleDonorVariantContribution);
                    if(singleDonorVariantContribution.phenotypeExpression>this.maxExpression){
                        this.maxExpression=singleDonorVariantContribution.phenotypeExpression
                    }
                    if(singleDonorVariantContribution.phenotypeExpression<this.minExpression){
                        this.minExpression=singleDonorVariantContribution.phenotypeExpression
                    }
                });
            }
        }
        if(!this.volcanoMode && bioId!==-1){
            this.variantFetcher=new VariantFetcher(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.geneIds);
            q.defer((callback)=>{
                this.variantFetcher.getVariantDataForPhenotypePlotsFromGeneId(this.svMaxTadOffset,this.offIndelMaxTadOffset, callback)
            });
        }

        if(bioId2!==null){
            if(!singleDonorVariantContributions2In && bioId2!==-1){
                q.defer((callback)=>{this.getExpressionData(false,callback)});
                q.defer((callback)=>{this.getVariantExistenceData(false,callback)});
            }else{
                if(bioId2===-1){
                    this.singleDonorVariantContributions2=this.generateContributionObjects(null,null,true,true);
                    this.singleDonorVariantContributions2.forEach((singleDonorVariantContribution)=>{
                        if(singleDonorVariantContribution.phenotypeExpression>this.maxExpression2){
                            this.maxExpression2=singleDonorVariantContribution.phenotypeExpression
                        }
                        if(singleDonorVariantContribution.phenotypeExpression<this.minExpression2){
                            this.minExpression2=singleDonorVariantContribution.phenotypeExpression
                        }
                    });
                }else{
                    singleDonorVariantContributions2In.forEach((singleDonorVariantContribution)=>{
                        this.singleDonorVariantContributions2.push(singleDonorVariantContribution);
                        if(singleDonorVariantContribution.phenotypeExpression>this.maxExpression2){
                            this.maxExpression2=singleDonorVariantContribution.phenotypeExpression
                        }
                        if(singleDonorVariantContribution.phenotypeExpression<this.minExpression2){
                            this.minExpression2=singleDonorVariantContribution.phenotypeExpression
                        }
                    });
                }
            }
            if(!this.volcanoMode  && bioId2!==-1){
                this.variantFetcher2=new VariantFetcher(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.geneIds2);
                q.defer((callback)=>{
                    this.variantFetcher2.getVariantDataForPhenotypePlotsFromGeneId(this.svMaxTadOffset,this.offIndelMaxTadOffset, callback)
                });
            }
        }
        let thisRef=this;
        q.awaitAll(function(error){
            // console.log(error);
            thisRef.preparePlot();
            if(!singleDonorVariantContributionsIn&&bioId!==-1){
                if(thisRef.expressions.size===0){
                    return;
                }
                if(bioId2!==null){
                    if(thisRef.expressions2.size===0){
                        return;
                    }
                }
                thisRef.singleDonorVariantContributions=thisRef.generateContributionObjects(thisRef.expressions,thisRef.variantExistence,false,bioId===null);
            }
            for(let i=0; i< thisRef.singleDonorVariantContributions.length;++i){
                thisRef.singleDonorVariantContributions[i].calculatePlottingParameters(
                    thisRef.references.variantTypes[thisRef.singleDonorVariantContributions[i].variantType],
                    thisRef.baseRadius,
                    thisRef.xScale,
                    thisRef.yScale
                );
            }
            if(bioId2!==null){
                if(!singleDonorVariantContributions2In&&bioId2!==-1){
                    thisRef.singleDonorVariantContributions2=thisRef.generateContributionObjects(thisRef.expressions2,thisRef.variantExistence2,true,bioId2===null);
                }
                for(let i=0; i< thisRef.singleDonorVariantContributions2.length;++i){
                    thisRef.singleDonorVariantContributions2[i].calculatePlottingParameters(
                        thisRef.references.variantTypes[thisRef.singleDonorVariantContributions2[i].variantType],
                        thisRef.baseRadius,
                        thisRef.xScale,
                        thisRef.yScale2
                    );
                }
            }
            thisRef.drawPlotSupporters();
            thisRef.plotSingleExpression();
        });
    }
    convertToFullMode(){
        this.references.currentCohort.singlePhenotypePlotManager.reset();
        this.references.currentCohort.singlePhenotypePlotManager.setGroup1(this.group1Index);
        this.references.currentCohort.singlePhenotypePlotManager.setGroup2(this.group2Index);
        this.references.currentCohort.singlePhenotypePlotManager.setSvMaxTadOffset(this.svMaxTadOffset);
        this.references.currentCohort.singlePhenotypePlotManager.setOffIndelMaxTadOffset(this.offIndelMaxTadOffset);
        this.references.currentCohort.singlePhenotypePlotManager.setSingleDonorVariantContributions(this.singleDonorVariantContributions);
        this.references.currentCohort.singlePhenotypePlotManager.setSingleDonorVariantContributions2(this.singleDonorVariantContributions2);
        $('#phenotypeExpressionContentPane').parent().addClass('active').siblings().removeClass('active');
        $('#phenotypeExpressionContent').addClass('active').siblings().removeClass('active');
        switchElements([
            "volcanoControls",
            "selectorControlsCollapseControl",
            "volcanoSpecificGeneSelectorControls",
            "geneSelectorMarkers",
            "cytobandSelectorMarkers",
            "gotoGeneVariants",
            "gotoCytoband",
            "geneSelectorControlsForMarkedGenesVolcanoSpecific",
            "volcanoSpecificCytobandSelectorControls",
        ],[
            "svgDownloader",
            "svDescriptionPaneControl",
            "midSizedSvDescriptionPaneControl",
            "vdjSvDescriptionPaneControl",
            "smallVariantDescriptionPaneControl",
            "selectorControlsCollapseControl",
            "singlePhenotypeExpressionControls",
            "singlePhenotypeViewSpecificCytobandSelectorControls",
            "singlePhenotypeViewSpecificGeneSelectorControls",
            "singlePhenotypeViewSpecificAntibodySelectorControls",
        ]);
        this.fontManager.setAvailableFontSettings("singlePhenotypeExpression");
        $('.nav-tabs a[href="#controlsPane"]').tab("show");

        if(this.expressionPhenotype==="gene"){
            this.references.currentCohort.singlePhenotypePlotManager.geneId=this.bioId;
            this.references.currentCohort.singlePhenotypePlotManager.gene2Id=this.bioId2;
            this.references.currentCohort.singlePhenotypePlotManager.plotSingleGeneExpression();
        }
        else if(this.expressionPhenotype==="rppa"){
            this.references.currentCohort.singlePhenotypePlotManager.rppaId=this.bioId;
            this.references.currentCohort.singlePhenotypePlotManager.rppa2Id=this.bioId2;
            this.references.currentCohort.singlePhenotypePlotManager.plotSingleRppaExpression();
        }
    }
    determineBlacklistedVariants(){
        this.blacklistedVariantTypes=new Set([20,21,27,28,49,50,51,55,56,57,58,59]);
        if(this.svMaxTadOffset===2){
            this.blacklistedVariantTypes.add(47);
        }else if(this.svMaxTadOffset===1){
            this.blacklistedVariantTypes.add(46);
            this.blacklistedVariantTypes.add(47);
        }else if(this.svMaxTadOffset===0){
            this.blacklistedVariantTypes.add(45);
            this.blacklistedVariantTypes.add(46);
            this.blacklistedVariantTypes.add(47);
        }else if(this.svMaxTadOffset===-1){
            this.blacklistedVariantTypes.add(44);
            this.blacklistedVariantTypes.add(45);
            this.blacklistedVariantTypes.add(46);
            this.blacklistedVariantTypes.add(47);
        }
        if(this.offIndelMaxTadOffset===2){
            this.blacklistedVariantTypes.add(19);
        }else if(this.offIndelMaxTadOffset===1){
            this.blacklistedVariantTypes.add(18);
            this.blacklistedVariantTypes.add(19);
        }else if(this.offIndelMaxTadOffset===0){
            this.blacklistedVariantTypes.add(17);
            this.blacklistedVariantTypes.add(18);
            this.blacklistedVariantTypes.add(19);
        }else if(this.offIndelMaxTadOffset===-1){
            this.blacklistedVariantTypes.add(16);
            this.blacklistedVariantTypes.add(17);
            this.blacklistedVariantTypes.add(18);
            this.blacklistedVariantTypes.add(19);
        }
    }
    volcanoModeDefinitions(){
        this.expressionFrame=`${this.expressionFrame}Volcano`;
        this.circleClassNameAnchor=`${this.circleClassNameAnchor}Volcano`;
        this.circleClassNameTarget=`${this.circleClassNameTarget}Volcano`;
        this.circleGroupNameAnchor=`${this.circleGroupNameAnchor}Volcano`;
        this.circleGroupNameTarget=`${this.circleGroupNameTarget}Volcano`;
        this.plotSupportGroupName=`${this.plotSupportGroupName}Volcano`;
        this.targetLocationID=`${this.targetLocationID}Volcano`;
        this.currentWidth=$(`#rightSide`).width();
        this.viewBoxChunks=[-this.currentWidth*0.04,-this.currentWidth*0.03,this.currentWidth*0.93,this.currentWidth*1.1];
        this.baseRadius = this.baseRadius * 0.4;
        this.tracerStroke=this.tracerStroke * 0.4;
    }
    getExpressionData(firstGene,callback){
        let thisRef=this;
        let truePhenotype=this.expressionPhenotype;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: `${thisRef.expressionPhenotype}Expressions`,
                columnsToSelect: "*",
                keyColumn: truePhenotype,
                keysToSearchRaw: firstGene ? thisRef.bioId: thisRef.bioId2,
            }),
            error: function(err){
                console.error(err);
            },
            success: function(rawData){
                if(rawData.length>0){
                    let data=rawData[0];
                    if(firstGene){
                        Object.keys(data).forEach(function(key,index) {
                            if(key!==truePhenotype && key!=="varianceRank"){
                                let donorIndex=parseInt(key);
                                let expression=+data[key];
                                thisRef.expressions.set(donorIndex,expression);
                                if(expression>thisRef.maxExpression){
                                    thisRef.maxExpression=expression;
                                }
                                if(expression<thisRef.minExpression){
                                    thisRef.minExpression=expression;
                                }
                            }
                        });
                    }else{
                        Object.keys(data).forEach(function(key,index) {
                            if(key!==truePhenotype && key!=="varianceRank"){
                                let donorIndex=parseInt(key);
                                let expression=+data[key];
                                thisRef.expressions2.set(donorIndex,expression);
                                if(expression>thisRef.maxExpression2){
                                    thisRef.maxExpression2=expression;
                                }
                                if(expression<thisRef.minExpression2){
                                    thisRef.minExpression2=expression;
                                }
                            }
                        });
                    }
                }
                callback()
            }
        });
    }
    getVariantExistenceData(firstGene,callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                // tableToSearch: thisRef.cohortMetadata.geneRecurrenceTable,
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: "geneRecurrence",
                columnsToSelect: "*",
                keyColumn: "Gene",
                keysToSearchRaw: firstGene ? thisRef.geneIds.join(','): thisRef.geneIds2.join(','),
            }),
            error: function(err){
                console.error(err);
            },
            success: function(data){
                data.forEach((geneData)=>{
                    if(firstGene){
                        Object.keys(geneData).forEach(function(key,index) {
                            if(key!=="Gene"){
                                let variantTypeIndex=parseInt(key);
                                if(!thisRef.blacklistedVariantTypes.has(variantTypeIndex)){
                                    if(geneData[key]!==""){
                                        let donors=geneData[key].split(',').map((d)=>{return parseInt(d);});
                                        donors.forEach((donor)=>{
                                            if(!thisRef.variantExistence.has(donor)){
                                                thisRef.variantExistence.set(donor,[]);
                                            }
                                            thisRef.variantExistence.get(donor).push(variantTypeIndex);
                                        });
                                    }
                                }
                            }
                        });
                    }else{
                        Object.keys(geneData).forEach(function(key,index) {
                            if(key!=="Gene"){
                                let variantTypeIndex=parseInt(key);
                                if(!thisRef.blacklistedVariantTypes.has(variantTypeIndex)){
                                    if(geneData[key]!==""){
                                        let donors=geneData[key].split(',').map((d)=>{return parseInt(d);});
                                        donors.forEach((donor)=>{
                                            if(!thisRef.variantExistence2.has(donor)){
                                                thisRef.variantExistence2.set(donor,[]);
                                            }
                                            thisRef.variantExistence2.get(donor).push(variantTypeIndex);
                                        });
                                    }
                                }
                            }
                        });
                    }

                });
                callback()
            }
        });
    }
    generateContributionObjects(expressions,variantExistence,secondPhenotypeMode,nonGeneMode){
        let singleDonorVariantContributions=[];
        let sortingHelper=[];
        if(!nonGeneMode){
            if(expressions.size===0){
                return;
            }
            expressions.forEach((expression,donor,x)=>{
                sortingHelper.push([expression,donor]);
                if(this.cohortMetadata.anyVariantAvailableDonors.has(donor)){
                    if(variantExistence.has(donor)){
                        variantExistence.get(donor).forEach((variantType)=>{
                            singleDonorVariantContributions.push(new SingleDonorVariantContribution(donor,variantType,expression));
                        });
                    }
                    singleDonorVariantContributions.push(new SingleDonorVariantContribution(donor,63,expression));
                }else{
                    singleDonorVariantContributions.push(new SingleDonorVariantContribution(donor,62,expression));
                }
            });
        }else{
            let expressions=this.references.genes.get(-1).expressions;
            if(expressions.size===0){
                return;
            }
            expressions.forEach((expression,donor,x)=>{
                sortingHelper.push([expression,donor]);
            });
            singleDonorVariantContributions=this.references.genes.get(-1).singleDonorVariantContributions;
        }
        if(!secondPhenotypeMode){
            sortingHelper=sortingHelper.sort(function(a, b) {
                if (a[0] < b[0]) {
                    return -1;
                }
                if (a[0] > b[0]) {
                    return 1;
                }
                if (a[1] < b[1]) {
                    return -1;
                }
                if (a[1] > b[1]) {
                    return 1;
                }
                return -1;
            });
            for(let i=0; i< sortingHelper.length;++i){
                this.sortingHelperMapper.set(sortingHelper[i][1],i);
            }
        }
        for(let i=0; i< singleDonorVariantContributions.length;++i){
            singleDonorVariantContributions[i].donorIndexOnPlot=this.sortingHelperMapper.get(singleDonorVariantContributions[i].donorIndex)+1;
        }

        let singleDonorVariantContributionsTmp=[];
        let encounteredDonors=new Set();
        for(let i=0; i< singleDonorVariantContributions.length;++i){
            let donorIndex = singleDonorVariantContributions[i].donorIndexOnPlot-1;
            if(!encounteredDonors.has(donorIndex)){
                singleDonorVariantContributionsTmp[donorIndex]=new Map();
                encounteredDonors.add(donorIndex);
            }
            let variantLoc=this.references.variantTypes[singleDonorVariantContributions[i].variantType].locationInPhenotypePlots;
            if(!singleDonorVariantContributionsTmp[donorIndex].has(variantLoc)){
                singleDonorVariantContributionsTmp[donorIndex].set(variantLoc,[]);
            }
            singleDonorVariantContributionsTmp[donorIndex].get(variantLoc).push(singleDonorVariantContributions[i]);
        }
        let singleDonorVariantContributionsTmp2=[];
        for(let i=0; i< singleDonorVariantContributionsTmp.length;++i){
            singleDonorVariantContributionsTmp2.push(new Map());
            if(singleDonorVariantContributionsTmp[i].has(1)){
                let tmpContributions=singleDonorVariantContributionsTmp[i].get(1);
                let directSvAvailable=false;
                for(let j=0; j< tmpContributions.length;++j){
                    if(tmpContributions[j].variantType===8){
                        directSvAvailable=true;
                        break;
                    }
                }
                if(directSvAvailable){
                    let filteredContributions=[];
                    for(let j=0; j< tmpContributions.length;++j){
                        if(!(tmpContributions[j].variantType===44||tmpContributions[j].variantType===45||tmpContributions[j].variantType===46||tmpContributions[j].variantType===47)){
                            filteredContributions.push(tmpContributions[j]);
                        }
                    }
                    singleDonorVariantContributionsTmp2[i].set(1,filteredContributions);
                }
            }
            if(singleDonorVariantContributionsTmp[i].has(2)){
                if(singleDonorVariantContributionsTmp[i].get(2).length>4){
                    let tmpContributions=singleDonorVariantContributionsTmp[i].get(2);
                    let filteredContributions=[];
                    for(let j=0; j< tmpContributions.length;++j){
                        let uniqueLoc=this.references.variantTypes[tmpContributions[j].variantType].uniqueLoc;
                        if(uniqueLoc!==5){
                            filteredContributions.push(tmpContributions[j]);
                        }
                    }
                    singleDonorVariantContributionsTmp2[i].set(2,filteredContributions);
                }
            }
            for(let p=0;p<7;++p){
                if(singleDonorVariantContributionsTmp[i].has(p)){
                    if(!singleDonorVariantContributionsTmp2[i].has(p)){
                        singleDonorVariantContributionsTmp2[i].set(p,singleDonorVariantContributionsTmp[i].get(p));
                    }
                }
            }
        }
        let singleDonorVariantContributionsFinal=[];
        for(let i=0; i< singleDonorVariantContributionsTmp2.length;++i){
            singleDonorVariantContributionsTmp2[i].forEach((v,loc,x)=>{
                let coOccupancy=0;
                v.forEach((variant)=>{
                    coOccupancy+=1;
                });
                let tmpVariantsToCompress=new Map();
                for(let k=0; k< singleDonorVariantContributionsTmp2[i].get(loc).length;++k){
                    singleDonorVariantContributionsTmp2[i].get(loc)[k].targetCoOccupancy=coOccupancy;
                    let uniqueLoc=this.references.variantTypes[singleDonorVariantContributionsTmp2[i].get(loc)[k].variantType].uniqueLoc;
                    if(!tmpVariantsToCompress.has(uniqueLoc)){
                        tmpVariantsToCompress.set(uniqueLoc,[]);
                    }
                    tmpVariantsToCompress.get(uniqueLoc).push(singleDonorVariantContributionsTmp2[i].get(loc)[k]);
                }
                let tmpVariantKeys=Array.from(tmpVariantsToCompress.keys());
                for(let p=0; p<tmpVariantKeys.length; ++p){
                    if(tmpVariantsToCompress.get(tmpVariantKeys[p]).length>1){
                        for(let q=1; q<tmpVariantsToCompress.get(tmpVariantKeys[p]).length; ++q){
                            tmpVariantsToCompress.get(tmpVariantKeys[p])[0].compressedVariantTypes.push(tmpVariantsToCompress.get(tmpVariantKeys[p])[q].variantType);
                        }
                    }
                    singleDonorVariantContributionsFinal.push(tmpVariantsToCompress.get(tmpVariantKeys[p])[0]);
                }
            });
        }
        let thisRef=this;
        singleDonorVariantContributionsFinal.sort(function(a, b) {
            let refVarTypeA=thisRef.references.variantTypes[a.variantType];
            let refVarTypeB=thisRef.references.variantTypes[b.variantType];
            if (a.donorIndexOnPlot < b.donorIndexOnPlot) {
                return -1;
            }
            if (a.donorIndexOnPlot > b.donorIndexOnPlot) {
                return 1;
            }
            if (refVarTypeA.locationInPhenotypePlots < refVarTypeB.locationInPhenotypePlots) {
                return -1;
            }
            if (refVarTypeA.locationInPhenotypePlots > refVarTypeB.locationInPhenotypePlots) {
                return 1;
            }
            if (refVarTypeA.variantTypeIndex < refVarTypeB.variantTypeIndex) {
                return -1;
            }
            if (refVarTypeA.variantTypeIndex > refVarTypeB.variantTypeIndex) {
                return 1;
            }
            return -1
        });
        singleDonorVariantContributions.length=0;
        let lastIndex=-1;
        let lastLoc=-1;
        let lastDonor=-1;
        let lastOrderInLoc=-1;
        for(let i=0; i< singleDonorVariantContributionsFinal.length;++i){
            let refVarType=this.references.variantTypes[singleDonorVariantContributionsFinal[i].variantType];
            if(singleDonorVariantContributionsFinal[i].donorIndexOnPlot!==lastIndex){
                lastIndex=singleDonorVariantContributionsFinal[i].donorIndexOnPlot;
            }
            let loc = refVarType.locationInPhenotypePlots;
            if(loc!==lastLoc || singleDonorVariantContributionsFinal[i].donorIndexOnPlot!==lastDonor){
                lastDonor=singleDonorVariantContributionsFinal[i].donorIndexOnPlot;
                lastOrderInLoc=0;
                lastLoc=loc;
            }
            singleDonorVariantContributionsFinal[i].orderInLoc=lastOrderInLoc;
            lastOrderInLoc+=1;
            singleDonorVariantContributions.push(singleDonorVariantContributionsFinal[i]);
        }
        return singleDonorVariantContributions;
    }
    preparePlot(){
        this.targetSvgID=`${this.targetLocationID}Svg`;
        this.svg = d3Xselect(`#${this.targetLocationID}`)
            .classed("svg-container", true)
            .append("svg")
            .classed("container-fluid", true)
            .classed("wrap", true)
            .classed("svg-content-responsive", true)
            .attr("viewBox", this.viewBox)
            .attr("id",this.targetSvgID)
            // .attr("preserveAspectRatio", "xMaxYMin meet")
            .attr("preserveAspectRatio", "none")
            .attr("width", this.svgSize)
            .attr("height", this.svgSize);
        this.targetWidth = $(`#${this.targetSvgID}`).width()*0.99;
        this.xScale = d3XscaleLinear().domain([0, this.numDonors]).range([0, this.targetWidth*0.95]);
        this.yScale = d3XscaleLinear().domain([Math.min(0,this.minExpression), Math.min(this.maxExpression*1.02,this.maxExpression+0.5)]).range([this.targetWidth, this.targetWidth*0.05]);
        this.yScale2 = d3XscaleLinear().domain([Math.min(0,this.minExpression2), Math.min(this.maxExpression2*1.02,this.maxExpression2+0.5)]).range([this.targetWidth, this.targetWidth*0.05]);
    }
    drawPlotSupporters(){
        if(this.plotSupportGroup!==null){
            $(`#${this.plotSupportGroupName}`).remove();
        }
        let adjustedWidth=Math.abs(this.xScale(this.numDonors+0.25)-this.xScale(0));
        this.plotSupportGroup=this.svg.append("g").attr("id",this.plotSupportGroupName);
        this.plotSupportGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", this.targetWidth)
            .attr("width", adjustedWidth)
            .style("stroke", "Black")
            .style("fill", "none")
            .style("stroke-width", 1);
        if(this.group1Index!==0&&this.group2Index!==0){
            this.singleDonorVariantContributions.forEach((singleDonorVariantContribution)=>{
                let tmpObj={};
                tmpObj.donorIndex=singleDonorVariantContribution.donorIndex;
                tmpObj.donorIndexOnPlot=singleDonorVariantContribution.donorIndexOnPlot;
                this.singleDonorVariantContributionsBg.push(tmpObj);
            });
            this.plotSupportGroup.selectAll(`.${this.circleClassNameAnchor}SelectionBackgrounds`)
                .data(this.singleDonorVariantContributionsBg)
                .enter().append("rect")
                .attr("class", `${this.circleClassNameAnchor}SelectionBackgrounds`)
                .style('stroke', "none")
                .style('fill', (d)=>{
                    if(this.uniqueGroup1Donors.has(d.donorIndex)){
                        return "#ffe6e6";
                    }else if(this.uniqueGroup2Donors.has(d.donorIndex)){
                        return "#cce6ff";
                    }
                    return "none";
                })
                .attr('x',(d)=>{return this.xScale(d.donorIndexOnPlot-0.5);})
                .attr('y',"0")
                .attr('width',(d)=>{return this.xScale(d.donorIndexOnPlot+0.5)-this.xScale(d.donorIndexOnPlot-0.5);})
                .attr('height',this.targetWidth);
        }
        let expressionQuantityLabelsFont = this.fontManager.fontTree.get("singlePhenotypeExpressionFontTargetSelector").get("expressionQuantityLabels").generateFontCssText();
        let expressionQuantityTitleFont = this.fontManager.fontTree.get("singlePhenotypeExpressionFontTargetSelector").get("expressionQuantityTitle").generateFontCssText();
        let donorLabelsFont = this.fontManager.fontTree.get("singlePhenotypeExpressionFontTargetSelector").get("donorLabels").generateFontCssText();
        this.plotSupportGroup.append("g")
            .attr("class", "axis axis--y")
            .call(d3XaxisLeft(this.yScale).tickSize(4))
            .selectAll("text")
            .attr("y", 0)
            .attr("dy", ".1em")
            .style("font", expressionQuantityLabelsFont)
            .style("color",this.bioId2!==null?"blue":"black");
        if(this.bioId2!==null){
            this.plotSupportGroup.append("g")
                .attr("class", "axis axis--y")
                .call(d3XaxisRight(this.yScale2).tickSize(4))
                .selectAll("text")
                .attr("y", 0)
                .attr("x",this.xScale(this.numDonors+0.28))
                .attr("dy", ".1em")
                .style("font", expressionQuantityLabelsFont)
                .style("color","red");
        }
        if(!this.volcanoMode){
            this.plotSupportGroup.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - (adjustedWidth / 20))
                .attr("x",0 - (adjustedWidth / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font", expressionQuantityTitleFont)
                .text(this.cohortMetadata[`${this.expressionPhenotype}ExpressionQuantity`]);
        }
        let lastIndex=-1;
        this.xAxisHelper.length=0;
        for(let i=0;i<this.singleDonorVariantContributions.length;++i){
            if(this.singleDonorVariantContributions[i].donorIndexOnPlot!==lastIndex){
                this.xAxisHelper.push(this.singleDonorVariantContributions[i].donorIndex);
                lastIndex=this.singleDonorVariantContributions[i].donorIndexOnPlot;
            }
        }
        this.plotSupportGroup.append("g")
            .attr("class", "axis axis--x")
            .call(d3XaxisBottom(this.xScale)
                .tickValues(Array(this.xAxisHelper.length).fill().map((e,i)=>i+1))
                .tickFormat((d,i)=> {return this.cohortMetadata.metadata[this.xAxisHelper[i]].donor;})
            )
            .attr("transform","translate(0,"+this.targetWidth+")")
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 15)
            .attr("dy", ".05em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start")
            .style("font", donorLabelsFont);
        let titleFont = this.fontManager.fontTree.get("singlePhenotypeExpressionFontTargetSelector").get("title");
        this.plotSupportGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", titleFont.fontSize*1.01)
            .attr("width", adjustedWidth)
            .style("stroke", "none")
            .style("fill", "White");

        let helperPath=d3Xpath();
        helperPath.moveTo(5, 2);
        helperPath.lineTo(adjustedWidth,2);
        this.plotSupportGroup.append("path")
            .attr("id", this.expressionFrame)
            .attr("d", helperPath);
         this.plotSupportGroup.append("text")
            .append("textPath")
            .attr("class","markerText")
            .attr("href", `#${this.expressionFrame}`)
            .attr("id",`${this.expressionPhenotype}Title`)
            .style("dominant-baseline", "hanging")
            .style("text-anchor", "start")
            .attr("startOffset", "0%")
            .style("display","inline")
            .style("font",titleFont.generateFontCssText())
            .html(this.generateHtmlTitle());
        this.plotPhenotypeTracers();
    }
    addOverlays(){
        if(this.group1Index!==this.group2Index){
            let group1TitleId=`#${this.expressionPhenotype}ExpressionContentGroup1Label`;

            let svgBorders=document.getElementById(`${this.targetSvgID}`).getBoundingClientRect();
            let group1TitleBorders=document.getElementById(`${this.expressionPhenotype}ExpressionContentGroup1Label`).getBoundingClientRect();

            let group1LabelDummyElements=this.plotSupportGroup.append("g");
            group1LabelDummyElements.append("rect")
                .attr("x", group1TitleBorders.x-svgBorders.x)
                .attr("y", group1TitleBorders.y-svgBorders.y)
                .attr("height", group1TitleBorders.height)
                .attr("width", group1TitleBorders.width)
                .style("stroke","none")
                .style("fill","#ffe6e6");
            let titleFont = this.fontManager.fontTree.get("singlePhenotypeExpressionFontTargetSelector").get("title").generateFontCssText();
            group1LabelDummyElements.append("text")
                .text(this.selectionManager.registeredSubcohortNames.get(this.group1Index))
                .attr("x", group1TitleBorders.x-svgBorders.x)
                .attr("y", group1TitleBorders.y-svgBorders.y)
                .attr("dx", group1TitleBorders.width/2)
                .attr("dy", group1TitleBorders.height/2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .style("font", titleFont);

            let group2TitleBorders=document.getElementById(`${this.expressionPhenotype}ExpressionContentGroup2Label`).getBoundingClientRect();
            let group2LabelDummyElements=this.plotSupportGroup.append("g");
            group2LabelDummyElements.append("rect")
                .attr("x", group2TitleBorders.x-svgBorders.x)
                .attr("y", group2TitleBorders.y-svgBorders.y)
                .attr("height", group2TitleBorders.height)
                .attr("width", group2TitleBorders.width)
                .style("stroke","none")
                .style("fill","#cce6ff");
            group2LabelDummyElements.append("text")
                .text(this.selectionManager.registeredSubcohortNames.get(this.group2Index))
                .attr("x", group2TitleBorders.x-svgBorders.x)
                .attr("y", group2TitleBorders.y-svgBorders.y)
                .attr("dx", group2TitleBorders.width/2)
                .attr("dy", group2TitleBorders.height/2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .style("font", titleFont);
        }
    }
    generateHtmlTitle(){
        let titleHtmlChunks=[`<a style="text-decoration:none">${this.cohortMetadata.cohortName}:</a>`];
        if(this.expressionPhenotype==="gene"){
            titleHtmlChunks.push(this.references.genes.get(this.bioId).getGeneCardsLinkPlain());
            if(this.bioId2!==null){
                titleHtmlChunks.push(`<a fill="blue" style="text-decoration:none">(-)</a>`);
                titleHtmlChunks.push("vs");
                titleHtmlChunks.push(this.references.genes.get(this.bioId2).getGeneCardsLinkPlain());
                titleHtmlChunks.push(`<a fill="red" style="text-decoration:none">(-)</a>`);
            }
        }else if(this.expressionPhenotype==="rppa"){
            titleHtmlChunks.push(`<a style="text-decoration:none">${this.references.rppaAntibodies[this.bioId].rppaName}:</a>(${this.geneIds.map((i)=>{return this.references.genes.get(i).getGeneCardsLinkPlain();}).join(',')})`);
            if(this.bioId2!==null){
                titleHtmlChunks.push(`<a fill="blue" style="text-decoration:none">(-)</a>`);
                titleHtmlChunks.push("vs");
                titleHtmlChunks.push(`<a style="text-decoration:none">${this.references.rppaAntibodies[this.bioId2].rppaName}:</a>(${this.geneIds.map((i)=>{return this.references.genes.get(i).getGeneCardsLinkPlain();}).join(',')})`);
                titleHtmlChunks.push(`<a fill="red" style="text-decoration:none">(-)</a>`);
            }
        }
        if(this.group1Index!==this.group2Index){
            titleHtmlChunks.push(`(<a fill="#ffb3b3" id="${this.expressionPhenotype}ExpressionContentGroup1Label" style="text-decoration:none">${this.selectionManager.registeredSubcohortNames.get(this.group1Index)}</a>)`);
            titleHtmlChunks.push(`(<a fill="#80c1ff" id="${this.expressionPhenotype}ExpressionContentGroup2Label" style="text-decoration:none">${this.selectionManager.registeredSubcohortNames.get(this.group2Index)}</a>)`);
        }
        return titleHtmlChunks.join(" ");
    }
    generateTextTitle(){
        let titleTextChunks=[this.cohortMetadata.cohortName];
        if(this.expressionPhenotype==="gene"){
            titleTextChunks.push(this.references.genes.get(this.bioId).geneName);
            if(this.bioId2!==null){
                titleTextChunks.push("(BlueLines)");
                titleTextChunks.push("vs");
                titleTextChunks.push(this.references.genes.get(this.bioId2).geneName);
                titleTextChunks.push("(RedLines)");
            }
        }else if(this.expressionPhenotype==="rppa"){
            titleTextChunks.push(`${this.references.rppaAntibodies[this.bioId].rppaName}`);
            if(this.bioId2!==null){
                titleTextChunks.push("(BlueLines)");
                titleTextChunks.push("vs");
                titleTextChunks.push(`${this.references.rppaAntibodies[this.bioId2].rppaName}`);
                titleTextChunks.push("(RedLines)");
            }
        }
        if(this.group1Index!==this.group2Index){
            titleTextChunks.push(`(${this.selectionManager.registeredSubcohortNames.get(this.group1Index)})-(${this.selectionManager.registeredSubcohortNames.get(this.group2Index)})`);
        }
        return titleTextChunks.join("_");
    }
    plotSingleExpression(){
        this.circleGroupAnchor=this.svg.append("g").attr("id",this.circleGroupNameAnchor);
        this.circleGroupAnchor.selectAll(`.${this.circleClassNameAnchor}`)
            .data(this.singleDonorVariantContributions)
            .enter().append("path")
            .attr("class", this.circleClassNameAnchor)
            .style('stroke', (d)=>{return this.references.colours[d.stroke];})
            .style('fill', (d)=>{return this.references.colours[d.fill];})
            .attr("d",(d)=>{
                if(d.variantType===62){
                    return d3Xsymbol()
                        .type(()=> {return d3Xsymbols[1];})
                        .size(()=> {return 20*Math.pow(d.outerRadius,2)/9;})();
                }else{
                    return d3Xarc()
                        .innerRadius(0)
                        .outerRadius(d.outerRadius)
                        .startAngle(d.startAngle)
                        .endAngle(d.endAngle)();
                }
            })
            .attr("transform",(d)=>{
                if(d.variantType===62){
                    return `translate(${d.cx},${d.cy}) rotate(45)`;
                }else{
                    return `translate(${d.cx},${d.cy})`;
                }
            })
            .append("svg:title")
            .text((d)=>{ return d.hoverText(this.references,this.cohortMetadata); });
        if(this.bioId2!==null){
            this.circleGroupTarget=this.svg.append("g").attr("id",this.circleGroupNameTarget);
            this.circleGroupTarget.selectAll(`.${this.circleClassNameTarget}`)
                .data(this.singleDonorVariantContributions2)
                .enter().append("path")
                .attr("class", this.circleClassNameTarget)
                .style('stroke', (d)=>{return this.references.colours[d.stroke];})
                .style('fill', (d)=>{return this.references.colours[d.fill];})
                .attr("d",(d)=>{
                    let path=d3Xarc()
                        .innerRadius(0)
                        .outerRadius(d.outerRadius)
                        .startAngle(d.startAngle)
                        .endAngle(d.endAngle);
                    return path();
                })
                .attr("transform",(d)=>{return `translate(${d.cx},${d.cy})`;})
                .append("svg:title")
                .text((d)=>{ return d.hoverText(this.references,this.cohortMetadata); });
        }

        if(!this.volcanoMode){
            if(this.bioId!==-1){
                this.circleGroupAnchor.on('click',()=>{
                    if(this.commonSettings.interactionLock){
                        return;
                    }
                    this.commonSettings.fastLock();
                    this.currentRelevantVariants.length=0;
                    let target=d3Xselect(d3Xevent.target).datum();
                    if(target.variantType===62||target.variantType===63){
                        clearAnnotations();
                    }else{
                        this.currentRelevantVariantDescriptionRoot=SinglePhenotypeExpression.determineTargetFromUniqueLoc(target.uniqueLoc);
                        if(this.currentRelevantVariantDescriptionRoot!==""){
                            this.variantFetcher.variantsForPhenotypePlots.get(this.bioId).get(target.uniqueLoc).get(target.donorIndex).forEach((variant)=>{
                                this.currentRelevantVariants.push(variant);
                            });
                            if(this.currentRelevantVariants.length>0){
                                this.enableRelevantVariantControls();
                            }
                        }
                        this.addTmpDonorTracer(target.donorIndexOnPlot);
                    }
                    this.commonSettings.fastRelease();
                });
            }
            if(this.bioId2!==null){
                if(this.bioId2!==-1){
                    this.circleGroupTarget.on('click',()=>{
                        if(this.commonSettings.interactionLock){
                            return;
                        }
                        this.commonSettings.fastLock();
                        this.currentRelevantVariants.length=0;
                        let target=d3Xselect(d3Xevent.target).datum();
                        if(target.variantType===62||target.variantType===63){
                            clearAnnotations();
                        }else{
                            this.currentRelevantVariantDescriptionRoot=SinglePhenotypeExpression.determineTargetFromUniqueLoc(target.uniqueLoc);
                            if(this.currentRelevantVariantDescriptionRoot!==""){
                                this.variantFetcher.variantsForPhenotypePlots.get(this.bioId).get(target.uniqueLoc).get(target.donorIndex).forEach((variant)=>{
                                    this.currentRelevantVariants.push(variant);
                                });
                                if(this.currentRelevantVariants.length>0){
                                    this.enableRelevantVariantControls();
                                }
                            }
                            this.addTmpDonorTracer(target.donorIndexOnPlot);
                        }
                        this.commonSettings.fastRelease();
                    })
                }
            }
        }
    }
    addTmpDonorTracer(donorIndexOnPlot){
        let tmpDonorTracer=$("#tmpDonorTracer");
        tmpDonorTracer.remove();
        this.plotSupportGroup
            .append("rect")
            .style('stroke', this.references.colours[14])
            .style('fill', "none")
            .attr("id","tmpDonorTracer")
            .attr('x',this.xScale(donorIndexOnPlot-0.5))
            .attr('y',"0")
            .attr('width', this.xScale(donorIndexOnPlot+0.5)-this.xScale(donorIndexOnPlot-0.5))
            .attr('height',this.targetWidth);
        tmpDonorTracer=$("#tmpDonorTracer");
        tmpDonorTracer.on("click",()=>{
            tmpDonorTracer.remove();
        });
        tmpDonorTracer.on("contextmenu", ()=> {
            d3Xevent.preventDefault();
            tmpDonorTracer.remove();
        });
    }
    enableRelevantVariantControls(){
        this.currentRelevantVariantIndex=0;
        $(`#${this.currentRelevantVariantDescriptionRoot}SweepLeft`).off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            this.sweepLeft();
            this.commonSettings.releaseLock();
        });
        $(`#${this.currentRelevantVariantDescriptionRoot}SweepRight`).off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            this.sweepRight();
            this.commonSettings.releaseLock();
        });
        $(`#${this.currentRelevantVariantDescriptionRoot}DescriptionPaneControl`).off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            this.goToEntry(this.currentRelevantVariantIndex);
            this.commonSettings.releaseLock();
        });
        this.goToEntry(this.currentRelevantVariantIndex);
    }
    sweepLeft(){
        if(this.currentRelevantVariantIndex!==0){
            this.currentRelevantVariantIndex-=1;
        }else{
            this.currentRelevantVariantIndex=this.currentRelevantVariants.length-1;
        }
        this.goToEntry(this.currentRelevantVariantIndex);
    }
    sweepRight(){
        if(this.currentRelevantVariantIndex!==this.currentRelevantVariants.length-1){
            this.currentRelevantVariantIndex+=1;
        }else{
            this.currentRelevantVariantIndex=0;
        }
        this.goToEntry(this.currentRelevantVariantIndex);
    }
    goToEntry(index){
        this.currentRelevantVariantIndex=index;
        let annotation=this.currentRelevantVariants[this.currentRelevantVariantIndex].annotate(this.references,this.cohortMetadata);
        $(`#${this.currentRelevantVariantDescriptionRoot}DescriptionPaneControl`).css("display","inline");
        $(`#${this.currentRelevantVariantDescriptionRoot}Description`).html(annotation);
        $(`#${this.currentRelevantVariantDescriptionRoot}Counter`).html(`${this.currentRelevantVariantIndex+1}/${this.currentRelevantVariants.length}`);
        $(`.nav-tabs a[href="#${this.currentRelevantVariantDescriptionRoot}DescriptionPane"]`).tab("show");
    }
    static determineTargetFromUniqueLoc(uniqueLoc){
        if(uniqueLoc===8){
            return 'smallVariant';
        }
        else if(uniqueLoc===13){
            return 'smallVariant';
        }
        else if(uniqueLoc===1){
            return 'sv';
        }
        else if(uniqueLoc===9){
            return 'smallVariant';
        }
        else if(uniqueLoc===3){
            return 'smallVariant';
        }
        else if(uniqueLoc===2){
            return 'smallVariant';
        }
        else if(uniqueLoc===13){
            return 'smallVariant';
        }
        else if(uniqueLoc===4){
            return 'smallVariant';
        }
        else if(uniqueLoc===6){
            return 'smallVariant';
        }
        else if(uniqueLoc===5){
            return 'smallVariant';
        }
        else if(uniqueLoc===7){
            return 'smallVariant';
        }
        else if(uniqueLoc===6){
            return 'smallVariant';
        }
        else if(uniqueLoc===14){
            return 'smallVariant';
        }
        return '';
    }
    plotPhenotypeTracers(){
        if(this.bioId2===null){
            return;
        }
        if(this.bioId===this.bioId2){
            return;
        }
        let phenotypeTracers1=[];
        for(let i=0;i<this.singleDonorVariantContributions.length;++i){
            if(this.singleDonorVariantContributions[i].variantType===62 ||this.singleDonorVariantContributions[i].variantType===63  || this.singleDonorVariantContributions[i].variantType===8){
                phenotypeTracers1.push({
                    x:this.singleDonorVariantContributions[i].cx,
                    y:this.singleDonorVariantContributions[i].cy
                });
            }
        }
        phenotypeTracers1=phenotypeTracers1.sort(function(a, b) {
            if (a.x < b.x) {
                return -1;
            }
            return 1;
            // if (a.x > b.x) {
            //     return 1;
            // }
            // return -1
        });
        let phenotypeTracers2=[];
        for(let i=0;i<this.singleDonorVariantContributions2.length;++i){
            if(this.singleDonorVariantContributions2[i].variantType===62 ||this.singleDonorVariantContributions2[i].variantType===63 || this.singleDonorVariantContributions2[i].variantType===8){
                phenotypeTracers2.push({
                    x:this.singleDonorVariantContributions2[i].cx,
                    y:this.singleDonorVariantContributions2[i].cy
                });
            }
        }
        phenotypeTracers2=phenotypeTracers2.sort(function(a, b) {
            if (a.x < b.x) {
                return -1;
            }
            return 1;
            // if (a.x > b.x) {
            //     return 1;
            // }
            // return -1
        });
        let line = d3Xline().x((d)=>{return d.x;}).y((d)=>{return d.y;});
        this.plotSupportGroup.datum(phenotypeTracers1)
            .append("path")
            .style("fill", "none")
            .style("stroke", "blue")
            .style("stroke-width", this.tracerStroke)
            .attr("d", line);
        this.plotSupportGroup.datum(phenotypeTracers2)
            .append("path")
            .style("fill", "none")
            .style("stroke", "red")
            .style("stroke-width", this.tracerStroke)
            .attr("d", line);
    }
    savePhenotypeSvg(){
        saveSvg(this.targetSvgID, `${this.generateTextTitle()}_${this.expressionPhenotype}Expression.svg`);
    }
}