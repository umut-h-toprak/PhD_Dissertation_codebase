import {discreteColour, discreteColourGrayRed} from "../Utils";
import {
    path as d3Xpath,
    axisTop as d3XaxisTop,
    axisBottom as d3XaxisBottom,
    axisLeft as d3XaxisLeft,
    axisRight as d3XaxisRight,
    symbol as d3Xsymbol,
    symbols as d3Xsymbols,
    drag as d3Xdrag,
    event as d3Xevent,
    select as d3Xselect,
    scaleLinear as d3XscaleLinear,
    line as d3Xline,
} from "d3";
import {default as concaveman} from 'concaveman';
import {calculateKde} from "./kdeUtils";

let math = require('mathjs/core').create();
math.import(require('mathjs/lib/type/fraction'));
math.import(require('mathjs/lib/function/statistics/quantileSeq'));
math.import(require('mathjs/lib/function/statistics/var'));

const AREAFACTORS=[
    Math.PI,
    20/9,
    1,
    2,
    10*Math.tan(Math.PI/10)/(3-Math.pow(Math.tan(Math.PI/10),2)),
    3*Math.sqrt(3)/4,
    9*(1+1/Math.sqrt(3))*(1/Math.pow((2*Math.sqrt(3)+1),2))
];


import {DistanceMeasures} from "../distanceMeasures/DistanceMeasures";
import {Clusterer as kMedoidsClusterer} from "k-medoids";
import {SinglePlotObject} from "./SinglePlotObject";
const kmeans = require('node-kmeans');
const FuzzyDBSCAN = require('fuzzy-dbscan');
const libOPTICS = require('density-clustering');
// import Clustering from 'hdbscanjs';

