import {hcluster} from "tayden-clusterfck";
import {depadTree, discreteColour, getTreeLeaves} from "../Utils";
import {path as d3Xpath,drag as d3Xdrag,axisBottom as d3XaxisBottom,scaleLinear as d3XscaleLinear,event as d3Xevent, mouse as d3Xmouse, select as d3Xselect} from 'd3'
import {DistanceMeasures} from "../distanceMeasures/DistanceMeasures";
let math = require('mathjs/core').create();
math.import(require('mathjs/lib/type/matrix'));
math.import(require('mathjs/lib/function/matrix/transpose'));
math.import(require('mathjs/lib/function/statistics/var'));

export class HeatmapPlotter {
    constructor(commonSettings,references,cohortMetadata,selectionManager,fontManager,textExportManager,selectedSubcohort,phenotype,topN,heightCoefficient,hclustDistance,hclustLinkage) {
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.fontManager=fontManager;
        this.textExportManager=textExportManager;
        this.selectedSubcohort=selectedSubcohort;
        this.phenotype=phenotype;
        this.topN=topN;
        if(this.phenotype==="cnStatus"){
            this.topN*=2;
        }
        this.heightCoefficient=heightCoefficient;
        this.hclustDistance=hclustDistance;
        this.hclustLinkage=hclustLinkage;
        this.usedDataPointsForClustering=[];
        this.usedDataPointsForClusteringDescriptions=[];
        this.cellSizeX=0;
        this.cellSizeY=0;
        this.svgWidth=0;
        this.svgHeight=0;
        this.targetWidth=0;
        this.targetHeight=0;
        this.maxPhenotypeValue=0;
        this.selectedDonors=[];
        this.missingDonors=new Set();
        this.selectedDonorsStr=[];
        this.donorIndexToColumnIndex=new Map();
        let colToSearch="";
        let noDbMode=false;
        if(this.phenotype==="geneExpressions"){
            colToSearch="RNA";
            noDbMode=false;
        }else if(this.phenotype==="methylomeBetas"){
            colToSearch="MethylationArray";
            noDbMode=false;
        }else if(this.phenotype==="cnStatus"){
            colToSearch="CNV";
            noDbMode=true;
        }else if(this.phenotype==="svStatus"){
            colToSearch="SV";
            noDbMode=true;
        }
        this.currentSubcohortIndex=parseInt($("#subcohortSelector").val());
        this.validIndicesSet=this.selectionManager.registeredSubcohorts.get(this.currentSubcohortIndex);
        this.validIndices=[];
        for(let i=0;i<this.cohortMetadata.metadata.length;++i){
            if(this.validIndicesSet.has(i)){
                this.validIndices.push(i);
            }else{
                this.missingDonors.add(this.cohortMetadata.metadata[i].index);
            }
        }
        for(let q=0;q<this.validIndices.length;++q){
            let i= this.validIndices[q];
            if(this.cohortMetadata.metadata[i][colToSearch]==="+"){
                this.selectedDonors.push(this.cohortMetadata.metadata[i].index);
                this.selectedDonorsStr.push(this.cohortMetadata.metadata[i].index.toString());
            }else{
                this.missingDonors.add(this.cohortMetadata.metadata[i].index);
            }
        }
        $('#heatmapContent').empty();
        this.orderedPhenotypeIdentifiers=[];
        this.orderedDonorIndices=[];
        this.distanceFunc=function(paddedArr1,paddedArr2) {
            let realArr1=paddedArr1.slice(0,paddedArr1.length-1);
            let realArr2=paddedArr2.slice(0,paddedArr2.length-1);
            return DistanceMeasures[hclustDistance](realArr1,realArr2);
        };
        this.data=[];
        this.markedPhenotypeIndices=new Set();
        this.heatmapEntryGroup=null;
        this.heatmapSupportGroup=null;
        this.heatmapPhenotypeLabelsGroup=null;
        this.rectStart={};
        this.rectEnd={};
        this.manuallySelectedDonors=new Set();
        if(noDbMode){
            this.runClusteringAnalysisNoDb();
        }else{
            this.runClusteringAnalysis();
        }
    }
    runClusteringAnalysis(){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getTopNDataFromPhenotypeDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: this.cohortMetadata.cohortName,
                suffix: this.phenotype,
                topN: this.topN
            }),
            error: function(err){
                console.error(err);
                thisRef.commonSettings.releaseLock();
            },
            success: function(data){
                let dbCol=thisRef.phenotype==="geneExpressions"?"gene":"probe";
                let phenotypeMatrix=[];
                let usedDataPointsForClusteringIndex=[];
                for(let i=0;i<data.length;++i){
                    let newRow=[];
                    let validRow=true;
                    for(let j=0;j<thisRef.selectedDonorsStr.length;++j){
                        if(data[i].hasOwnProperty(thisRef.selectedDonorsStr[j])){
                            let phenotypeValue = +data[i][thisRef.selectedDonorsStr[j]];
                            newRow.push(phenotypeValue);
                            let tmpDonorIndex=+thisRef.selectedDonorsStr[j];
                            if(!thisRef.donorIndexToColumnIndex.has(tmpDonorIndex)){
                                thisRef.donorIndexToColumnIndex.set(tmpDonorIndex,newRow.length-1);
                            }
                        }else{
                            validRow=false;
                            break;
                        }
                    }
                    if(validRow){
                        phenotypeMatrix.push(newRow);
                        let entry=data[i][dbCol];
                        if(!isNaN(entry)){
                            thisRef.usedDataPointsForClustering[i]=+entry;
                        }else{
                            thisRef.usedDataPointsForClustering[i]=entry;
                        }
                        usedDataPointsForClusteringIndex.push(i);
                    }
                }
                if(dbCol==="gene"){
                    for(let i=0;i<thisRef.usedDataPointsForClustering.length;++i){
                        thisRef.usedDataPointsForClusteringDescriptions.push(thisRef.references.genes.get(thisRef.usedDataPointsForClustering[i]).geneName);
                    }
                }else if(dbCol==="probe"){
                    for(let i=0;i<thisRef.usedDataPointsForClustering.length;++i){
                        thisRef.usedDataPointsForClusteringDescriptions.push(thisRef.usedDataPointsForClustering[i]);
                    }
                }
                let phenotypeMatrixT=math.transpose(phenotypeMatrix);
                thisRef.heatmapDataPrep(phenotypeMatrix,phenotypeMatrixT,usedDataPointsForClusteringIndex);
            }
        });
    }
    runClusteringAnalysisNoDb(){
        let preData=[];
        let usedDataPointsForClusteringIndex=[];
        if(this.phenotype==="cnStatus"){
            for(let i=1;i<this.references.tads.length;++i){
                if(this.references.tads[i].chromosomeIndex<23){
                    let lossDonors = this.references.tads[i].cnvLossDonorContributorIndices;
                    let gainDonors = this.references.tads[i].cnvGainDonorContributorIndices;
                    let lohDonors = this.references.tads[i].lohDonorContributorIndices;
                    let tmpListLohLoss=[];
                    let tmpListGain=[];
                    let anyHitLohLoss=false;
                    let anyHitGain=false;
                    for(let j=0;j<this.selectedDonors.length;++j){
                        if(lossDonors.has(this.selectedDonors[j]) || lohDonors.has(this.selectedDonors[j])){
                            // tmpListLohLoss[j] = Math.random() * 0.1 + 0.95;
                            tmpListLohLoss[j] = 1;
                            anyHitLohLoss=true;
                        }else{
                            // tmpListLohLoss[j] = Math.random() * 0.1;
                            tmpListLohLoss[j] = 0;
                        }
                        if(gainDonors.has(this.selectedDonors[j])){
                            // tmpListGain[j] = Math.random() * 0.1 + 0.95;
                            tmpListGain[j] = 1;
                            anyHitGain=true;
                        }else{
                            // tmpListGain[j] = Math.random() * 0.1;
                            tmpListGain[j] = 0;
                        }
                        if(!this.donorIndexToColumnIndex.has(this.selectedDonors[j])){
                            this.donorIndexToColumnIndex.set(this.selectedDonors[j],j);
                        }
                    }
                    if(anyHitLohLoss){
                        let tmpObjLohLoss={
                            data:tmpListLohLoss,
                            variance:math.var(tmpListLohLoss),
                            tadIndex:i,
                            direction:-1,
                        };
                        preData.push(tmpObjLohLoss);
                    }
                    if(anyHitGain){
                        let tmpObjGain={
                            data:tmpListGain,
                            variance:math.var(tmpListGain),
                            tadIndex:i,
                            direction:1,
                        };
                        preData.push(tmpObjGain);
                    }
                }else{
                    break;
                }
            }
        }else if(this.phenotype==="svStatus"){
            for(let i=1;i<this.references.tads.length;++i){
                if(this.references.tads[i].chromosomeIndex<24){
                    let svDonors = this.references.tads[i].svDonorContributorIndicesOffset0;
                    let tmpListSv=[];
                    let anyHit=false;
                    for(let j=0;j<this.selectedDonors.length;++j){
                        if(!this.donorIndexToColumnIndex.has(this.selectedDonors[j])){
                            this.donorIndexToColumnIndex.set(this.selectedDonors[j],j);
                        }
                        if(svDonors.has(this.selectedDonors[j])){
                            anyHit=true;
                            tmpListSv[j] = Math.random() * 0.05 + 0.95;
                        }else{
                            tmpListSv[j] = Math.random() * 0.05;
                        }
                    }
                    if(anyHit){
                        let tmpObjSv={
                            data:tmpListSv,
                            variance:math.var(tmpListSv),
                            tadIndex:i,
                            direction:1,
                        };
                        preData.push(tmpObjSv);
                    }
                }else{
                    break;
                }
            }
        }
        preData=preData.sort(function(a, b) {
            if (a.variance > b.variance) {
                return -1;
            }
            return 1;
        });
        let phenotypeMatrix=[];
        let addedTadsGain=new Set([]);
        let addedTadsLoss=new Set([]);
        for(let i=0;i<preData.length && i<this.topN;++i){
            let currentTadIndex=preData[i].tadIndex;
            let direction=preData[i].direction;
            if(direction===-1){
                if(this.references.tads[currentTadIndex-1].chromosomeIndex===this.references.tads[currentTadIndex].chromosomeIndex){
                    if(addedTadsLoss.has(this.references.tads[currentTadIndex-1])){
                        continue;
                    }
                }
                if(this.references.tads[currentTadIndex+1].chromosomeIndex===this.references.tads[currentTadIndex].chromosomeIndex){
                    if(addedTadsLoss.has(this.references.tads[currentTadIndex+1])){
                        continue;
                    }
                }
                addedTadsLoss.add(currentTadIndex);
            }else{
                if(this.references.tads[currentTadIndex-1].chromosomeIndex===this.references.tads[currentTadIndex].chromosomeIndex){
                    if(addedTadsGain.has(this.references.tads[currentTadIndex-1])){
                        continue;
                    }
                }
                if(this.references.tads[currentTadIndex+1].chromosomeIndex===this.references.tads[currentTadIndex].chromosomeIndex){
                    if(addedTadsGain.has(this.references.tads[currentTadIndex+1])){
                        continue;
                    }
                }
                addedTadsGain.add(currentTadIndex);
            }
            phenotypeMatrix.push(preData[i].data);
            this.usedDataPointsForClustering.push([preData[i].tadIndex,preData[i].direction]);
            usedDataPointsForClusteringIndex.push(i);
        }
        if(this.phenotype==="cnStatus"){
            for(let i=0; i<this.usedDataPointsForClustering.length; ++i){
                this.usedDataPointsForClusteringDescriptions.push([
                    this.references.tads[this.usedDataPointsForClustering[i][0]].printTadRange(this.references),
                    this.usedDataPointsForClustering[i][1]===-1?"loss":"gain"].join('\t'));
            }
        }else{
            for(let i=0; i<this.usedDataPointsForClustering.length; ++i){
                this.usedDataPointsForClusteringDescriptions.push([
                    this.references.tads[this.usedDataPointsForClustering[i][0]].printTadRange(this.references)].join('\t'))
            }
        }
        let phenotypeMatrixT=math.transpose(phenotypeMatrix);
        this.heatmapDataPrep(phenotypeMatrix,phenotypeMatrixT,usedDataPointsForClusteringIndex);
    }
    heatmapDataPrep(phenotypeMatrix,phenotypeMatrixT,usedDataPointsForClusteringIndex){
        let phenotypeMatrixPadded=[];
        for(let i=0;i<phenotypeMatrix.length;++i){
            phenotypeMatrixPadded.push(phenotypeMatrix[i]);
            phenotypeMatrixPadded[i].push(usedDataPointsForClusteringIndex[i]);
        }
        let phenotypeMatrixPaddedT=[];
        for(let i=0;i<phenotypeMatrixT.length;++i){
            phenotypeMatrixPaddedT.push(phenotypeMatrixT[i]);
            phenotypeMatrixPaddedT[i].push(this.selectedDonors[i]);
        }
        let phenotypeTree = hcluster(phenotypeMatrixPadded,this.distanceFunc,this.hclustLinkage).tree;
        let donorTree = hcluster(phenotypeMatrixPaddedT,this.distanceFunc,this.hclustLinkage).tree;
        phenotypeMatrixPadded.length=0;
        phenotypeMatrixPaddedT.length=0;
        depadTree(phenotypeTree);
        depadTree(donorTree);
        let phenotypeOrder=getTreeLeaves(phenotypeTree);

        let phenotypeMatrixPhenotypeSorted=[];
        let usedDataPointsForClusteringDescriptionsPhenotypeSorted=[];
        for(let i=0;i<phenotypeOrder.length;++i){
            phenotypeMatrixPhenotypeSorted.push(phenotypeMatrix[phenotypeOrder[i]]);
            usedDataPointsForClusteringDescriptionsPhenotypeSorted.push(this.usedDataPointsForClusteringDescriptions[phenotypeOrder[i]]);
        }
        this.usedDataPointsForClusteringDescriptions=usedDataPointsForClusteringDescriptionsPhenotypeSorted;
        let donorOrder=getTreeLeaves(donorTree);
        let phenotypeMatrixPhenoTypeSortedT=math.transpose(phenotypeMatrixPhenotypeSorted);
        let phenotypeMatrixPhenotypeSortedDonorSortedT=[];
        for(let i=0;i<donorOrder.length;++i){
            let dataIndex=this.donorIndexToColumnIndex.get(donorOrder[i]);
            phenotypeMatrixPhenotypeSortedDonorSortedT.push(phenotypeMatrixPhenoTypeSortedT[dataIndex]);
        }
        this.data=math.transpose(phenotypeMatrixPhenotypeSortedDonorSortedT);
        this.maxPhenotypeValue=0;
        for(let i=0;i<this.data.length;++i){
            for(let j=0;j<this.data[i].length;++j){
                let phenotypeValue=this.data[i][j];
                if(phenotypeValue>this.maxPhenotypeValue){
                    this.maxPhenotypeValue=phenotypeValue;
                }
            }
        }
        for(let i=0;i<phenotypeOrder.length;++i){
            this.orderedPhenotypeIdentifiers.push(this.usedDataPointsForClustering[phenotypeOrder[i]]);
        }
        for(let i=0;i<donorOrder.length;++i){
            this.orderedDonorIndices.push(donorOrder[i]);
        }
        this.colourScaleHeatmap=d3XscaleLinear().domain([0,this.maxPhenotypeValue]).range(discreteColour(2));
        this.plotHeatmapSupporters();
        this.plotHeatmap();
    }
    resetSelectionRect(){
        this.rectStart={};
        this.rectEnd={};
        $('#heatmapSelectBox').remove();
    }
    plotHeatmapSupporters(){
        let thisRef=this;
        $('#heatmapContent').empty();
        this.svgHeatmap = d3Xselect('#heatmapContent')
            .classed("svg-container", true)
            .append("svg")
            .classed("container-fluid", true)
            .classed("wrap", true)
            .classed("svg-content-responsive", true)
            .attr("id",'heatmap')
            .attr("shape-rendering","crispEdges")
            .attr("preserveAspectRatio", "none")
            .attr("width", "100%");
        let heatmapEl=$('#heatmap');
        this.generateScalesXY();
        heatmapEl.height(this.svgHeight);
        this.heatmapSupportGroup=this.svgHeatmap.append("g");
        this.svgHeatmap.on("mousedown", function() {
            thisRef.rectStart = d3Xmouse(this);
            if(thisRef.rectStart.x>thisRef.svgWidth||thisRef.rectStart.y>thisRef.targetHeight){
                thisRef.resetSelectionRect();
                return;
            }
            if(thisRef.rectStart.x<0||thisRef.rectStart.y<0){
                thisRef.resetSelectionRect();
                return;
            }
            thisRef.svgHeatmap.append("rect")
                .attr("id","heatmapSelectBox")
                .attr("x",thisRef.rectStart[0])
                .attr("y",thisRef.rectStart[1])
                .attr("width",0)
                .attr("height",0)
                .style("fill","none")
                .style("stroke","Black")
                .style("stroke-width",0.6);
        })
            .on("mousemove", function() {
                let s = thisRef.svgHeatmap.select("#heatmapSelectBox");
                if(!s.empty()) {
                    let p = d3Xmouse(this);
                    let d = {
                        x       : +s.attr("x"),
                        y       : +s.attr("y"),
                        width   : +s.attr("width"),
                        height  : +s.attr("height")
                    };
                    let move = {
                        x : p[0] - d.x,
                        y : p[1] - d.y
                    };
                    if(move.x < 1 || (move.x*2<d.width)) {
                        d.x = p[0];
                        d.width -= move.x;
                    } else {
                        d.width = move.x;
                    }

                    if(move.y < 1 || (move.y*2<d.height)) {
                        d.y = p[1];
                        d.height -= move.y;
                    } else {
                        d.height = move.y;
                    }
                    s.attr("x",d.x)
                        .attr("y",d.y)
                        .attr("width",d.width)
                        .attr("height",d.height);
                }
            })
            .on("mouseup", function() {
                thisRef.svgHeatmap.select("#heatmapSelectBox").remove();
                if(thisRef.commonSettings.interactionLock){
                    return;
                }
                thisRef.commonSettings.fastLock();
                thisRef.rectEnd = d3Xmouse(this);
                if(thisRef.rectEnd.x>thisRef.svgWidth||thisRef.rectEnd.y>thisRef.targetHeight){
                    thisRef.resetSelectionRect();
                    return;
                }
                if(thisRef.rectEnd.x<0||thisRef.rectEnd.y<0){
                    thisRef.resetSelectionRect();
                    return;
                }
                thisRef.generateScalesXY();
                let xs=[thisRef.xScaleHeatmap.invert(thisRef.rectStart[0]),thisRef.xScaleHeatmap.invert(thisRef.rectEnd[0])].sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                let donorMin=Math.floor(xs[0]);
                let donorMax=Math.floor(xs[1]);
                let anyDonorChanges=false;
                for(let i=donorMin;i<=donorMax;++i){
                    if(i>0&&i<thisRef.orderedDonorIndices.length){
                        if(!thisRef.manuallySelectedDonors.has(thisRef.orderedDonorIndices[i])){
                            thisRef.manuallySelectedDonors.add(thisRef.orderedDonorIndices[i]);
                            anyDonorChanges=true;
                        }else{
                            thisRef.manuallySelectedDonors.delete(thisRef.orderedDonorIndices[i]);
                            anyDonorChanges=true;
                        }
                    }
                }
                let ys=[thisRef.yScaleHeatmap.invert(thisRef.rectStart[1]),thisRef.yScaleHeatmap.invert(thisRef.rectEnd[1])].sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                let phenotypeItemMin=Math.ceil(ys[0]);
                let phenotypeItemMax=Math.floor(ys[1]);
                let newIndices=[];
                let indicesToDelete=[];
                for(let i=phenotypeItemMin;i<=phenotypeItemMax;++i){
                    if(i>=0&&i<thisRef.orderedPhenotypeIdentifiers.length){
                        if(!thisRef.markedPhenotypeIndices.has(i)){
                            newIndices.push(i);
                        }else{
                            indicesToDelete.push(i);
                        }
                    }
                }
                if(newIndices.length>0){
                    thisRef.markSelectedPhenotypes(newIndices);
                }
                for(let i=0;i<indicesToDelete.length;++i){
                    thisRef.removeMarkedPhenotypeItem(indicesToDelete[i]);
                    thisRef.markedPhenotypeIndices.delete(indicesToDelete[i]);
                }
                if(thisRef.manuallySelectedDonors.size>0){
                    $('#subcohortSelectionFromHeatmapGroup').css('display','inline');
                }else{
                    $('#subcohortSelectionFromHeatmapGroup').css('display','none');
                    $('#heatmapSubcohortSelectionName').empty();
                    $('#heatmapSubcohortSelectionDescription').empty();
                }
                if(anyDonorChanges){
                    thisRef.remarkDonors();
                }
                thisRef.rectStart={};
                thisRef.rectEnd={};
                thisRef.commonSettings.fastRelease();
            });
        this.heatmapPhenotypeLabelsGroup=this.heatmapSupportGroup.append("g");
        this.remarkDonors();
        this.heatmapPhenotypeLabelsGroup.on("contextmenu", ()=> {
            d3Xevent.preventDefault();
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            try {
                let phenotypeItem=parseInt(d3Xselect(d3Xevent.target).attr('phenotypeItemIndex'));
                this.removeMarkedPhenotypeItem(phenotypeItem);
            }catch(err){
                console.error(err);
                this.commonSettings.fastRelease();
                return;
            }
            this.commonSettings.fastRelease();
        });
        if(this.markedPhenotypeIndices.size>0){
            this.markSelectedPhenotypes(this.markedPhenotypeIndices);
        }
        $('#heatmapClusteringChoicesCollapseControl').css('display','inline');
        $('#heatmapClusteringChoices').html(this.usedDataPointsForClusteringDescriptions.join('<br>'));
    }
    static getHoverLabelGene(iData,jData,thisRef){
        return `${thisRef.cohortMetadata.metadata[thisRef.orderedDonorIndices[jData]].donor},${thisRef.references.genes.get(thisRef.orderedPhenotypeIdentifiers[iData]).geneName},${thisRef.data[iData][jData]}`;
    }
    static getHoverLabelMeth(iData,jData,thisRef){
        return `${thisRef.cohortMetadata.metadata[thisRef.orderedDonorIndices[jData]].donor},${thisRef.orderedPhenotypeIdentifiers[iData]},${thisRef.data[iData][jData]}`;
    }
    static getHoverLabelTad(iData,jData,thisRef){
        return `${thisRef.cohortMetadata.metadata[thisRef.orderedDonorIndices[jData]].donor},${thisRef.usedDataPointsForClusteringDescriptions[iData]},${thisRef.data[iData][jData]}`;
    }
    plotHeatmap(){
        this.generateScalesXY();
        this.heatmapEntryGroup=this.svgHeatmap.append("g");
        if(this.data.length*this.data[0].length<1e6){
            let hoverFunc=null;
            if(this.phenotype==="geneExpressions"){
                hoverFunc=HeatmapPlotter.getHoverLabelGene;
            }else if(this.phenotype==="methylomeBetas"){
                hoverFunc=HeatmapPlotter.getHoverLabelMeth;
            }else if(this.phenotype==="cnStatus"){
                hoverFunc=HeatmapPlotter.getHoverLabelTad;
            }else if(this.phenotype==="svStatus"){
                hoverFunc=HeatmapPlotter.getHoverLabelTad;
            }
            for(let i=0;i<this.data.length;++i){
                for(let j=0;j<this.data[i].length;++j){
                    this.heatmapEntryGroup.append('rect')
                        .attr('width', this.cellSizeX)
                        .attr('height', this.cellSizeY)
                        .attr('x', this.xScaleHeatmap(j))
                        .attr('y', this.yScaleHeatmap(i))
                        .attr('fill', this.colourScaleHeatmap(this.data[i][j]))
                        .append("svg:title")
                        .text(hoverFunc(i,j,this));
                }
            }
        }else{
            for(let i=0;i<this.data.length;++i){
                for(let j=0;j<this.data[i].length;++j){
                    this.heatmapEntryGroup.append('rect')
                        .attr('width', this.cellSizeX)
                        .attr('height', this.cellSizeY)
                        .attr('x', this.xScaleHeatmap(j))
                        .attr('y', this.yScaleHeatmap(i))
                        .attr('fill', this.colourScaleHeatmap(this.data[i][j]));
                }
            }
        }
        $('#heatmapSubmit').css("display","inline");
        this.commonSettings.releaseLock();
    }
    clearMarkedDonors(){
        this.manuallySelectedDonors.clear();
        this.remarkDonors();
        $('#subcohortSelectionFromHeatmapGroup').css('display','none');
        $('#heatmapSubcohortSelectionDescription').empty();
        $('#heatmapSubcohortSelectionName').empty();
        $('#createSubcohortFromMarkedDonorsHeatmap').css('display','none');
    }
    remarkDonors(){
        $('#heatmapXaxis').remove();
        this.generateScalesXY();
        let donorLabelsFont = this.fontManager.fontTree.get("heatmapFontTargetSelector").get("donorLabels").generateFontCssText();
        this.heatmapSupportGroup.append("g")
            .attr("class", "axis axis--x")
            .attr("id", "heatmapXaxis")
            .call(d3XaxisBottom(this.xScaleHeatmap)
                .tickValues(Array(this.orderedDonorIndices.length).fill().map((e,i)=>i+0.5))
                .tickFormat((d,i)=> {return this.cohortMetadata.metadata[this.orderedDonorIndices[i]].donor;})
            )
            .attr("transform",`translate(0,${this.targetHeight+this.cellSizeY})`)
            .selectAll("text")
            .attr("y", 0)
            .attr("x", 15)
            .attr("dy", ".05em")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start")
            .style("font", donorLabelsFont)
            .style("color",(d,i)=>{return this.manuallySelectedDonors.has(this.orderedDonorIndices[i])? "red":"black"});
    }
    generateScalesXY(){
        let heatmapEl=$('#heatmap');
        this.svgWidth=heatmapEl.width();
        this.targetWidth=Math.round(this.svgWidth*0.92);
        this.targetHeight=Math.round(this.targetWidth*this.heightCoefficient);
        this.xScaleHeatmap=d3XscaleLinear().domain([0,this.selectedDonors.length]).range([0, this.targetWidth]);
        this.yScaleHeatmap=d3XscaleLinear().domain([0,this.orderedPhenotypeIdentifiers.length]).range([0, this.targetHeight]);
        this.cellSizeX=this.xScaleHeatmap(1);
        this.cellSizeY=this.targetWidth*this.heightCoefficient/this.orderedPhenotypeIdentifiers.length;
        this.svgHeight=this.targetHeight*1.1;
        if(this.svgHeight<this.svgWidth){
            this.svgHeight=this.svgWidth;
            this.targetWidth=this.svgWidth;
        }
    }
    markSelectedPhenotypes(newIndices){
        newIndices.forEach((phenotypeIndex)=>{
            this.markPhenotypeItem(phenotypeIndex);
            this.markedPhenotypeIndices.add(phenotypeIndex);
        })
    }
    markPhenotypeItem(phenotypeItemIndex){
        let phenotypeItemId=this.orderedPhenotypeIdentifiers[phenotypeItemIndex];
        let thisRef=this;
        this.generateScalesXY();
        let markedElementLabelFont=this.fontManager.fontTree.get("heatmapFontTargetSelector").get("markedElementLabels").generateFontCssText();
        let label="";
        if(this.phenotype==="geneExpressions"){
            label=this.references.genes.get(phenotypeItemId).getGeneCardsLinkPlain();
        }else if(this.phenotype==="methylomeBetas"){
            label=phenotypeItemId;
        }else if(this.phenotype==="cnStatus"){
            label=[this.references.cytobands[this.references.tads[phenotypeItemId[0]].cytobandIndices[0]].cytobandName, phenotypeItemId[1]===-1?"loss":"gain"].join('\t');
        }else if(this.phenotype==="svStatus"){
            label=this.references.cytobands[this.references.tads[phenotypeItemId[0]].cytobandIndices[0]].cytobandName;
        }
        label=`<a id="heatmapPhenotypeLabelPadSpace">&ensp;</a>${label}`;
        let labelY=this.yScaleHeatmap(phenotypeItemIndex+0.5);
        let helperPath=d3Xpath();
        helperPath.moveTo(this.targetWidth+this.cellSizeY,labelY);
        helperPath.lineTo(this.svgWidth,labelY);
        helperPath.closePath();
        this.heatmapPhenotypeLabelsGroup.append("path")
            .attr("id", `heatmapHelperPath_${phenotypeItemIndex}`)
            .attr("d", helperPath)
            .style("display","none");
        this.heatmapPhenotypeLabelsGroup.append("text")
            .style("dominant-baseline", "middle")
            .style("alignment-baseline", "middle")
            .attr("class","markerText")
            .attr("phenotypeItemIndex", phenotypeItemIndex)
            .attr("id", `heatmapPhenotypeMarker_${phenotypeItemIndex}`)
            .append("textPath")
            .attr("xlink:href", `#heatmapHelperPath_${phenotypeItemIndex}`)
            .attr("phenotypeItemIndex", phenotypeItemIndex)
            .style("dominant-baseline", "middle")
            .style("alignment-baseline", "middle")
            .style("font",markedElementLabelFont)
            .html(label)
            .call(d3Xdrag()
                .on("start", function(){
                    $(`#heatmapPhenotypeMarker_${phenotypeItemIndex}_dragbridge`).remove();
                    $(`#heatmapPhenotypeMarkerPad_${phenotypeItemIndex}_dragbridge`).remove();
                })
                .on("drag", ()=>{
                    let xInit = Math.max(d3Xevent.x,thisRef.xScaleHeatmap(thisRef.selectedDonors.length));
                    let yInit = d3Xevent.y;
                    let helperPath = d3Xpath();
                    helperPath.moveTo(xInit, yInit);
                    helperPath.lineTo(thisRef.svgWidth,yInit);
                    helperPath.closePath();
                    d3Xselect(`#heatmapHelperPath_${phenotypeItemIndex}`)
                        .attr("d", helperPath);
                    let elq = $(`#heatmapPhenotypeMarker_${phenotypeItemIndex}`);
                    elq.hide();
                    setTimeout(function(){
                        elq.show();
                    },10);
                })
                .on("end", function(){
                    let yInit=thisRef.yScaleHeatmap(phenotypeItemIndex+0.5);
                    let xTarget= Math.max(d3Xevent.x,thisRef.xScaleHeatmap(thisRef.selectedDonors.length));
                    let yTarget= d3Xevent.y;
                    let helperPath=d3Xpath();
                    helperPath.moveTo(thisRef.xScaleHeatmap(thisRef.selectedDonors.length),yInit);
                    helperPath.lineTo(xTarget,yTarget);
                    helperPath.closePath();
                    thisRef.heatmapSupportGroup.append("path")
                        .attr("id", `heatmapPhenotypeMarker_${phenotypeItemIndex}_dragbridge`)
                        .attr("d", helperPath)
                        .style("stroke","Black")
                        .style("display","inline");
                }));
    }
    removeMarkedPhenotypeItem(phenotypeItemIndex){
        $(`#heatmapPhenotypeMarker_${phenotypeItemIndex}_dragbridge`).remove();
        $(`#heatmapPhenotypeMarker_${phenotypeItemIndex}`).remove();
        $(`#heatmapHelperPath_${phenotypeItemIndex}`).remove();
    }
    markSubcohort(subcohortIndex){
        this.selectionManager.registeredSubcohorts.get(subcohortIndex).forEach((donorIndex)=>{
            this.manuallySelectedDonors.add(donorIndex);
        });
        if(this.manuallySelectedDonors.size>0){
            $('#subcohortSelectionFromHeatmapGroup').css('display','inline');
            this.remarkDonors();
        }else{
            $('#subcohortSelectionFromHeatmapGroup').css('display','none');
            $('#heatmapSubcohortSelectionName').empty();
            $('#heatmapSubcohortSelectionDescription').empty();
        }
        $('#submitSubcohortForMarkingHeatmap').css('display','none');
    }
}