export class FlexiblePlotModule {
    constructor(commonSettings,
                references,
                cohortMetadata,
                selectionManager,
                fontManager,
                parentFlexiblePlotManager,
                subcohortIndex,
                subplotInfo,
                forcedMinX,
                forcedMaxX,
                forcedMinY,
                forcedMaxY,
                ) {
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.fontManager=fontManager;
        this.parentFlexiblePlotManager=parentFlexiblePlotManager;
        this.columnIds=this.parentFlexiblePlotManager.columnIds;

        this.panelIndex=subplotInfo.panelIndex;
        this.svgStartX=subplotInfo.svgStartX;
        this.svgWidth=subplotInfo.svgWidth;
        this.svgEndX=this.svgStartX+this.svgWidth;
        this.svgStartY=subplotInfo.svgStartY;
        this.svgHeight=subplotInfo.svgHeight;
        this.svgEndY=this.svgStartY+this.svgHeight;
        this.xAxisColumn=subplotInfo.xAxisColumn;
        this.yAxisColumn=subplotInfo.yAxisColumn;
        this.colourColumn=subplotInfo.colourColumn;
        this.symbolColumn=subplotInfo.symbolColumn;
        this.radiusColumn=subplotInfo.radiusColumn;
        this.stackedBarNumericColumns=subplotInfo.stackedBarNumericColumns;
        this.stackedBarplotMode=(this.xAxisColumn===undefined||this.yAxisColumn===undefined)&&this.stackedBarNumericColumns.length>0;
        this.leftMostColumn=subplotInfo.leftMostColumn;
        this.rightMostColumn=subplotInfo.rightMostColumn;
        this.bottomRow=subplotInfo.bottomRow;
        this.topRow=subplotInfo.topRow;
        this.includedHoverColumns=[];
        this.refreshHoverColumns();
        this.includedLabelColumns=[];
        this.refreshLabelColumns();

        this.forcedAllColourVals=this.parentFlexiblePlotManager.forcedAllColourVals;
        this.forcedColourValsReverseMapper=this.parentFlexiblePlotManager.forcedColourValsReverseMapper;
        this.forcedAllSymbolVals=this.parentFlexiblePlotManager.forcedAllSymbolVals;
        this.forcedSymbolValsReverseMapper=this.parentFlexiblePlotManager.forcedSymbolValsReverseMapper;

        this.forcedMinX=forcedMinX;
        this.forcedMaxX=forcedMaxX;
        this.forcedMinY=forcedMinY;
        this.forcedMaxY=forcedMaxY;

        //controller elements
        this.markedDonors=new Set();
        this.directMarkedDonors=new Set();
        this.missingDonors=new Set();

        //data display elements
        this.svgDataGroup=null;
        this.svgStackedBarsGroup=null;
        this.svgPlotSupportGroup=null;
        this.svgPremarkerGroup=null;
        this.svgMarkerGroup=null;
        this.svgSubcohortShadeGroup=null;
        this.svgSubcohortPremarkerGroup=null;
        this.svgSubcohortMarkerGroup=null;
        this.currentSubcohortIndex=subcohortIndex;
        this.validIndicesSet=new Set();
        this.validIndices=[];
        this.subcohortShades=new Map();

        //scale elements
        this.xScale=null;
        this.yScale=null;
        this.minX=Number.MAX_VALUE;
        this.maxX=Number.MIN_VALUE;
        this.minY=Number.MAX_VALUE;
        this.maxY=Number.MIN_VALUE;
        this.colourScale=null;
        this.usedColumnsInStackedBar=new Map();
        this.colourScaleStackedBar=null;
        this.colourScaleType=null;
        this.radiusScale=null;
        this.minRadius=null;
        this.maxRadius=null;
        this.baseSize=null;
        this.minColour=null;
        this.maxColour=null;

        //data elements
        this.plotData=[];
        this.donorIndexToPlotData=new Map();
        this.symbolReverseMapper=new Map();
        this.colourReverseMapper=new Map();

        this.samplesPerCategory=new Map();
        this.allXvals=new Map();
        this.allYvals=new Map();
        this.stackedBarValsPerDonor=new Map();
        this.totalsPerDonorMap=new Map();
        this.allColourVals=new Map();
        this.allSymbolVals=new Map();
        this.allRadiusVals=new Map();
        this.xAxisType=this.cohortMetadata.metadataDataTypes.get(this.xAxisColumn);
        this.yAxisType=this.cohortMetadata.metadataDataTypes.get(this.yAxisColumn);
        this.cleanup();
        // this.determineValidDonors();
        // this.prepareXYScalesStackedBarplot()
        this.reset();
    }
    refreshHoverColumns(){
        this.includedHoverColumns.length=0;
        this.includedHoverColumns=[this.xAxisColumn,this.yAxisColumn];
        if(this.colourColumn!==""){
            this.includedHoverColumns.push(this.colourColumn);
        }
        if(this.symbolColumn!==""){
            this.includedHoverColumns.push(this.symbolColumn);
        }
        if(this.radiusColumn!==""){
            this.includedHoverColumns.push(this.radiusColumn);
        }
        this.columnIds.forEach((column,columnId,x)=>{
            if($(`#includeInHover_${columnId}`).is(':checked')){
                this.includedHoverColumns.push(column);
            }
        });
    }
    refreshLabelColumns(){
        this.includedLabelColumns.length=0;
        this.columnIds.forEach((column,columnId,x)=>{
            if($(`#includeInLabel_${columnId}`).is(':checked')){
                this.includedLabelColumns.push(column);
            }
        });
    }
    cleanupMetadataColumn(columnName){
        if( columnName===this.xAxisColumn  ||
            columnName===this.yAxisColumn  ||
            columnName===this.colourColumn ||
            columnName===this.symbolColumn ||
            columnName===this.radiusColumn
        ){
            this.cleanup();
            return true;
        }
        return false;
    }
    reset(){
        this.cleanup();
        this.determineValidDonors();
        this.addSvgElementGroups();
        this.preparePlotScales();
        this.preparePlotData();
        this.addPlotSupporters();
        this.addSubcohortShades();
        this.addPlotDataPoints();
        this.remarkDonors();
    }
    cleanup(){
        $(`#subcohortShades_p${this.panelIndex}`).remove();
        $(`#subcohortMarkers_p${this.panelIndex}`).remove();
        $(`#subcohortPremarkers_p${this.panelIndex}`).remove();
        $(`#donorMarkers_p${this.panelIndex}`).remove();
        $(`#donorPremarkers_p${this.panelIndex}`).remove();
        $(`#flexibleData_p${this.panelIndex}`).remove();
        $(`#flexiblePlotSupportGroup_p${this.panelIndex}`).remove();
        $(`#flexibleStackedBars_p${this.panelIndex}`).remove();
    }
    determineValidDonors(){
        this.missingDonors.clear();
        this.validIndicesSet=this.selectionManager.registeredSubcohorts.get(this.currentSubcohortIndex);
        this.validIndices=[];
        for(let i=0;i<this.cohortMetadata.metadata.length;++i){
            if(this.validIndicesSet.has(i)){
                this.validIndices.push(i);
            }else{
                this.missingDonors.add(this.cohortMetadata.metadata[i].index);
            }
        }
    }
    adjustDefaultSymbolSize(newSymbolSize){
        this.baseSize=newSymbolSize;
        this.remarkDonors();
        this.svgDataGroup.selectAll('.flexibleDataPoints')
            .attr('d', d3Xsymbol()
                .type((d)=> { return d3Xsymbols[d.symbol];})
                .size((d)=> { return this.baseSize*Math.pow(d.radius,2)*AREAFACTORS[d.symbol];})
            );
    }
    emitSelectedDonorsFromSvgCoordinates(xLowOnSvg,xHighOnSvg,yLowOnSvg,yHighOnSvg){
        let donorIndices=[];
        const numItems=this.plotData.length;
        for(let i=0;i<numItems;++i){
            const xDonor= this.plotData[i].x;
            if(xLowOnSvg<=xDonor&&xDonor<=xHighOnSvg){
                const yDonor= this.plotData[i].y;
                if(yLowOnSvg<=yDonor&&yDonor<=yHighOnSvg){
                    const donorIndex=this.plotData[i].donorIndex;
                    donorIndices.push(donorIndex);
                    this.directMarkedDonors.add(donorIndex);
                }
            }
        }
        return donorIndices;
    }
    preparePlotScales(){
        if(this.stackedBarplotMode){
            this.prepareXYColourScalesStackedBarplot();
        }else{
            this.prepareXYScales();
        }
        this.prepareColourScale();
        this.prepareSymbolScale();
        this.prepareRadiusScale();
    }
    prepareXYScales(){
        let xIndex=0;
        let yIndex=0;
        for(let q=0;q<this.validIndices.length;++q){
            const i=this.validIndices[q];
            const xVal=this.cohortMetadata.metadata[i][this.xAxisColumn];
            const yVal=this.cohortMetadata.metadata[i][this.yAxisColumn];
            const xUndefined=this.commonSettings.undefinedValues.has(xVal);
            const yUndefined=this.commonSettings.undefinedValues.has(yVal);
            if(xUndefined && yUndefined){
                continue;
            }
            if(this.xAxisType==="numeric"&&xUndefined){
                continue;
            }
            if(this.yAxisType==="numeric"&&yUndefined){
                continue;
            }
            if(!this.allXvals.has(xVal)){
                if(this.xAxisType==="numeric"){
                    this.allXvals.set(xVal,xIndex);
                }else{
                    this.allXvals.set(xVal,xIndex+0.5);
                }
                xIndex++;
            }
            if(!this.allYvals.has(yVal)){
                if(this.yAxisType==="numeric"){
                    this.allYvals.set(yVal, yIndex);
                }else{
                    this.allYvals.set(yVal, yIndex+0.5);
                }
                yIndex++;
            }
        }

        // for(let q=0;q<this.validIndices.length;++q){
        //     const i=this.validIndices[q];
        //     const xVal=this.cohortMetadata.metadata[i][this.xAxisColumn];
        //     const yVal=this.cohortMetadata.metadata[i][this.yAxisColumn];
        //     if(!this.commonSettings.undefinedValues.has(xVal) && !this.commonSettings.undefinedValues.has(yVal)){
        //         if(!this.allXvals.has(xVal)){
        //             if(this.xAxisType==="numeric"){
        //                 this.allXvals.set(xVal,xIndex);
        //                 xIndex++;
        //             }else{
        //                 this.allXvals.set(xVal,xIndex+0.5);
        //                 xIndex++;
        //             }
        //         }
        //         if(!this.allYvals.has(yVal)){
        //             if(this.yAxisType==="numeric") {
        //                 this.allYvals.set(yVal, yIndex);
        //                 yIndex++;
        //             } else{
        //                 this.allYvals.set(yVal, yIndex+0.5);
        //                 yIndex++;
        //             }
        //         }
        //     }
        // }
        if(this.xAxisType!=="numeric"&&this.yAxisType==="numeric"){
            for(let q=0;q<this.validIndices.length;++q){
                const i= this.validIndices[q];
                const xVal= this.cohortMetadata.metadata[i][this.xAxisColumn];
                const yVal= this.cohortMetadata.metadata[i][this.yAxisColumn];
                const yUndefined=this.commonSettings.undefinedValues.has(yVal);
                if(!yUndefined){
                    if (!this.samplesPerCategory.has(xVal)) {
                        this.samplesPerCategory.set(xVal, []);
                    }
                    this.samplesPerCategory.get(xVal).push(yVal);
                }
            }
        } else if(this.yAxisType!=="numeric"&&this.xAxisType==="numeric"){
            for(let q=0;q<this.validIndices.length;++q){
                const i= this.validIndices[q];
                const xVal= this.cohortMetadata.metadata[i][this.xAxisColumn];
                const yVal= this.cohortMetadata.metadata[i][this.yAxisColumn];
                const xUndefined=this.commonSettings.undefinedValues.has(xVal);
                if(!xUndefined){
                    if(!this.samplesPerCategory.has(yVal)){
                        this.samplesPerCategory.set(yVal,[]);
                    }
                    this.samplesPerCategory.get(yVal).push(xVal);
                }
            }
        }

        const targetWidth=this.svgWidth*0.99;
        this.maxX=this.allXvals.size;
        this.minX=0;
        if(this.xAxisType==="numeric"){
            if(this.forcedMinX!==null&&this.forcedMaxX!==null){
                this.minX=this.forcedMinX;
                this.maxX=this.forcedMaxX;
            }else{
                const allXvalsArr=Array.from(this.allXvals.keys()).sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                this.maxX=allXvalsArr[allXvalsArr.length-1];
                this.minX=allXvalsArr[0];
            }
        }
        this.xScale = d3XscaleLinear().domain([Math.min(-this.maxX*0.1,this.minX*1.1), this.maxX*1.1]).range([this.svgStartX+targetWidth*0.01, this.svgStartX+targetWidth*0.98]);
        this.maxY=this.allYvals.size;
        this.minY=0;
        if(this.yAxisType==="numeric"){
            if(this.forcedMinY!==null&&this.forcedMaxY!==null){
                this.minY=this.forcedMinY;
                this.maxY=this.forcedMaxY;
            }else{
                const allYvalsArr=Array.from(this.allYvals.keys()).sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                this.maxY=allYvalsArr[allYvalsArr.length-1];
                this.minY=allYvalsArr[0];
            }
        }
        this.yScale = d3XscaleLinear().domain([Math.min(-this.maxY*0.1,this.minY*1.1), this.maxY*1.1]).range([(this.svgStartY+0.99*this.svgHeight),this.svgStartY]);
    }
    prepareXYColourScalesStackedBarplot(){
        const layersToStack=this.stackedBarNumericColumns.length;
        const donorColumn=this.xAxisColumn!==undefined?this.xAxisColumn:this.yAxisColumn;
        for(let q=0;q<this.validIndices.length;++q){
            const i=this.validIndices[q];
            const currentMetadataItem=this.cohortMetadata.metadata[i];
            const donor=currentMetadataItem[donorColumn];
            let valsToStack=[];
            for(let j=0;j<layersToStack;++j){
                const numericColumn=this.stackedBarNumericColumns[j];
                const numericVal=currentMetadataItem[numericColumn];
                if(!this.commonSettings.undefinedValues.has(numericVal)){
                    valsToStack.push({
                        column:numericColumn,
                        value:currentMetadataItem[numericColumn]
                    });
                }
            }
            if(valsToStack.length>0){
                this.stackedBarValsPerDonor.set(donor,valsToStack.slice());
            }
        }
        let totalsPerDonor=[];
        this.stackedBarValsPerDonor.forEach((valueObjects,donor,map)=>{
            let total=0;
            valueObjects.forEach((valueObject)=>{
                total+=valueObject.value;
            });
            totalsPerDonor.push({donor:donor,total:total});
            this.totalsPerDonorMap.set(donor,total);
        });
        if(this.xAxisColumn!==undefined){
            totalsPerDonor.sort((a, b)=> {
                return b.total-a.total;
            });
        }else{
            totalsPerDonor.sort((a, b)=> {
                return a.total-b.total;
            });
        }
        const topDonor=totalsPerDonor[0].donor;
        let valsToStackOfTopDonor=this.stackedBarValsPerDonor.get(topDonor);
        valsToStackOfTopDonor.sort(function(a, b) {
            return b.value-a.value;
        });
        let valsToStackOfTopDonorMapper=new Map();
        let tmpIndex=0;
        valsToStackOfTopDonor.forEach(obj=>{
            valsToStackOfTopDonorMapper.set(obj.column,tmpIndex);
            tmpIndex+=1;
        });
        this.stackedBarValsPerDonor.forEach((valsToStack,donor,map)=>{
            valsToStack.sort(function(a, b) {
                return valsToStackOfTopDonorMapper.get(b.column)-valsToStackOfTopDonorMapper.get(a.column);
            });
        });
        let orderedIndices=[];
        const lenValidIndices=this.validIndices.length;
        const lenTotalsPerDonor=totalsPerDonor.length;
        for(let p=0;p<lenTotalsPerDonor;++p){
            const donorToSearch = totalsPerDonor[p].donor;
            for(let q=0;q<lenValidIndices;++q){
                const i=this.validIndices[q];
                const donorTmp=this.cohortMetadata.metadata[i].donor;
                if(donorTmp===donorToSearch){
                    orderedIndices.push(i);
                    break;
                }
            }
        }
        const lenOrderedIndices=orderedIndices.length;
        let xIndex=0;
        let yIndex=0;
        for(let q=0;q<lenOrderedIndices;++q){
            const i=orderedIndices[q];
            const currentMetadataItem=this.cohortMetadata.metadata[i];
            if(this.xAxisColumn!==undefined){
                const donor=currentMetadataItem[this.xAxisColumn];
                if(!this.allXvals.has(donor)){
                    this.allXvals.set(donor,xIndex+0.5);
                    xIndex++;
                }
                const donorValTotal=this.totalsPerDonorMap.get(donor);
                if(!this.allYvals.has(donorValTotal)){
                    this.allYvals.set(donorValTotal, yIndex);
                    yIndex++;
                }
            }else{
                const donor=currentMetadataItem[this.yAxisColumn];
                if(!this.allYvals.has(donor)){
                    this.allYvals.set(donor,yIndex+0.5);
                    yIndex++;
                }
                const donorValTotal=this.totalsPerDonorMap.get(donor);
                if(!this.allXvals.has(donorValTotal)){
                    this.allXvals.set(donorValTotal, xIndex);
                    xIndex++;
                }
            }
        }
        let colourIndex=0;
        this.stackedBarValsPerDonor.forEach((valueObjects,donor,map)=>{
            valueObjects.forEach((valueObject)=>{
                if(!this.usedColumnsInStackedBar.has(valueObject.column)){
                    if(valueObject.value>0){
                        this.usedColumnsInStackedBar.set(valueObject.column,colourIndex);
                        colourIndex+=1;
                    }
                }
            });
        });
        this.colourScaleStackedBar=function (x){return discreteColour(this.usedColumnsInStackedBar.size)[x]};
        const targetWidth=this.svgWidth*0.99;
        if(this.xAxisColumn!==undefined){
            this.maxX=this.allXvals.size;
            this.minX=0;
            const allYvalsArr=Array.from(this.allYvals.keys()).sort(function(a, b) {
                if (a < b) {return -1;}
                if (a > b) {return 1;}
                return -1
            });
            this.maxY=allYvalsArr[allYvalsArr.length-1];
            this.minY=allYvalsArr[0];
            if(this.minY>=0&&this.maxY<=1){
                this.minY=0;
                this.maxY=1;
            }
            this.xScale = d3XscaleLinear().domain([this.minX, this.maxX]).range([this.svgStartX+targetWidth*0.01, this.svgStartX+targetWidth*0.98]);
            this.yScale = d3XscaleLinear()
                .domain([Math.min(-this.maxY*0.05,this.minY*1.1), this.maxY*1.1])
                .range([(this.svgStartY+0.99*this.svgHeight),this.svgStartY]);
        }else{
            this.maxY=this.allYvals.size;
            this.minY=0;
            const allXvalsArr=Array.from(this.allXvals.keys()).sort(function(a, b) {
                if (a < b) {return -1;}
                if (a > b) {return 1;}
                return -1
            });
            this.maxX=allXvalsArr[allXvalsArr.length-1];
            this.minX=allXvalsArr[0];
            if(this.maxX>=0&&this.maxX<=1){
                this.minX=-0;
                this.maxX=1;
            }
            this.xScale = d3XscaleLinear().domain([Math.min(-this.maxX*0.05,this.minX*1.1), this.maxX*1.1]).range([this.svgStartX+targetWidth*0.01, this.svgStartX+targetWidth*0.98]);
            this.yScale = d3XscaleLinear().domain([this.minY, this.maxY]).range([(this.svgStartY+0.99*this.svgHeight),this.svgStartY]);
        }
    }
    prepareColourScale(){
        if(this.colourColumn!==""){
            this.colourScaleType=this.cohortMetadata.metadataDataTypes.get(this.colourColumn);
            if(this.colourScaleType==="numeric"){
                if(this.parentFlexiblePlotManager.forcedColourScale===null){
                    let colourIndex=0;
                    for(let q=0;q<this.validIndices.length;++q){
                        const i= this.validIndices[q];
                        const currentVal=this.cohortMetadata.metadata[i][this.colourColumn];
                        if(!this.allColourVals.has(currentVal)){
                            if(!this.commonSettings.undefinedValues.has(currentVal)){
                                this.allColourVals.set(currentVal,colourIndex);
                                colourIndex++;
                            }
                        }
                    }
                    const allColourValsArr=Array.from(this.allColourVals.keys()).sort(function(a, b) {
                        if (a < b) {return -1;}
                        if (a > b) {return 1;}
                        return -1
                    });
                    this.maxColour=allColourValsArr[allColourValsArr.length-1];
                    this.minColour=allColourValsArr[0];
                }else{
                    this.minColour=this.parentFlexiblePlotManager.minColourForced;
                    this.maxColour=this.parentFlexiblePlotManager.maxColourForced;
                }
                // this.colourScale=d3XscaleLinear().domain([this.minColour, this.maxColour]).range(discreteColour(2));
                this.colourScale=d3XscaleLinear().domain([this.minColour, this.maxColour]).range(discreteColourGrayRed());
            }
            else{
                if(this.parentFlexiblePlotManager.forcedColourScale===null){
                    let colourIndex=0;
                    for(let q=0;q<this.validIndices.length;++q){
                        const i= this.validIndices[q];
                        const currentVal=this.cohortMetadata.metadata[i][this.colourColumn];
                        if(!this.allColourVals.has(currentVal)){
                            this.allColourVals.set(currentVal,colourIndex);
                            this.colourReverseMapper.set(colourIndex,currentVal);
                            colourIndex++;
                        }
                    }
                    this.maxColour=this.allColourVals.size-1;
                }
                else{
                    this.allColourVals=this.parentFlexiblePlotManager.forcedAllColourVals;
                    this.colourReverseMapper=this.parentFlexiblePlotManager.forcedColourValsReverseMapper;
                    this.maxColour=this.parentFlexiblePlotManager.maxColourForced;
                }
                this.minColour=0;
                this.colourScale=function (x){return discreteColour(this.maxColour+1)[x]};
            }
        }
    }
    prepareSymbolScale(){
        if(this.symbolColumn!==""){
            if(this.parentFlexiblePlotManager.forcedAllSymbolVals===null){
                let symbolIndex=0;
                for(let q=0;q<this.validIndices.length;++q){
                    const i= this.validIndices[q];
                    const currentVal=this.cohortMetadata.metadata[i][this.symbolColumn];
                    if(!this.allSymbolVals.has(currentVal)){
                        this.allSymbolVals.set(currentVal,symbolIndex);
                        this.symbolReverseMapper.set(symbolIndex,currentVal);
                        symbolIndex++;
                    }
                }
            }else{
                this.allSymbolVals=this.parentFlexiblePlotManager.forcedAllSymbolVals;
                this.symbolReverseMapper=this.parentFlexiblePlotManager.forcedSymbolValsReverseMapper;
            }
        }
    }
    prepareRadiusScale(){
        if(this.radiusColumn!==""){
            if(this.parentFlexiblePlotManager.forcedRadiusScale===null){
                let radiusIndex=0;
                for(let q=0;q<this.validIndices.length;++q){
                    const i= this.validIndices[q];
                    const currentVal=this.cohortMetadata.metadata[i][this.radiusColumn];
                    if(!this.allRadiusVals.has(currentVal)){
                        if(!this.commonSettings.undefinedValues.has(currentVal)){
                            this.allRadiusVals.set(currentVal,radiusIndex);
                            radiusIndex++;
                        }
                    }
                }
                const allRadiusValsArr=Array.from(this.allRadiusVals.keys()).sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                this.maxRadius=Math.max(allRadiusValsArr[allRadiusValsArr.length-1]);
                this.minRadius=Math.min(allRadiusValsArr[0]);
                this.radiusScale=d3XscaleLinear().domain([this.minRadius, this.maxRadius]).range([0.5,4]);
            }else{
                this.radiusScale=d3XscaleLinear().domain([this.parentFlexiblePlotManager.minRadiusForced, this.parentFlexiblePlotManager.maxRadiusForced]).range([0.5,4]);
            }
        }
    }
    preparePlotData(){
        let visitedCategoricalIndices=new Set();
        for(let q=0;q<this.validIndices.length;++q){
            let donorIndexCurrent=0;
            let xPreCurrent=0;
            let xCurrent=0;
            let yPreCurrent=0;
            let yCurrent=0;
            let colourPreCurrent=0;
            let colourCurrent=0;
            let symbolPreCurrent=0;
            let symbolCurrent=0;
            let radiusPreCurrent=0;
            let radiusCurrent=0;
            let stackedBarValuesPre=[];
            const i= this.validIndices[q];
            const currentMetadataItem=this.cohortMetadata.metadata[i];
            const currentDonor=this.cohortMetadata.metadata[i].donor;
            donorIndexCurrent=currentMetadataItem.index;
            if(this.xAxisColumn!==undefined){
                if(this.xAxisType==="numeric"){
                    if(this.commonSettings.undefinedValues.has(currentMetadataItem[this.xAxisColumn])){
                        this.missingDonors.add(currentMetadataItem.index);
                        continue;
                    }
                    xPreCurrent=currentMetadataItem[this.xAxisColumn];
                    xCurrent=this.xScale(xPreCurrent);
                }else{
                    let xIndex = this.allXvals.get(currentMetadataItem[this.xAxisColumn]);
                    if(visitedCategoricalIndices.has(xIndex)){
                        xPreCurrent=xIndex+0.5*Math.random()-0.25;
                        xCurrent=this.xScale(xPreCurrent);
                    }else{
                        visitedCategoricalIndices.add(xIndex);
                        xPreCurrent=xIndex;
                        xCurrent=this.xScale(xPreCurrent);
                    }
                }
            }else{
                if(!this.stackedBarValsPerDonor.has(currentDonor) || !this.totalsPerDonorMap.has(currentDonor)){
                    this.missingDonors.add(currentMetadataItem.index);
                    continue;
                }
                xPreCurrent=this.totalsPerDonorMap.get(currentDonor);
                xCurrent=this.xScale(xPreCurrent);
                stackedBarValuesPre=this.stackedBarValsPerDonor.get(currentDonor).slice();
            }
            if(this.yAxisColumn!==undefined){
                if(this.yAxisType==="numeric"){
                    if(this.commonSettings.undefinedValues.has(currentMetadataItem[this.yAxisColumn])){
                        this.missingDonors.add(currentMetadataItem.index);
                        continue;
                    }
                    yPreCurrent=currentMetadataItem[this.yAxisColumn];
                    yCurrent=this.yScale(yPreCurrent);
                }else{
                    let yIndex = this.allYvals.get(currentMetadataItem[this.yAxisColumn]);
                    if(visitedCategoricalIndices.has(yIndex)){
                        yPreCurrent=yIndex+0.5*Math.random()-0.25;
                        yCurrent=this.yScale(yPreCurrent);
                    }else{
                        visitedCategoricalIndices.add(yIndex);
                        yPreCurrent=yIndex;
                        yCurrent=this.yScale(yPreCurrent);
                    }
                }
            }else{
                if(!this.stackedBarValsPerDonor.has(currentDonor) || !this.totalsPerDonorMap.has(currentDonor)){
                    this.missingDonors.add(currentMetadataItem.index);
                    continue;
                }
                yPreCurrent=this.totalsPerDonorMap.get(currentDonor);
                yCurrent=this.yScale(yPreCurrent);
                stackedBarValuesPre=this.stackedBarValsPerDonor.get(currentDonor).slice();
            }

            if(this.colourColumn!==""){
                const currentColour=currentMetadataItem[this.colourColumn];
                if(this.colourScaleType==="numeric"){
                    if(this.commonSettings.undefinedValues.has(currentColour)){
                        this.missingDonors.add(currentMetadataItem.index);
                        continue;
                    }
                    colourPreCurrent=currentColour;
                    colourCurrent=this.colourScale(colourPreCurrent);
                }else{
                    colourPreCurrent=currentColour;
                    colourCurrent=this.colourScale(this.allColourVals.get(colourPreCurrent));
                }
            }else{
                colourCurrent=discreteColour(1)[0];
            }

            if(this.radiusColumn!==""){
                const currentRadius=currentMetadataItem[this.radiusColumn];
                if(this.commonSettings.undefinedValues.has(currentRadius)){
                    this.missingDonors.add(currentMetadataItem.index);
                    continue;
                }
                radiusPreCurrent=currentRadius;
                radiusCurrent=5*this.radiusScale(radiusPreCurrent);
            }else{
                radiusPreCurrent=1;
                radiusCurrent=5*radiusPreCurrent;
            }

            if(this.symbolColumn!==""){
                symbolPreCurrent=currentMetadataItem[this.symbolColumn];
                symbolCurrent=this.allSymbolVals.get(symbolPreCurrent);
            }else{
                symbolPreCurrent=0;
                symbolCurrent=0;
            }
            this.plotData.push(
                new SinglePlotObject(
                    donorIndexCurrent,
                    xPreCurrent,
                    xCurrent,
                    yPreCurrent,
                    yCurrent,
                    colourPreCurrent,
                    colourCurrent,
                    symbolPreCurrent,
                    symbolCurrent,
                    radiusPreCurrent,
                    radiusCurrent,
                    stackedBarValuesPre,
                )
            );
            this.donorIndexToPlotData.set(donorIndexCurrent,this.plotData.length-1);
        }
    }
    addSvgElementGroups(){
        d3Xselect('#flexiblePlotMain').append("g").attr("id",`flexibleStackedBars_p${this.panelIndex}`);
        this.svgStackedBarsGroup=d3Xselect(`#flexibleStackedBars_p${this.panelIndex}`);
        d3Xselect('#flexiblePlotMain').append("g").attr("id",`subcohortShades_p${this.panelIndex}`);
        d3Xselect('#flexiblePlotMain').append("g").attr("id",`subcohortPremarkers_p${this.panelIndex}`);
        d3Xselect('#flexiblePlotMain').append("g").attr("id",`subcohortMarkers_p${this.panelIndex}`);
        this.svgSubcohortShadeGroup=d3Xselect(`#subcohortShades_p${this.panelIndex}`);
        this.svgSubcohortPremarkerGroup=d3Xselect(`#subcohortPremarkers_p${this.panelIndex}`);
        this.svgSubcohortMarkerGroup=d3Xselect(`#subcohortMarkers_p${this.panelIndex}`);
        d3Xselect('#flexiblePlotMain').append("g").attr("id",`donorPremarkers_p${this.panelIndex}`);
        d3Xselect('#flexiblePlotMain').append("g").attr("id",`donorMarkers_p${this.panelIndex}`);
        this.svgPremarkerGroup=d3Xselect(`#donorPremarkers_p${this.panelIndex}`);
        this.svgMarkerGroup=d3Xselect(`#donorMarkers_p${this.panelIndex}`);
        d3Xselect('#flexiblePlotMain').append("g").attr("id",`flexibleData_p${this.panelIndex}`);
        this.svgDataGroup=d3Xselect(`#flexibleData_p${this.panelIndex}`);

    }
    addPlotSupporters(){
        if(this.svgPlotSupportGroup!==null){
            $(`#flexiblePlotSupportGroup_p${this.panelIndex}`).remove();
        }
        this.svgPlotSupportGroup=d3Xselect('#flexiblePlotMain').append("g").attr("id",`flexiblePlotSupportGroup_p${this.panelIndex}`);
        const xCategorical=this.xAxisColumn!==undefined&&this.cohortMetadata.metadataDataTypes.get(this.xAxisColumn)!=="numeric";
        const yCategorical=this.yAxisColumn!==undefined&&this.cohortMetadata.metadataDataTypes.get(this.yAxisColumn)!=="numeric";
        const xValues=Array.from(this.allXvals.keys());
        const yValues=Array.from(this.allYvals.keys());
        const targetWidth=0.99*this.svgWidth;
        const targetHeight=0.99*this.svgHeight;
        this.svgPlotSupportGroup.append("rect")
            .attr("x", this.svgStartX)
            .attr("y", this.svgStartY)
            .attr("height", targetHeight)
            .attr("width", targetWidth)
            .style("stroke", "Black")
            .style("fill", "none")
            .style("stroke-width", 1);
        const xAxisLabelFont=this.fontManager.fontTree.get("flexiblePlotFontTargetSelector").get("xAxisLabels").generateFontCssText();
        if(!xCategorical){
            if(this.bottomRow){
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--x")
                    .attr("id",`flexibleXaxisLabels_p${this.panelIndex}`)
                    .call(d3XaxisBottom(this.xScale).ticks(5).tickSize(4).tickPadding(1))
                    .attr("transform",`translate(0,${this.svgStartY+targetHeight})`)
                    .selectAll("text")
                    .attr("transform", "rotate(90)")
                    .style("text-anchor", "start")
                    .style("font", xAxisLabelFont);
            }else{
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--x")
                    .attr("id",`flexibleXaxisLabels_p${this.panelIndex}`)
                    .call(d3XaxisTop(this.xScale).ticks(5).tickSize(4).tickPadding(1))
                    .attr("transform",`translate(0,${this.svgStartY})`)
                    .selectAll("text")
                    .attr("transform", "rotate(90)")
                    .style("text-anchor", "start")
                    .style("font", xAxisLabelFont);
            }
        }else{
            if(this.bottomRow){
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--x")
                    .call(d3XaxisBottom(this.xScale)
                        .tickSize(4)
                        .tickValues(Array(xValues.length).fill().map((e,i)=>i+0.5))
                        .tickFormat((d,i)=> {return xValues[i];})
                        .tickPadding(1)
                    )
                    .attr("transform",`translate(0,${this.svgStartY+targetHeight})`)
                    .attr("id",`flexibleXaxisLabels_p${this.panelIndex}`)
                    .selectAll("text")
                    .attr("transform", "rotate(90)")
                    .style("text-anchor", "start")
                    .style("font", xAxisLabelFont);
            }else{
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--x")
                    .call(d3XaxisTop(this.xScale)
                        .tickSize(4)
                        .tickValues(Array(xValues.length).fill().map((e,i)=>i+0.5))
                        .tickFormat((d,i)=> {return xValues[i];})
                        .tickPadding(1)
                    )
                    .attr("transform",`translate(0,${this.svgStartY})`)
                    .attr("id",`flexibleXaxisLabels_p${this.panelIndex}`)
                    .selectAll("text")
                    .attr("transform", "rotate(90)")
                    .style("text-anchor", "start")
                    .style("font", xAxisLabelFont);
            }
        }
        const xAxisTitleFont = this.fontManager.fontTree.get("flexiblePlotFontTargetSelector").get("xAxisTitle").generateFontCssText();
        let helperPathX=d3Xpath();
        helperPathX.moveTo(this.svgStartX, this.svgStartY+targetHeight);
        helperPathX.lineTo(this.svgStartX+targetWidth, this.svgStartY+targetHeight);
        this.svgPlotSupportGroup.append("path")
            .attr("id", `flexibleXaxisTitleHelper_p${this.panelIndex}`)
            .attr("d", helperPathX)
            .style("display","none");
        this.svgPlotSupportGroup.append("text")
            .attr("class", "markerText")
            .style("dominant-baseline",  "baseline")
            .style("alignment-baseline", "baseline")
            .attr("startOffset","50%")
            .attr("text-anchor", "middle")
            // .style("background-color","White")
            .attr("id",`flexibleXaxisTitle_p${this.panelIndex}`)
            .append("textPath")
            .attr("xlink:href", `#flexibleXaxisTitleHelper_p${this.panelIndex}`)
            .style("dominant-baseline",  "baseline")
            .style("alignment-baseline", "baseline")
            .attr("startOffset","50%")
            .attr("text-anchor", "middle")
            // .style("background-color","White")
            .style("font", xAxisTitleFont)
            .text(this.xAxisColumn);
        const yAxisLabelFont=this.fontManager.fontTree.get("flexiblePlotFontTargetSelector").get("yAxisLabels").generateFontCssText();
        if(!yCategorical){
            if(this.leftMostColumn){
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3XaxisLeft(this.yScale).tickSize(4).tickPadding(1))
                    .attr("transform",`translate(${this.svgStartX},0)`)
                    .selectAll("text")
                    .attr("dy", ".1em")
                    .style("font", yAxisLabelFont);
            }else if(this.rightMostColumn){
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3XaxisRight(this.yScale).tickSize(4).tickPadding(1))
                    .attr("transform",`translate(${this.svgStartX+targetWidth},0)`)
                    .selectAll("text")
                    .attr("dy", ".1em")
                    .style("font", yAxisLabelFont);
            }else{
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3XaxisLeft(this.yScale).tickSize(4).tickPadding(1))
                    .attr("transform",`translate(${this.svgStartX+targetWidth},0)`)
                    .selectAll("text")
                    .attr("dy", ".1em")
                    .style("font", yAxisLabelFont);
            }
        }else{
            if(this.leftMostColumn){
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3XaxisLeft(this.yScale).tickSize(4)
                        .tickValues(Array(yValues.length).fill().map((e,i)=>i+0.5))
                        .tickFormat((d,i)=> {return yValues[i];})
                        .tickPadding(1)
                    )
                    .attr("transform",`translate(${this.svgStartX},0)`)
                    .selectAll("text")
                    .attr("dy", ".05em")
                    .style("text-anchor", "end")
                    .style("font", yAxisLabelFont);
            }else if(this.rightMostColumn){
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3XaxisRight(this.yScale).tickSize(4)
                        .tickValues(Array(yValues.length).fill().map((e,i)=>i+0.5))
                        .tickFormat((d,i)=> {return yValues[i];})
                        .tickPadding(1)
                    )
                    .attr("transform",`translate(${this.svgStartX+targetWidth},0)`)
                    .selectAll("text")
                    .attr("dy", ".05em")
                    .style("text-anchor", "end")
                    .style("font", yAxisLabelFont);
            }else{
                this.svgPlotSupportGroup.append("g")
                    .attr("class", "axis axis--y")
                    .call(d3XaxisLeft(this.yScale).tickSize(4)
                        .tickValues(Array(yValues.length).fill().map((e,i)=>i+0.5))
                        .tickFormat((d,i)=> {return yValues[i];})
                        .tickPadding(1)
                    )
                    .attr("transform",`translate(${this.svgStartX+targetWidth},0)`)
                    .selectAll("text")
                    .attr("dy", ".05em")
                    .style("text-anchor", "end")
                    .style("font", yAxisLabelFont);
            }
        }
        const yAxisTitleFont = this.fontManager.fontTree.get("flexiblePlotFontTargetSelector").get("yAxisTitle").generateFontCssText();
        let helperPathY=d3Xpath();
        helperPathY.moveTo(this.svgStartX +(this.rightMostColumn?targetWidth:0), this.svgStartY);
        helperPathY.lineTo(this.svgStartX+(this.rightMostColumn?targetWidth:0), this.svgStartY+targetHeight);
        this.svgPlotSupportGroup.append("path")
            .attr("id", `flexibleYaxisTitleHelper_p${this.panelIndex}`)
            .attr("d", helperPathY)
            .style("display","none");
        this.svgPlotSupportGroup.append("text")
            .attr("class", "markerText")
            .attr("id",`flexibleYaxisTitle_p${this.panelIndex}`)
            .style("dominant-baseline", "baseline")
            .style("alignment-baseline", "baseline")
            .attr("startOffset","50%")
            .attr("text-anchor", "middle")
            .append("textPath")
            .attr("xlink:href", `#flexibleYaxisTitleHelper_p${this.panelIndex}`)
            .style("dominant-baseline", "baseline")
            .style("alignment-baseline","baseline")
            .attr("startOffset","50%")
            .attr("text-anchor", "middle")
            .style("font", yAxisTitleFont)
            .html(this.yAxisColumn);
        if(!this.stackedBarplotMode){
            if(xCategorical&&yCategorical){
                this.addXYCategoricalGrid(xValues,yValues);
            }else if(xCategorical){
                this.addVerticalBoxplots();
                this.addVerticalKdes();
            }else if(yCategorical){
                this.addHorizontalBoxplots();
                this.addHorizontalKdes();
            }else{
                if(this.xAxisColumn===this.yAxisColumn) {
                    let xs = [];
                    for (let q = 0; q < this.validIndices.length; ++q) {
                        const i = this.validIndices[q];
                        const xVal = this.cohortMetadata.metadata[i][this.xAxisColumn];
                        if (!this.commonSettings.undefinedValues.has(xVal)) {
                            xs.push(xVal);
                        }
                    }
                    this.addSingleDiagonalBoxplot(xs);
                    this.addSingleDiagonalKde(xs);
                }
            }
        }else{
            this.addStackedBars();
        }
    }
    addVerticalBoxplots(){
        this.addBoxplots(this.allXvals,"x1","x2","y1","y2",false);
    }
    addHorizontalBoxplots(){
        this.addBoxplots(this.allYvals,"y2","y1","x1","x2",true);
    }
    addBoxplots(vals,key1,key2,key3,key4,horizontalMode){
        let quartilesPerCategory=new Map();
        this.samplesPerCategory.forEach((values,category,x)=>{
            if(values.length>2){
                quartilesPerCategory.set(category,math.quantileSeq(values,[0.1,0.25,0.5,0.75,0.9]));
            }
        });
        const factor=horizontalMode?-1:1;
        let quartileRectData=[];
        let statLineData=[];
        vals.forEach((loc,category,x)=>{
            if(quartilesPerCategory.has(category)){
                let quartiles = quartilesPerCategory.get(category);
                let tmpObj1 = {};
                let tmpObj2 = {};
                let tmpObj3 = {};
                let tmpObj4 = {};
                let tmpObj5 = {};
                let tmpObj6 = {};
                tmpObj1[key1]=loc;
                tmpObj1[key2]=loc+0.2;
                tmpObj1[key3]=quartiles[1];
                tmpObj1[key4]=quartiles[3];
                quartileRectData.push(tmpObj1);
                tmpObj2[key1]=loc;
                tmpObj2[key2]=loc+factor*0.2;
                tmpObj2[key3]=quartiles[2];
                tmpObj2[key4]=quartiles[2];
                statLineData.push(tmpObj2);
                tmpObj3[key1]=loc;
                tmpObj3[key2]=loc;
                tmpObj3[key3]=quartiles[3];
                tmpObj3[key4]=quartiles[4];
                statLineData.push(tmpObj3);
                tmpObj4[key1]=loc;
                tmpObj4[key2]=loc;
                tmpObj4[key3]=quartiles[0];
                tmpObj4[key4]=quartiles[1];
                statLineData.push(tmpObj4);
                tmpObj5[key1]=loc;
                tmpObj5[key2]=loc+factor*0.08;
                tmpObj5[key3]=quartiles[0];
                tmpObj5[key4]=quartiles[0];
                statLineData.push(tmpObj5);
                tmpObj6[key1]=loc;
                tmpObj6[key2]=loc+factor*0.08;
                tmpObj6[key3]=quartiles[4];
                tmpObj6[key4]=quartiles[4];
                statLineData.push(tmpObj6);
            }
        });
        this.svgPlotSupportGroup.selectAll('.quartileRects')
            .data(quartileRectData)
            .enter().append("rect")
            .attr("class", 'quartileRects')
            .attr('x',(d)=>{return this.xScale(d.x1);})
            .attr('y',(d)=>{return this.yScale(d.y2);})
            .attr('width',(d)=>{return Math.abs(this.xScale(d.x2)-this.xScale(d.x1));})
            .attr('height',(d)=>{return Math.abs(this.yScale(d.y2)-this.yScale(d.y1));})
            .style("stroke-width", 1.5)
            .style("stroke","black")
            .style("fill","none");
        this.svgPlotSupportGroup.selectAll('.statLines')
            .data(statLineData)
            .enter().append("line")
            .attr("class", 'statLines')
            .attr('x1',(d)=>{return this.xScale(d.x1);})
            .attr('x2',(d)=>{return this.xScale(d.x2);})
            .attr('y1',(d)=>{return this.yScale(d.y1);})
            .attr('y2',(d)=>{return this.yScale(d.y2);})
            .style("stroke-width", 1.5)
            .style("stroke", "black");
    }
    addSingleDiagonalBoxplot(values){
        if(values.length<3){
            return;
        }
        const quartiles=math.quantileSeq(values,[0.1,0.25,0.5,0.75,0.9]);
        let statLineData=[];

        const largeOffset=0.2*(this.maxX-this.minX)/Math.sqrt(2);
        const smallOffset=0.08*(this.maxX-this.minX)/Math.sqrt(2);

        //25th
        statLineData.push(
            {
                x1:quartiles[1],
                y1:quartiles[1],
                x2:quartiles[1]+largeOffset,
                y2:quartiles[1]-largeOffset,
            }
        );
        //50th
        statLineData.push(
            {
                x1:quartiles[2],
                y1:quartiles[2],
                x2:quartiles[2]+largeOffset,
                y2:quartiles[2]-largeOffset,
            }
        );
        //75th
        statLineData.push(
            {
                x1:quartiles[3],
                y1:quartiles[3],
                x2:quartiles[3]+largeOffset,
                y2:quartiles[3]-largeOffset,
            }
        );
        //10th
        statLineData.push(
            {
                x1:quartiles[0],
                y1:quartiles[0],
                x2:quartiles[0]+smallOffset,
                y2:quartiles[0]-smallOffset,
            }
        );
        //90th
        statLineData.push(
            {
                x1:quartiles[4],
                y1:quartiles[4],
                x2:quartiles[4]+smallOffset,
                y2:quartiles[4]-smallOffset,
            }
        );
        //25th-75th inner
        statLineData.push(
            {
                x1:quartiles[1],
                y1:quartiles[1],
                x2:quartiles[3],
                y2:quartiles[3],
            }
        );
        //25th-75th outer
        statLineData.push(
            {
                x1:quartiles[1]+largeOffset,
                y1:quartiles[1]-largeOffset,
                x2:quartiles[3]+largeOffset,
                y2:quartiles[3]-largeOffset,
            }
        );


        this.svgPlotSupportGroup.selectAll('.statLines')
            .data(statLineData)
            .enter().append("line")
            .attr("class", 'statLines')
            .attr('x1',(d)=>{return this.xScale(d.x1);})
            .attr('x2',(d)=>{return this.xScale(d.x2);})
            .attr('y1',(d)=>{return this.yScale(d.y1);})
            .attr('y2',(d)=>{return this.yScale(d.y2);})
            .style("stroke-width", 1.5)
            .style("stroke", "black");
    }
    addVerticalKdes(){
        this.samplesPerCategory.forEach((values,category,x)=>{
            const categoryX=this.allXvals.get(category);
            const [kdeRange,kdeFit,maxDensity]=calculateKde(values);
            const line = d3Xline()
                .x((d)=>{
                    return this.xScale(categoryX-d.density);
                })
                .y((d)=> {
                    return this.yScale(d.val)
                });
            const densityScale=d3XscaleLinear().domain([0, maxDensity]).range([0,0.2]);
            const N = kdeRange.length;
            let densityPoints=[];
            for(let i=0;i<N;++i){
                densityPoints.push({
                    val:kdeRange[i],
                    density:densityScale(kdeFit[i])
                });
            }
            this.svgPlotSupportGroup.append("path")
                .datum(densityPoints)
                .attr("fill", "none")
                .style("stroke-linejoin", "round")
                .style("stroke-linecap", "round")
                .style("stroke-width", 1.5)
                .style("stroke", "black")
                .attr("d", line);
            this.svgPlotSupportGroup
                .append("line")
                .attr('x1',this.xScale(categoryX))
                .attr('x2',this.xScale(categoryX))
                .attr('y1',this.yScale(this.minY))
                .attr('y2',this.yScale(this.maxY))
                .style("stroke-dasharray", "5 5")
                .style("stroke-width", 1.5)
                .style("stroke", "black");
        });
    }
    addHorizontalKdes(){
        this.samplesPerCategory.forEach((values,category,x)=>{
            const categoryY=this.allYvals.get(category);
            const [kdeRange,kdeFit,maxDensity]=calculateKde(values);
            const line = d3Xline()
                .x((d)=>{
                    return this.xScale(d.val);
                })
                .y((d)=> {
                    return this.yScale(categoryY+d.density)
                });
            const densityScale=d3XscaleLinear().domain([0, maxDensity]).range([0,0.2]);
            const N = kdeRange.length;
            let densityPoints=[];
            for(let i=0;i<N;++i){
                densityPoints.push({
                    val:kdeRange[i],
                    density:densityScale(kdeFit[i])
                });
            }
            this.svgPlotSupportGroup.append("path")
                .datum(densityPoints)
                .attr("fill", "none")
                .style("stroke-linejoin", "round")
                .style("stroke-linecap", "round")
                .style("stroke-width", 1.5)
                .style("stroke", "black")
                .attr("d", line);
            this.svgPlotSupportGroup
                .append("line")
                .attr('x1',this.xScale(this.minX))
                .attr('x2',this.xScale(this.maxX))
                .attr('y1',this.yScale(categoryY))
                .attr('y2',this.yScale(categoryY))
                .style("stroke-dasharray", "5 5")
                .style("stroke-width", 1.5)
                .style("stroke", "black");
        });
    }
    addStackedBars(){
        const plotDataLen=this.plotData.length;
        const zeroY=this.yScale(0);
        const zeroX=this.xScale(0);
        for(let i=0;i<plotDataLen;++i){
            const currentPlotDataItem=this.plotData[i];
            const barStackLen=currentPlotDataItem.stackedBarValuesPre.length;
            if(this.xAxisColumn!==undefined){
                const startX=this.xScale(currentPlotDataItem.xPre-0.4);
                const endX=this.xScale(currentPlotDataItem.xPre+0.4);
                const width=endX-startX;
                for(let j=0;j<barStackLen;++j){
                    const startY=this.yScale(currentPlotDataItem.stackedBarValuesPreCumulative[j]);
                    const height=zeroY-startY;
                    const column=currentPlotDataItem.stackedBarValuesPre[j].column;
                    const currentColour=this.usedColumnsInStackedBar.has(column)?this.colourScaleStackedBar(this.usedColumnsInStackedBar.get(column)):"none";
                    this.svgStackedBarsGroup.append("rect")
                        .attr("x", startX)
                        .attr("y", startY)
                        .attr("width", width)
                        .attr("height", height)
                        .style("stroke", "Black")
                        .style("fill", currentColour)
                        .style("stroke-width", 0.5)
                        .append("svg:title")
                        .text(()=>{return `${this.cohortMetadata.metadata[currentPlotDataItem.donorIndex].donor}:${column}=${currentPlotDataItem.stackedBarValuesPre[j].value}`;});
                }
            }else{
                const endY=this.yScale(currentPlotDataItem.yPre-0.4);
                const startY=this.yScale(currentPlotDataItem.yPre+0.4);
                const height=endY-startY;
                for(let j=0;j<barStackLen;++j){
                    const startX=zeroX;
                    const width=this.xScale(currentPlotDataItem.stackedBarValuesPreCumulative[j])-zeroX;
                    const column=currentPlotDataItem.stackedBarValuesPre[j].column;
                    const currentColour=this.usedColumnsInStackedBar.has(column)?this.colourScaleStackedBar(this.usedColumnsInStackedBar.get(column)):"none";
                    this.svgStackedBarsGroup.append("rect")
                        .attr("x", startX)
                        .attr("y", startY)
                        .attr("width", width)
                        .attr("height", height)
                        .style("stroke", "Black")
                        .style("fill", currentColour)
                        .style("stroke-width", 0.5)
                        .append("svg:title")
                        .text(()=>{return `${this.cohortMetadata.metadata[currentPlotDataItem.donorIndex].donor}:${column}=${currentPlotDataItem.stackedBarValuesPre[j].value}`;});
                }
            }
        }
    }
    addSingleDiagonalKde(values){
        const [kdeRange,kdeFit,maxDensity]=calculateKde(values);
        const line = d3Xline()
            .x((d)=>{
                return this.xScale(d.val-d.density/Math.sqrt(2));
            })
            .y((d)=> {
                return this.yScale(d.val+d.density/Math.sqrt(2))
            });
        const largeOffset=0.2*(this.maxX-this.minX)/Math.sqrt(2);
        const densityScale=d3XscaleLinear().domain([0, maxDensity]).range([0,largeOffset]);
        const N = kdeRange.length;
        let densityPoints=[];
        for(let i=0;i<N;++i){
            densityPoints.push({
                val:kdeRange[i],
                density:densityScale(kdeFit[i])
            });
        }
        this.svgPlotSupportGroup.append("path")
            .datum(densityPoints)
            .attr("fill", "none")
            .style("stroke-linejoin", "round")
            .style("stroke-linecap", "round")
            .style("stroke-width", 1.5)
            .style("stroke", "black")
            .attr("d", line);
        this.svgPlotSupportGroup
            .append("line")
            .attr('x1',this.xScale(this.minX))
            .attr('x2',this.xScale(this.maxX))
            .attr('y1',this.yScale(this.minX))
            .attr('y2',this.yScale(this.maxX))
            .style("stroke-dasharray", "5 5")
            .style("stroke-width", 1.5)
            .style("stroke", "black");
    }
    addXYCategoricalGrid(xValues,yValues){
        const xDataLocs=Array(xValues.length).fill().map((e,i)=>i+0.5);
        let xGridLocs=new Set();
        xDataLocs.forEach((loc)=>{
            xGridLocs.add(loc-0.5);
            xGridLocs.add(loc+0.5);
        });
        const yDataLocs=Array(yValues.length).fill().map((e,i)=>i+0.5);
        let yGridLocs=new Set();
        yDataLocs.forEach((loc)=>{
            yGridLocs.add(loc-0.5);
            yGridLocs.add(loc+0.5);
        });

        let gridObjs=[];
        xGridLocs.forEach((loc)=>{
            let tmpObj={};
            tmpObj.x1=loc;
            tmpObj.x2=loc;
            tmpObj.y1=0;
            tmpObj.y2=(yValues.length+0.5)*1.1;
            gridObjs.push(tmpObj);
        });
        yGridLocs.forEach((loc)=>{
            let tmpObj={};
            tmpObj.x1=0;
            tmpObj.x2=(xValues.length+0.5)*1.1;
            tmpObj.y1=loc;
            tmpObj.y2=loc;
            gridObjs.push(tmpObj);
        });
        this.svgPlotSupportGroup.selectAll('.gridLines')
            .data(gridObjs)
            .enter().append("line")
            .attr("class", 'gridLines')
            .attr('x1',(d)=>{return this.xScale(d.x1);})
            .attr('x2',(d)=>{return this.xScale(d.x2);})
            .attr('y1',(d)=>{return this.yScale(d.y1);})
            .attr('y2',(d)=>{return this.yScale(d.y2);})
            .style("stroke-width", 0.75)
            .style("stroke", "black");
    }
    addPlotDataPoints(){
        this.baseSize=Math.pow(2,parseInt($('#flexiblePlotBaseSizeFactorController').val())-3);
        this.svgDataGroup.selectAll('.flexibleDataPoints')
            .data(this.plotData)
            .enter().append("path")
            .attr("class", 'flexibleDataPoints')
            .style('stroke', (d)=>{return d.colour;})
            .style('fill', (d)=>{return d.colour;})
            .attr('d',
                d3Xsymbol()
                    .type((d)=> { return d3Xsymbols[d.symbol];})
                    .size((d)=> { return this.baseSize*Math.pow(d.radius,2)*AREAFACTORS[d.symbol];})
            )
            .attr("transform",(d)=>{return `translate(${d.x},${d.y})`;})
            .append("svg:title")
            .text((d)=>{return this.cohortMetadata.prepareHoverText(d.donorIndex,this.includedHoverColumns);});
        this.svgDataGroup.on("click", ()=> {
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            const target=d3Xselect(d3Xevent.target).datum();
            if(target.donorIndex!==undefined){
                this.parentFlexiblePlotManager.markDonor(target.donorIndex,true);
                this.directMarkedDonors.add(target.donorIndex);
            }
            this.commonSettings.fastRelease();
        });
    }
    shadeSubcohortSilent(subcohortIndex,concavity){
        if(this.subcohortShades.has(subcohortIndex)){
            this.subcohortShades.delete(subcohortIndex);
        }
        this.subcohortShades.set(subcohortIndex,this.calculateShadingParameters(subcohortIndex,concavity));
    }
    replot(){
        this.addSubcohortShades();
        this.addPlotDataPoints();
        this.remarkDonors();
    }
    shadeSubcohort(subcohortIndex,concavity){
        this.shadeSubcohortSilent(subcohortIndex,concavity);
        this.replot();
    }
    calculateShadingParameters(subcohortIndex,concavity){
        let pointCloudToShade=[];
        for(let i=0; i<this.plotData.length;++i){
            if(this.selectionManager.registeredSubcohorts.get(subcohortIndex).has(this.plotData[i].donorIndex)){
                pointCloudToShade.push([this.plotData[i].x,this.plotData[i].y]);
            }
        }
        if(pointCloudToShade.length>2){
            return concaveman(pointCloudToShade,concavity);
        }else{
            return [];
        }
    }
    removeSubcohortShade(subcohortIndex){
        this.subcohortShades.delete(subcohortIndex);
        $(`#flexiblePlotSubcohortMarkerHelper_${subcohortIndex}`).remove();
        $(`#flexiblePlotSubcohortMarker_${subcohortIndex}`).remove();
        $(`#flexiblePlotSubcohortShade_${subcohortIndex}`).remove();
    }
    addSubcohortShades(){
        this.clearShadedSubcohorts();
        let i=0;
        if(this.subcohortShades.size>0){
            $('#clearShadedSubcohorts').css('display','inline');
        }
        const colorPicker=discreteColour(this.subcohortShades.size);
        this.subcohortShades.forEach((concaveHull, subcohortIndex, dummy)=>{
            if(concaveHull.length>2){
                let midX=0;
                let midY=0;
                this.svgSubcohortShadeGroup.append("path")
                    .attr("class", 'subcohortShadeElements')
                    .attr("id",`flexiblePlotSubcohortShade_p${this.panelIndex}_${subcohortIndex}`)
                    .style('stroke', "none")
                    .style('fill', colorPicker[i])
                    .style('opacity',0.2)
                    .attr('d',()=>{
                        let concaveHullPath=d3Xpath();
                        concaveHullPath.moveTo(concaveHull[0][0], concaveHull[0][1]);
                        midX+=concaveHull[0][0];
                        midY+=concaveHull[0][1];
                        for(let j=1;j<concaveHull.length;++j){
                            concaveHullPath.lineTo(concaveHull[j][0], concaveHull[j][1]);
                            midX+=concaveHull[j][0];
                            midY+=concaveHull[j][1];
                        }
                        concaveHullPath.closePath();
                        return concaveHullPath;
                    })
                    .on("contextmenu", ()=> {
                        d3Xevent.preventDefault();
                        if(this.commonSettings.interactionLock){
                            return;
                        }
                        this.removeSubcohortShade(subcohortIndex);
                    });
                const el = document.getElementById('flexiblePlotMain');
                const rect = el.getBoundingClientRect();
                const targetWidth = rect.width;
                const helperX = midX/concaveHull.length;
                const helperY = midY/concaveHull.length;
                let helperPath=d3Xpath();
                helperPath.moveTo(helperX, helperY);
                helperPath.lineTo(targetWidth, helperY);
                helperPath.closePath();

                const donorLabelFont = this.fontManager.fontTree.get("flexiblePlotFontTargetSelector").get("donorLabels").generateFontCssText();

                this.svgSubcohortPremarkerGroup.append("path")
                    .attr("id", `flexiblePlotSubcohortMarkerHelper_p${this.panelIndex}_${subcohortIndex}`)
                    .attr("d", helperPath)
                    .style("display","none");
                this.svgSubcohortMarkerGroup.append("text")
                    .style("dominant-baseline", "middle")
                    .style("alignment-baseline", "middle")
                    .append("textPath")
                    .attr("class",`markerText`)
                    .attr("id", `flexiblePlotSubcohortMarker_p${this.panelIndex}_${subcohortIndex}`)
                    .attr("xlink:href", `#flexiblePlotSubcohortMarkerHelper_p${this.panelIndex}_${subcohortIndex}`)
                    .style("dominant-baseline", "middle")
                    .style("alignment-baseline", "middle")
                    .style("text-anchor","start")
                    .attr("startOffset", "0%")
                    .style("font", donorLabelFont)
                    .style("fill", colorPicker[i])
                    .html(this.selectionManager.registeredSubcohortNames.get(subcohortIndex))
                    .call(d3Xdrag()
                        .on("start", ()=>{

                        })
                        .on("drag", ()=>{
                            const helperX = d3Xevent.x;
                            const helperY = d3Xevent.y;
                            let helperPath = d3Xpath();
                            helperPath.moveTo(helperX, helperY);
                            helperPath.lineTo(targetWidth, helperY);
                            helperPath.closePath();
                            d3Xselect(`#flexiblePlotSubcohortMarkerHelper_p${this.panelIndex}_${subcohortIndex}`).attr("d", helperPath);
                            let elq = $(`#flexiblePlotSubcohortMarker_p${this.panelIndex}_${subcohortIndex}`);
                            elq.hide();
                            setTimeout(()=>{
                                elq.show();
                            },10);
                        })
                        .on("end", ()=>{

                        }));
                i+=1;
            }
        });
    }
    clearShadedSubcohorts(){
        if(this.svgSubcohortShadeGroup!==null){
            this.svgSubcohortShadeGroup.html("");
        }
        if(this.svgSubcohortPremarkerGroup!==null){
            this.svgSubcohortPremarkerGroup.html("");
        }
        if(this.svgSubcohortMarkerGroup!==null){
            this.svgSubcohortMarkerGroup.html("");
        }
    }
    remarkDonors(){
        if(this.commonSettings.interactionLock){
            return;
        }
        this.commonSettings.fastLock();
        let donorsToClear=[];
        this.markedDonors.forEach((donorIndex)=>{
            donorsToClear.push(donorIndex);
        });
        this.clearMarkedDonors();
        $("#subcohortSelectionFromFlexiblePlotDescription").empty();
        donorsToClear.forEach((donorIndex)=>{
            this.markDonor(donorIndex,false);
        });
        this.commonSettings.fastRelease();
    }
    clearMarkedDonors(){
        this.svgPremarkerGroup.html("");
        this.svgMarkerGroup.html("");
        this.markedDonors.clear();
    }
    removeDonorMark(donorIndex){
        $(`#flexiblePlotDonorMarkerHelper_p${this.panelIndex}_${donorIndex}_dragbridge`).remove();
        $(`#flexiblePlotDonorMarkerHelper_p${this.panelIndex}_${donorIndex}`).remove();
        $(`#flexiblePlotDonorMarker_p${this.panelIndex}_${donorIndex}`).remove();
        this.markedDonors.delete(donorIndex);
        if(this.markedDonors.size===0){
            $('#clearMarkedDonorsFromFlexiblePlot').css('display','none');
            $('#subcohortSelectionFromFlexiblePlotGroup').css('display','none');
            $('#flexibleSubcohortSelectionName').css('display','none');
        }
    }
    markDonor(donorIndex,removeExisting){
        if(this.missingDonors.has(donorIndex)){
            return false;
        }
        const marker = $(`#flexiblePlotDonorMarker_p${this.panelIndex}_${donorIndex}`);
        if(marker.length){
            if(removeExisting){
                marker.remove();
                this.removeDonorMark(donorIndex);
                return false;
            }else{
                return true;
            }
        }
        const dataPoint=this.plotData[this.donorIndexToPlotData.get(donorIndex)];
        $('#clearMarkedDonorsFromFlexiblePlot').css('display','inline');
        $('#subcohortSelectionFromFlexiblePlotGroup').css('display','inline');
        $('#flexibleSubcohortSelectionName').css('display','inline');
        this.markedDonors.add(donorIndex);
        const el = document.getElementById('flexiblePlotMain');
        const rect = el.getBoundingClientRect();
        const targetWidth = rect.width;

        const xInit = dataPoint.x;
        const helperY = dataPoint.y;
        const helperX = xInit + Math.sqrt(0.5*this.baseSize*dataPoint.radius);
        let helperPath=d3Xpath();
        helperPath.moveTo(helperX, helperY);
        helperPath.lineTo(targetWidth, helperY);

        const donorLabelFont = this.fontManager.fontTree.get("flexiblePlotFontTargetSelector").get("donorLabels").generateFontCssText();

        this.svgPremarkerGroup.append("path")
            .attr("id", `flexiblePlotDonorMarkerHelper_p${this.panelIndex}_${donorIndex}`)
            .attr("d", helperPath)
            .style("display","none");
        this.svgMarkerGroup.append("text")
            .style("dominant-baseline", "middle")
            .style("alignment-baseline", "middle")
            .append("textPath")
            .attr("class",`markerText`)
            .attr("id", `flexiblePlotDonorMarker_p${this.panelIndex}_${donorIndex}`)
            .attr("xlink:href", `#flexiblePlotDonorMarkerHelper_p${this.panelIndex}_${donorIndex}`)
            .style("dominant-baseline", "middle")
            .style("alignment-baseline", "middle")
            .style("text-anchor","start")
            .attr("startOffset", "0%")
            .style("font", donorLabelFont)
            .html(this.cohortMetadata.prepareLabelText(donorIndex,this.includedLabelColumns))
            .on("contextmenu", ()=> {
                d3Xevent.preventDefault();
                if(this.commonSettings.interactionLock){
                    return;
                }
                this.removeDonorMark(donorIndex);
            })
            .call(d3Xdrag()
                .on("start", ()=>{
                    $(`#flexiblePlotDonorMarkerHelper_p${this.panelIndex}_${donorIndex}_dragbridge`).remove()
                })
                .on("drag", ()=>{
                    const helperY = d3Xevent.y;
                    const helperX = d3Xevent.x + Math.sqrt(0.5*this.baseSize*dataPoint.radius);
                    let helperPath = d3Xpath();
                    helperPath.moveTo(helperX, helperY);
                    helperPath.lineTo(targetWidth, helperY);
                    helperPath.closePath();
                    d3Xselect(`#flexiblePlotDonorMarkerHelper_p${this.panelIndex}_${donorIndex}`).attr("d", helperPath);
                    let elq = $(`#flexiblePlotDonorMarker_p${this.panelIndex}_${donorIndex}`);
                    elq.hide();
                    setTimeout(()=>{
                        elq.show();
                    },10);
                })
                .on("end", ()=>{
                    const xInit = dataPoint.x;
                    const helperY = dataPoint.y;
                    const helperX = xInit + Math.sqrt(0.5*this.baseSize*dataPoint.radius);
                    const xInit2 = d3Xevent.x;
                    let yInit2 = d3Xevent.y;
                    let helperX2 = xInit2 + Math.sqrt(0.5*this.baseSize*dataPoint.radius);
                    if(yInit2>helperY){
                        yInit2-=Math.sqrt(0.5*dataPoint.radius);
                    }else if(yInit2<helperY){
                        yInit2+=2*Math.sqrt(0.5*dataPoint.radius);
                    }
                    let helperPath=d3Xpath();
                    helperPath.moveTo(helperX,helperY);
                    helperPath.lineTo(helperX2,yInit2);
                    helperPath.closePath();
                    this.svgPremarkerGroup.append("path")
                        .attr("id", `flexiblePlotDonorMarkerHelper_p${this.panelIndex}_${donorIndex}_dragbridge`)
                        .attr("d", helperPath)
                        .style("stroke","Black")
                        .style("display","inline");
                }));
        return true;

    }
    getNamePrefix(suffix){
        const xAxisPrefix=this.xAxisColumn.replace(/ dim1$/, '').replace(/ dim2$/, '');
        const yAxisPrefix=this.yAxisColumn.replace(/ dim1$/, '').replace(/ dim2$/, '');
        if(xAxisPrefix===yAxisPrefix){
            return `${xAxisPrefix}_${suffix}`;
        }else{
            return `x:${this.xAxisColumn}_y:${this.yAxisColumn}_${suffix}`;
        }
    }
    runKmeans(namePrefix,sendShadingSignalLater){
        const k=parseInt($('#kmeansK').slider().val());
        const distanceFuncName=$('#FlexibleClusteringDistanceSelector').val();
        let vectors = [];
        let matchingIndices = [];
        for (let i = 0 ; i < this.plotData.length ; ++i) {
            vectors.push([this.plotData[i].xPre , this.plotData[i].yPre]);
            matchingIndices.push(this.plotData[i].donorIndex);
        }
        const distanceFunc=function (a,b){
            return DistanceMeasures[distanceFuncName](a,b);
        };
        kmeans.clusterize(vectors, {k: k,distance:distanceFunc}, (err,res) => {
            if(err){
                console.error(err);
            }
            else{
                let clusterDonorIndices=[];
                for(let i=0;i<k;++i){
                    clusterDonorIndices.push([]);
                    for(let j=0;j<res[i].clusterInd.length;++j){
                        clusterDonorIndices[i].push(matchingIndices[res[i].clusterInd[j]]);
                    }
                }
                // const namePrefix=this.getNamePrefix(`k:${k}_${distanceFuncName}`);
                this.cohortMetadata.createMultipleGroups(clusterDonorIndices,this.missingDonors,sendShadingSignalLater,namePrefix,this.panelIndex);
            }
        });
    }
    runKmedoids(namePrefix,sendShadingSignalLater,distanceFuncName){
        const k=parseInt($('#kmedoidsK').slider().val());
        const distanceFunc=function (a,b){
            return DistanceMeasures[distanceFuncName]([a.xPre,a.yPre],[b.xPre,b.yPre]);
        };
        const clusters = kMedoidsClusterer.getInstance(this.plotData, k, distanceFunc).getClusteredData();
        let clusterDonorIndices=[];
        for(let i=0;i<k;++i){
            clusterDonorIndices.push([]);
            for(let j=0;j<clusters[i].length;++j){
                clusterDonorIndices[i].push(clusters[i][j].donorIndex);
            }
        }
        // let namePrefix=this.getNamePrefix(`kMedoids_k:${k}_${distanceFuncName}`);
        this.cohortMetadata.createMultipleGroups(clusterDonorIndices,this.missingDonors,sendShadingSignalLater,namePrefix,this.panelIndex);
    }
    runDBSCAN(namePrefix,sendShadingSignalLater,distanceFuncName){
        const epsMinDBSCAN=+$('#epsMinDBSCAN').slider().val();
        const epsMaxDBSCAN=+$('#epsMaxDBSCAN').slider().val();
        const mPtsMinDBSCAN=parseInt($('#mPtsMinDBSCAN').slider().val());
        const mPtsMaxDBSCAN=parseInt($('#mPtsMaxDBSCAN').slider().val());
        const distanceFunc=function (a,b){
            return DistanceMeasures[distanceFuncName]([a.xPre,a.yPre],[b.xPre,b.yPre]);
        };
        let fuzzyDBSCAN = FuzzyDBSCAN()
            .epsMin(epsMinDBSCAN)
            .epsMax(epsMaxDBSCAN)
            .mPtsMin(mPtsMinDBSCAN)
            .mPtsMax(mPtsMaxDBSCAN)
            .distanceFn(distanceFunc)
            .cluster(this.plotData);
        let clusterDonorIndices=[];
        for(let i=0;i<fuzzyDBSCAN.length;++i){
            clusterDonorIndices.push([]);
            for(let j=0;j<fuzzyDBSCAN[i].length;++j){
                clusterDonorIndices[i].push(this.plotData[fuzzyDBSCAN[i][j].index].donorIndex);
            }
        }
        // const namePrefix=this.getNamePrefix(`epsMin:${epsMinDBSCAN}_epsMax:${epsMaxDBSCAN}_mPtsMinDBSCAN:${mPtsMinDBSCAN}_mPtsMaxDBSCAN:${mPtsMaxDBSCAN}_${distanceFuncName}`);
        this.cohortMetadata.createMultipleGroups(clusterDonorIndices,this.missingDonors,sendShadingSignalLater,namePrefix,this.panelIndex);
    }
    runOPTICS(namePrefix,sendShadingSignalLater){
        const mPtsMin=parseInt($("#mPtsMinOPTICS").slider().val());
        const neighbourhoodRadius=+$("#neighbourhoodRadiusOPTICS").slider().val();
        const opticsInstance=new libOPTICS.OPTICS();
        let vectors = [];
        let matchingIndices = [];
        for (let i = 0 ; i < this.plotData.length ; ++i) {
            vectors.push([this.plotData[i].xPre, this.plotData[i].yPre]);
            matchingIndices.push(this.plotData[i].donorIndex);
        }
        const clusters = opticsInstance.run(vectors, neighbourhoodRadius, mPtsMin);
        // const plot = opticsInstance.getReachabilityPlot();
        let clusterDonorIndices=[];
        for(let i=0;i<clusters.length;++i){
            clusterDonorIndices.push([]);
            for(let j=0;j<clusters[i].length;++j){
                clusterDonorIndices[i].push(matchingIndices[clusters[i][j]]);
            }
        }
        // const namePrefix=this.getNamePrefix(`mPtsMinOPTICS:${mPtsMin}_neighbourhoodRadius:${neighbourhoodRadius}`);
        this.cohortMetadata.createMultipleGroups(clusterDonorIndices,this.missingDonors,sendShadingSignalLater,namePrefix,this.panelIndex);
    }
    // runHDBSCAN(){
    //     const distanceFuncName=$('#FlexibleClusteringDistanceSelector').val();
    //     if(distanceFuncName==="-1"){
    //         return;
    //     }
    //     let vectors = [];
    //     for (let i = 0 ; i < this.plotData.length ; ++i) {
    //         vectors.push({
    //             data:[this.plotData[i].xPre , this.plotData[i].yPre],
    //             opt:this.plotData[i].donorIndex});
    //     }
    //     const distanceFunc=function (a,b){
    //         return DistanceMeasures[distanceFuncName](a,b);
    //     };
    //
    //     const cluster = new Clustering(vectors , distanceFunc);
    //     const filterFunc = val => 1;
    //     const treeNodes=cluster.getTree();
    //     console.log(treeNodes)
    //     console.log(treeNodes.filter(filterFunc,1))
    // }
    getHeaderChunksForTextExport(){
        let headerChunks=["Donor",this.xAxisColumn,this.yAxisColumn];
        if(this.colourColumn!==""){
            headerChunks.push(this.colourColumn);
        }
        if(this.symbolColumn!==""){
            headerChunks.push(this.symbolColumn);
        }
        if(this.radiusColumn!==""){
            headerChunks.push(this.radiusColumn);
        }
        return headerChunks;
    }
    provideRowsForTextExport(multipanel){
        // let outputChunks=["Donor", "panel", "x","y","colour","symbol","radius"];
        let outputChunks=[];
        if(multipanel){
            for(let donorIndex=0;donorIndex<this.cohortMetadata.metadata.length;++donorIndex){
                if(this.missingDonors.has(donorIndex)){
                    continue;
                }
                let tmpChunks=[];
                tmpChunks.push(this.cohortMetadata.metadata[donorIndex].donor);
                tmpChunks.push(this.panelIndex);
                tmpChunks.push(this.xAxisColumn);
                tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.xAxisColumn]);
                tmpChunks.push(this.yAxisColumn);
                tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.yAxisColumn]);
                tmpChunks.push(this.colourColumn);
                if(this.colourColumn!==""){
                    tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.colourColumn]);
                }else{
                    tmpChunks.push("NA")
                }
                tmpChunks.push(this.symbolColumn);
                if(this.symbolColumn!==""){
                    tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.symbolColumn]);
                }else{
                    tmpChunks.push("NA")
                }
                tmpChunks.push(this.radiusColumn);
                if(this.radiusColumn!==""){
                    tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.radiusColumn]);
                }else{
                    tmpChunks.push("NA")
                }
                outputChunks.push(tmpChunks);
            }
        }else{
            for(let donorIndex=0;donorIndex<this.cohortMetadata.metadata.length;++donorIndex){
                if(this.missingDonors.has(donorIndex)){
                    continue;
                }
                let tmpChunks=[];
                tmpChunks.push(this.cohortMetadata.metadata[donorIndex].donor);
                tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.xAxisColumn]);
                tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.yAxisColumn]);
                if(this.colourColumn!==""){
                    tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.colourColumn]);
                }
                if(this.symbolColumn!==""){
                    tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.symbolColumn]);
                }
                if(this.radiusColumn!==""){
                    tmpChunks.push(this.cohortMetadata.metadata[donorIndex][this.radiusColumn]);
                }
                outputChunks.push(tmpChunks);
            }
        }
        return outputChunks;
    }
    getTitleChunks(){
        let titleChunks=[this.cohortMetadata.cohortName];
        if(!this.stackedBarplotMode){
            titleChunks.push(`x_${this.xAxisColumn.replace(/ /g,"_")}`);
            titleChunks.push(`y_${this.yAxisColumn.replace(/ /g,"_")}`);
        }else{
            if(this.xAxisColumn!==undefined){
                titleChunks.push(`x_${this.xAxisColumn.replace(/ /g,"_")}`);
                titleChunks.push("y_stackedBar");
            }else{
                titleChunks.push("x_stackedBar");
                titleChunks.push(`y_${this.yAxisColumn.replace(/ /g,"_")}`);
            }
        }
        if(this.colourColumn!==""){
            titleChunks.push(`colour_${this.colourColumn.replace(/ /g,"_")}`);
        }
        if(this.symbolColumn!==""){
            titleChunks.push(`symbol_${this.symbolColumn.replace(/ /g,"_")}`);
        }
        if(this.radiusColumn!==""){
            titleChunks.push(`radius_${this.radiusColumn.replace(/ /g,"_")}`);
        }
        return titleChunks;
    }
}
