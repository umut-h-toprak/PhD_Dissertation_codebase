import {
    discreteColour,
    saveSvg,
    switchElements,
    linspace, arrayClone, discreteColourGrayRed, generalizedSliderEvents,
} from "../Utils";
import {
    path as d3Xpath,
    symbol as d3Xsymbol,
    symbols as d3Xsymbols,
    select as d3Xselect,
    scaleLinear as d3XscaleLinear,
    mouse as d3Xmouse,
} from "d3";
import {queue as d3Xqueue} from "d3-queue";


const AREAFACTORS=[
    Math.PI,
    20/9,
    1,
    2,
    10*Math.tan(Math.PI/10)/(3-Math.pow(Math.tan(Math.PI/10),2)),
    3*Math.sqrt(3)/4,
    9*(1+1/Math.sqrt(3))*(1/Math.pow((2*Math.sqrt(3)+1),2))
];

// import {PCA as PCAGPU} from 'machinelearn/decomposition';

let math = require('mathjs/core').create();
math.import(require('mathjs/lib/type/matrix'));
math.import(require('mathjs/lib/function/matrix/transpose'));
math.import(require('mathjs/lib/function/statistics/var'));

const tsnejs = require('./tsne');
const PCA = require('ml-pca');

import {UMAP} from '../umap/UMAP';
import {FlexiblePlotModule} from "./FlexiblePlotModule";
// const tsneGPU= require('./tfjs-tsne');
// const tf = require('@tensorflow/tfjs-core');


export class FlexiblePlotManagerNew {
    constructor(commonSettings,references,cohortMetadata,selectionManager,fontManager,textExportManager) {
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.fontManager=fontManager;
        this.textExportManager=textExportManager;

        //controller elements
        this.markedDonors=new Set();
        this.rectStart={};
        this.rectEnd={};
        this.columnIds=new Map();
        this.reverseColumnIds=new Map();
        this.relativeSignatureColumnIds=new Set();
        this.absoluteSignatureColumnIds=new Set();

        //data display elements
        this.svg=null;
        this.gridGuides=null;


        //scale elements
        this.minRadiusForced=null;
        this.maxRadiusForced=null;
        this.minColourForced=null;
        this.maxColourForced=null;

        //data elements
        this.usedDataPointsForClustering=[];
        this.usedDataPointsForClusteringDescriptions=[];
        this.subplotInfo=new Map();
        this.forcedSymbolValsReverseMapper=new Map();
        this.forcedColourValsReverseMapper=new Map();

        this.subcohortSelectorFlexiblePlotGridDefaultHandle=$("#subcohortSelectorFlexiblePlotGridDefault");
        this.flexibleSubcohortSelectorHandle=$("#flexibleSubcohortSelector");
        this.flexibleSubcohortSelectorManifoldHandle=$("#flexibleSubcohortSelectorManifold");
        this.xAxisSelectorHandle=$('#flexibleXaxisSelector');
        this.xAxisSelectorGroupHandle=$('#flexibleXaxisSelectorGroup');
        this.yAxisSelectorHandle=$('#flexibleYaxisSelector');
        this.yAxisSelectorGroupHandle=$('#flexibleYaxisSelectorGroup');
        this.colourSelectorHandle=$('#flexibleColourSelector');
        this.symbolSelectorHandle=$('#flexibleSymbolSelector');
        this.radiusSelectorHandle=$('#flexibleRadiusSelector');
        this.colourSelectorGridCommonHandle=$('#flexibleColourSelectorGridCommon');
        this.symbolSelectorGridCommonHandle=$('#flexibleSymbolSelectorGridCommon');
        this.radiusSelectorGridCommonHandle=$('#flexibleRadiusSelectorGridCommon');
        this.gridStartXSelectorHandle=$("#flexibleGridStartXSelector");
        this.gridEndXSelectorHandle=$("#flexibleGridEndXSelector");
        this.gridStartYSelectorHandle=$("#flexibleGridStartYSelector");
        this.gridEndYSelectorHandle=$("#flexibleGridEndYSelector");
        this.gridStartXManifoldSelectorHandle=$("#flexibleGridStartXManifoldSelector");
        this.gridEndXManifoldSelectorHandle=$("#flexibleGridEndXManifoldSelector");
        this.gridStartYManifoldSelectorHandle=$("#flexibleGridStartYManifoldSelector");
        this.gridEndYManifoldSelectorHandle=$("#flexibleGridEndYManifoldSelector");
        this.flexibleHoverDescriptionColumnsCollapseHandle=$('#flexibleHoverDescriptionColumnsCollapse');
        this.flexibleLabelDescriptionColumnsCollapseHandle=$('#flexibleLabelDescriptionColumnsCollapse');
        this.flexibleNumericColumnsForCustomManifoldCollapseHandle=$('#flexibleNumericColumnsForCustomManifoldCollapse');
        this.flexibleNumericColumnsForBarplotsCollapseHandle=$('#flexibleNumericColumnsForBarplotsCollapse');
        this.flexibleNumericColumnsForBarplotsGroupHandle=$('#flexibleNumericColumnsForBarplotsGroup');
        this.flexibleNumericColumnsForCustomManifoldGroupHandle=$('#flexibleNumericColumnsForCustomManifoldGroup');
        this.flexibleHoverDescriptionColumnsCollapseHandle.empty();
        this.flexibleLabelDescriptionColumnsCollapseHandle.empty();
        this.flexibleNumericColumnsForBarplotsCollapseHandle.empty();
        this.flexibleNumericColumnsForCustomManifoldCollapseHandle.empty();
        this.flexibleDonorMarkerSelectorHandle=$('#flexibleDonorMarkerSelector');
        this.flexibleSubcohortMarkerSelector=$('#flexibleSubcohortMarkerSelector');
        this.flexiblePlotClusteringTargetPanelSelectorHandle=$('#flexiblePlotClusteringTargetPanelSelector');
        this.flexiblePlotGridSelectionHelperRectHandle=$('#flexiblePlotGridSelectionHelperRect');
        this.barplotAxisLabelHandle=$('#BarplotAxisLabel');
        this.includeInBarplotHandles=new Map();
        this.includeInCustomManifoldHandles=new Map();
        this.customManifoldMode=false;
        this.submitFlexiblePlotAnalysisHandle=$('#submitFlexiblePlotAnalysis');

        this.xAxisSelectorGroupHandle.css('display','inline');
        this.yAxisSelectorGroupHandle.css('display','inline');
        this.flexibleNumericColumnsForBarplotsGroupHandle.css('display','none');
        this.flexibleNumericColumnsForCustomManifoldGroupHandle.css('display','none');

        this.multiplotMode=false;
        this.gridCellsX=0;
        this.gridCellsY=0;
        this.nextAvailableGridX=0;
        this.nextAvailableGridY=0;
        this.defaultSubcohort=0;

        this.svgCellWidth=0;
        this.svgCellHeight=0;
        this.gridCellXstartPositions=[];
        this.gridCellXendPositions=[];
        this.gridCellYstartPositions=[];
        this.gridCellYendPositions=[];
        this.gridAvailable=false;
        this.forcedColourScale=null;
        this.forcedAllColourVals=new Map();
        this.forcedAllSymbolVals=new Map();
        this.forcedAllRadiusVals=new Map();
        this.forcedRadiusScale=null;
        this.forcedColourColumnPre=-1;
        this.forcedColourColumn=null;
        this.forcedSymbolColumnPre=-1;
        this.forcedSymbolColumn=null;
        this.forcedRadiusColumnPre=-1;
        this.forcedRadiusColumn=null;
        this.maxSubplotInfo=0;
        this.maxYDepth=-1;
        this.firstVisit=false;
        $('#flexiblePlotAddNewestMetadataColumn').off('click').on('click',()=>{
            this.addNewestMetadataColumn();
        });
        const controlElements=[
            "flexiblePlotControls",
            "svgDownloader"];
        $('#flexiblePlotsContentPane')
            .off('hide.bs.tab')
            .on('hide.bs.tab',()=>{
                switchElements(
                    controlElements,
                    []);
            })
            .off('hidden.bs.tab')
            .on('hidden.bs.tab',()=>{
                switchElements(
                    controlElements,
                    []);
            })
            .off('shown.bs.tab')
            .on('shown.bs.tab', ()=> {
                if(!this.firstVisit){
                    this.prepareGrid();
                    this.firstVisit=true;
                }
                $('.nav-tabs a[href="#controlsPane"]').tab("show");
                switchElements(
                    [],
                    controlElements);
                if(!this.gridAvailable){
                    $('#flexiblePlotPostGridControls').css("display","none");
                }
                $('#selectorControlsCollapse').collapse('hide');
                $('#subcohortSelectionFromFlexiblePlotDescription').empty();
                $('#PCACollapse').collapse('hide');
                $('#tSNECollapse').collapse('hide');
                $('#UMAPCollapse').collapse('hide');
                $('#flexiblePlotClusteringCollapse').collapse('hide');
                $('#OPTICSCollapse').collapse('hide');
                $('#DBSCANCollapse').collapse('hide');
                $('#KmeansCollapse').collapse('hide');
                $('#KmedoidsCollapse').collapse('hide');
                this.flexibleNumericColumnsForBarplotsCollapseHandle.collapse('hide');
                // $('#helpInfo').html(tutorials.Tutorials.mainScreenTutorial());
                this.fontManager.setAvailableFontSettings("flexiblePlot");
                this.textExportManager.setAvailableExportSettings("flexiblePlot");
                this.commonSettings.releaseLock();
            });
        this.initialized=false;
        this.subplotModules=new Map();
    }
    resetGridSelectors(){
        this.gridStartXSelectorHandle.empty().append('<option value="-1">Select Starting X Cell on Grid</option>');
        this.gridStartXManifoldSelectorHandle.empty().append('<option value="-1">Select Starting X Cell on Grid</option>');
        this.gridEndXSelectorHandle.empty().append('<option value="-1">Select Last X Cell on Grid</option>');
        this.gridEndXManifoldSelectorHandle.empty().append('<option value="-1">Select Last X Cell on Grid</option>');
        this.gridStartYSelectorHandle.empty().append('<option value="-1">Select Starting Y Cell on Grid</option>');
        this.gridStartYManifoldSelectorHandle.empty().append('<option value="-1">Select Starting Y Cell on Grid</option>');
        this.gridEndYSelectorHandle.empty().append('<option value="-1">Select Last Y Cell on Grid</option>');
        this.gridEndYManifoldSelectorHandle.empty().append('<option value="-1">Select Last Y Cell on Grid</option>');
        this.flexiblePlotClusteringTargetPanelSelectorHandle.empty().append('<option value="-1">Select Subplot to do Clustering</option>');
        $('#flexiblePlotClusteringControls').css("display","none");
        $('#flexiblePlotManifoldProgressBar').css('width',"0%");
        $('#flexiblePlotManifoldProgressBarGroup').css("display","none");
    }
    initialize(){
        this.initialized=true;
        $('#flexiblePlotsContentMain').empty();
        $('#flexiblePlotPostGridControls').css("display","none");
        // $("#subcohortSelectorFlexiblePlotGrid").val("0");
        this.subcohortSelectorFlexiblePlotGridDefaultHandle.val("0");
        this.flexibleSubcohortSelectorHandle.val("0");
        this.colourSelectorGridCommonHandle.empty().append('<option value="-1">Optional: Select Common Colour Variable for the Grid (&le;21 diff. values for categorical columns)</option>');
        this.symbolSelectorGridCommonHandle.empty().append('<option value="-1">Optional: Select Common Symbol Variable for the Grid (&le;7 diff. values only for categorical columns)</option>');
        this.radiusSelectorGridCommonHandle.empty().append('<option value="-1">Optional: Select Common Marker Radius Variable for the Grid (Only for numerical columns)</option>');
        this.xAxisSelectorHandle.empty().append('<option value="-1">Select x-Axis Variable (mandatory if not PCA/tSNE/UMAP)</option>');
        this.yAxisSelectorHandle.empty().append('<option value="-1">Select y-Axis Variable (mandatory if not PCA/tSNE/UMAP)</option>');
        this.colourSelectorHandle.empty().append('<option value="-1">Select Colour Variable (&le;21 diff. values for categorical columns)</option>');
        this.symbolSelectorHandle.empty().append('<option value="-1">Select Symbol Variable (&le;7 diff. values only for categorical columns)</option>');
        this.radiusSelectorHandle.empty().append('<option value="-1">Select Marker Radius Variable (Only for numerical columns)</option>');
        this.flexibleDonorMarkerSelectorHandle.empty().append('<option value="-1">Select Donor</option>');
        this.flexibleSubcohortMarkerSelector.empty().append('<option value="-1">Select Subcohort</option>');
        const lenMetadata=this.cohortMetadata.metadata.length;
        for(let i=0;i<lenMetadata;++i){
            this.flexibleDonorMarkerSelectorHandle.append(`<option value=${this.cohortMetadata.metadata[i].index}>${this.cohortMetadata.metadata[i].donor}</option>`);
        }
        this.enableGridControls();
        this.enableClusteringControls();
        this.commonSettings.releaseLock();
    }
    addNewestMetadataColumn(){
        if(this.initialized){
            const columnIdToAdd=this.cohortMetadata.maxIndex-1;
            const columnToAdd=this.cohortMetadata.possibleMetadataColumnsReverse.get(columnIdToAdd);
            this.addNewMetadataColumn(columnToAdd,columnIdToAdd);
        }
    }
    addNewMetadataColumn(columnName,columnId){
        if(columnName==="index"){
            return;
        }
        this.columnIds.set(columnId,columnName);
        this.reverseColumnIds.set(columnName,columnId);
        if(columnName!=="donor"){
            this.flexibleHoverDescriptionColumnsCollapseHandle.append(`
                <label class="custom-control custom-checkbox active" id="includeInHover_${columnId}_group">
                    <input id="includeInHover_${columnId}" type="checkbox" class="custom-control-input">
                    <span class="custom-control-indicator"></span>
                    <span class="custom-control-description">${columnName}</span>
                </label>`);
            this.flexibleLabelDescriptionColumnsCollapseHandle.append(`
                <label class="custom-control custom-checkbox active" id="includeInLabel_${columnId}_group">
                    <input id="includeInLabel_${columnId}" type="checkbox" class="custom-control-input">
                    <span class="custom-control-indicator"></span>
                    <span class="custom-control-description">${columnName}</span>
                </label>`);
            $(`#includeInHover_${columnId}`).off("change").on('change', ()=>{
                this.refreshHoverColumns();
                setTimeout(()=>{this.replotSubplots();},0);
            });
            $(`#includeInLabel_${columnId}`).off("change").on('change', ()=>{
                this.refreshLabelColumns();
                setTimeout(()=>{this.remarkDonors();},0);
            });
        }
        this.xAxisSelectorHandle.append(`<option value=${columnId}>${columnName}</option>`);
        this.yAxisSelectorHandle.append(`<option value=${columnId}>${columnName}</option>`);
        if(this.cohortMetadata.metadataDataTypes.get(columnName)==="numeric"){
            this.colourSelectorGridCommonHandle.append(`<option value=${columnId}>${columnName}</option>`);
            this.radiusSelectorGridCommonHandle.append(`<option value=${columnId}>${columnName}</option>`);
            this.colourSelectorHandle.append(`<option value=${columnId}>${columnName}</option>`);
            this.radiusSelectorHandle.append(`<option value=${columnId}>${columnName}</option>`);
            if(columnName==="COSMIC sig 1"){
                this.flexibleNumericColumnsForBarplotsCollapseHandle.append(`
                    <label class="custom-control custom-checkbox active" id="includeInBarplot_RelativeSignatures_group">
                        <input id="includeInBarplot_RelativeSignatures" type="checkbox" class="custom-control-input">
                        <span class="custom-control-indicator"></span>
                        <span class="custom-control-description">Relative Mutational Signature Contributions</span>
                    </label>`);
                this.flexibleNumericColumnsForCustomManifoldCollapseHandle.append(`
                    <label class="custom-control custom-checkbox active" id="includeInCustomManifold_RelativeSignatures_group">
                        <input id="includeInCustomManifold_RelativeSignatures" type="checkbox" class="custom-control-input">
                        <span class="custom-control-indicator"></span>
                        <span class="custom-control-description">Relative Mutational Signature Contributions</span>
                    </label>`);
            }else if(columnName==="COSMIC sig 1 Muts"){
                this.flexibleNumericColumnsForBarplotsCollapseHandle.append(`
                    <label class="custom-control custom-checkbox active" id="includeInBarplot_AbsoluteSignatures_group">
                        <input id="includeInBarplot_AbsoluteSignatures" type="checkbox" class="custom-control-input">
                        <span class="custom-control-indicator"></span>
                        <span class="custom-control-description">Absolute Mutational Signature Contributions</span>
                    </label>`);
                this.flexibleNumericColumnsForCustomManifoldCollapseHandle.append(`
                    <label class="custom-control custom-checkbox active" id="includeInCustomManifold_AbsoluteSignatures_group">
                        <input id="includeInCustomManifold_AbsoluteSignatures" type="checkbox" class="custom-control-input">
                        <span class="custom-control-indicator"></span>
                        <span class="custom-control-description">Absolute Mutational Signature Contributions</span>
                    </label>`);
            }
            if(columnName.startsWith("COSMIC sig ")){
                if(columnName.endsWith(" Muts")){
                    this.absoluteSignatureColumnIds.add(columnId);
                }else{
                    this.relativeSignatureColumnIds.add(columnId);
                }
            }
            this.flexibleNumericColumnsForBarplotsCollapseHandle.append(`
                <label class="custom-control custom-checkbox active" id="includeInBarplot_${columnId}_group">
                    <input id="includeInBarplot_${columnId}" type="checkbox" class="custom-control-input">
                    <span class="custom-control-indicator"></span>
                    <span class="custom-control-description">${columnName}</span>
                </label>`);
            this.flexibleNumericColumnsForCustomManifoldCollapseHandle.append(`
                <label class="custom-control custom-checkbox active" id="includeInCustomManifold_${columnId}_group">
                    <input id="includeInCustomManifold_${columnId}" type="checkbox" class="custom-control-input">
                    <span class="custom-control-indicator"></span>
                    <span class="custom-control-description">${columnName}</span>
                </label>`);
            const currentHandle=$(`#includeInBarplot_${columnId}`);
            currentHandle.off('change.bootstrapSwitch').on('change.bootstrapSwitch',()=>{
                if(this.checkSelectionValidity(false,true)){
                    this.submitFlexiblePlotAnalysisHandle.css('display','inline');
                }else{
                    this.submitFlexiblePlotAnalysisHandle.css('display','none');
                }
            });
            this.includeInBarplotHandles.set(columnName,currentHandle);
            this.includeInCustomManifoldHandles.set(columnName,$(`#includeInCustomManifold_${columnId}`));
        }else{
            if(this.cohortMetadata.metadataDataPossibleValues.get(columnName).size<22){
                this.colourSelectorGridCommonHandle.append(`<option value=${columnId}>${columnName}</option>`);
                this.colourSelectorHandle.append(`<option value=${columnId}>${columnName}</option>`);
            }
            if(this.cohortMetadata.metadataDataPossibleValues.get(columnName).size<8){
                this.symbolSelectorGridCommonHandle.append(`<option value=${columnId}>${columnName}</option>`);
                this.symbolSelectorHandle.append(`<option value=${columnId}>${columnName}</option>`);
            }
        }
    }
    resetCustomManifoldCheckboxes(){
        this.flexibleNumericColumnsForCustomManifoldGroupHandle.css('display','none');
        this.flexibleNumericColumnsForCustomManifoldCollapseHandle.collapse('hide');
        this.includeInCustomManifoldHandles.forEach((handle,columnName,map)=>{
            handle.prop('checked', false).parent().removeClass('active');
        });
        $('#includeInCustomManifold_AbsoluteSignatures').prop('checked', false).parent().removeClass('active');
        $('#includeInCustomManifold_RelativeSignatures').prop('checked', false).parent().removeClass('active');
        this.customManifoldMode=false;
    }
    checkCustomManifoldValidity(){
        let totalChecked=0;
        this.includeInCustomManifoldHandles.forEach((handle,columnName,map)=>{
            if(handle.is(':checked')){
                totalChecked+=1;
            }
        });
        return totalChecked>2;
    }
    removeMetadataColumn(columnName){
        const columnId=this.reverseColumnIds.get(columnName);
        this.reverseColumnIds.delete(columnName);
        this.columnIds.delete(columnId);
        $(`#includeInHover_${columnId}_group`).remove();
        $(`#includeInLabel_${columnId}_group`).remove();
        [
            "flexibleXaxisSelector",
            "flexibleYaxisSelector",
            "flexibleColourSelector",
            "flexibleSymbolSelector",
            "flexibleRadiusSelector",
            "flexibleColourSelectorGridCommon",
            "flexibleSymbolSelectorGridCommon",
            "flexibleRadiusSelectorGridCommon"].forEach((selectorName)=>{
            $(`#${selectorName} option[value='${columnId}']`).remove();
        });
        let panelsToRemove=new Set();
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            if(subplot.cleanupMetadataColumn(columnName)){
                panelsToRemove.add(panelIndex);
            }
        });
        panelsToRemove.forEach((panelIndex)=>{
            this.subplotModules.delete(panelIndex);
            this.subplotInfo.delete(panelIndex);
        });
    }
    enableGridControls(){
        const controlElements=["numGridCellsXController","numGridCellsYController"];
        const controlElementLabels=["Horizontal Cells","Vertical Cells"];
        for(let i=0;i<controlElements.length;++i){
            generalizedSliderEvents(
                `${controlElements[i]}`,
                (x)=>{return x;},
                `${controlElementLabels[i]}:`,
                (x)=>{});
        }
        this.cohortMetadata.possibleMetadataColumnsReverse.forEach((column,columnId,x)=>{
            this.addNewMetadataColumn(column,columnId)
        });
        $('#gridCreationSubmit').off('click').on('click',()=>{
            this.prepareGrid();
        });
    }
    determineForcedColourScale(){
        if(this.forcedAllColourVals!==null){
            this.forcedAllColourVals.clear();
        }else{
            this.forcedAllColourVals=new Map();
        }
        this.forcedColourValsReverseMapper.clear();
        this.forcedColourScale=null;
        this.forcedColourColumn=null;
        this.maxColourForced=Number.MIN_VALUE;
        this.minColourForced=Number.MAX_VALUE;
        if(this.forcedColourColumnPre!==-1){
            this.forcedColourColumn=this.cohortMetadata.possibleMetadataColumnsReverse.get(this.forcedColourColumnPre);
            this.forcedColourScaleType=this.cohortMetadata.metadataDataTypes.get(this.forcedColourColumn);
            this.forcedAllColourVals=new Map();
            let colourIndex=0;
            const lenMetadata=this.cohortMetadata.metadata.length;
            for(let i=0;i<lenMetadata;++i){
                const currentVal = this.cohortMetadata.metadata[i][this.forcedColourColumn];
                if(!this.forcedAllColourVals.has(currentVal)){
                    if(this.forcedColourScaleType==="numeric") {
                        if(!this.commonSettings.undefinedValues.has(currentVal)){
                            this.forcedAllColourVals.set(currentVal,colourIndex);
                            colourIndex++;
                        }
                    }else{
                        this.forcedAllColourVals.set(currentVal,colourIndex);
                        this.forcedColourValsReverseMapper.set(colourIndex,currentVal);
                        colourIndex++;
                    }
                }
            }
            if(this.forcedColourScaleType==="numeric"){
                const allColourValsArr=Array.from(this.forcedAllColourVals.keys()).sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                this.maxColourForced=allColourValsArr[allColourValsArr.length-1];
                this.minColourForced=allColourValsArr[0];
                // this.forcedColourScale=d3XscaleLinear().domain([this.minColourForced, this.maxColourForced]).range(discreteColour(2));
                this.forcedColourScale=d3XscaleLinear().domain([this.minColourForced, this.maxColourForced]).range(discreteColourGrayRed());
            }else{
                this.minColourForced=0;
                this.maxColourForced=this.forcedAllColourVals.size-1;
                this.forcedColourScale=function (x){return discreteColour(this.maxColourForced+1)[x]};
            }
            if(this.multiplotMode){
                $('#flexiblePlotIndepentColourCheck').css('display','inline');
                $('#independentColour').removeClass('checked').prop('checked', false);
                $('#flexibleColourSelectorGroup').css('display','none');
                this.colourSelectorHandle.val(this.forcedColourColumnPre);
            }
        }
        else{
            this.forcedColourScale=null;
            this.forcedAllColourVals=null;
            $('#flexiblePlotIndepentColourCheck').css('display','none');
            $('#independentColour').removeClass('checked').prop('checked', false);
            $('#flexibleColourSelectorGroup').css('display','inline');
            this.colourSelectorHandle.val(-1);
        }
    }
    determineForcedSymbolScale(){
        this.forcedAllSymbolVals=null;
        this.forcedSymbolValsReverseMapper.clear();
        this.forcedSymbolColumn=null;
        if(this.forcedSymbolColumnPre!==-1){
            this.forcedSymbolColumn=this.cohortMetadata.possibleMetadataColumnsReverse.get(this.forcedSymbolColumnPre);
            this.forcedAllSymbolVals=new Map();
            let symbolIndex=0;
            const lenMetadata=this.cohortMetadata.metadata.length;
            for(let i=0;i<lenMetadata;++i){
                const currentVal=this.cohortMetadata.metadata[i][this.forcedSymbolColumn];
                if(!this.forcedAllSymbolVals.has(currentVal)){
                    this.forcedAllSymbolVals.set(currentVal,symbolIndex);
                    this.forcedSymbolValsReverseMapper.set(symbolIndex,currentVal);
                    symbolIndex++;
                }
            }
            if(this.multiplotMode){
                $('#flexiblePlotIndepentSymbolCheck').css('display','inline');
                $('#independentSymbol').removeClass('checked').prop('checked', false);
                $('#flexibleSymbolSelectorGroup').css('display','none');
                this.symbolSelectorHandle.val(this.forcedSymbolColumnPre);    
            }
        }
        else{
            this.forcedAllSymbolVals=null;
            $('#flexiblePlotIndepentSymbolCheck').css('display','none');
            $('#independentSymbol').removeClass('checked').prop('checked', false);
            $('#flexibleSymbolSelectorGroup').css('display','inline');
            this.symbolSelectorHandle.val(-1);
        }
    }
    determineForcedRadiusScale(){
        this.forcedRadiusScale=null;
        this.forcedRadiusColumn=null;
        this.maxRadiusForced=Number.MIN_VALUE;
        this.minRadiusForced=Number.MAX_VALUE;
        if(this.forcedRadiusColumnPre!==-1){
            this.forcedRadiusColumn=this.cohortMetadata.possibleMetadataColumnsReverse.get(this.forcedRadiusColumnPre);
            let radiusIndex=0;
            this.forcedAllRadiusVals=new Map();
            const lenMetadata=this.cohortMetadata.metadata.length;
            for(let i=0;i<lenMetadata;++i){
                const currentRadius=this.cohortMetadata.metadata[i][this.forcedRadiusColumn];
                if(!this.forcedAllRadiusVals.has(currentRadius)){
                    if(!this.commonSettings.undefinedValues.has(currentRadius)){
                        this.forcedAllRadiusVals.set(currentRadius,radiusIndex);
                        if(currentRadius<this.minRadiusForced){
                            this.minRadiusForced=currentRadius;
                        }
                        if(currentRadius>this.maxRadiusForced){
                            this.maxRadiusForced=currentRadius;
                        }
                        radiusIndex++;
                    }
                }
            }
            this.forcedRadiusScale=d3XscaleLinear().domain([this.minRadiusForced, this.maxRadiusForced]).range([0.5,4]);
            if(this.multiplotMode){
                $('#flexiblePlotIndepentRadiusCheck').css('display','inline');
                $('#independentRadius').removeClass('checked').prop('checked', false);
                $('#flexibleRadiusSelectorGroup').css('display','none');
                this.radiusSelectorHandle.val(this.forcedRadiusColumnPre);
            }
        }
        else{
            this.forcedRadiusScale=null;
            $('#flexiblePlotIndepentRadiusCheck').css('display','none');
            $('#independentRadius').removeClass('checked').prop('checked', false);
            $('#flexibleRadiusSelectorGroup').css('display','inline');
            this.radiusSelectorHandle.val(-1);
        }
    }
    prepareGrid(){
        this.maxYDepth=-1;
        this.cleanupAllSubplots();
        $('#flexiblePlotsContentMain').empty();
        this.defaultSubcohort=parseInt($('#subcohortSelectorFlexiblePlotGridDefault').val());
        this.gridCellsX=parseInt($('#numGridCellsXController').val());
        this.gridCellsY=parseInt($('#numGridCellsYController').val());
        this.multiplotMode=this.gridCellsX>1||this.gridCellsY>1;
        this.forcedColourColumnPre=parseInt(this.colourSelectorGridCommonHandle.val());
        this.determineForcedColourScale();
        this.forcedSymbolColumnPre=parseInt(this.symbolSelectorGridCommonHandle.val());
        this.determineForcedSymbolScale();
        this.forcedRadiusColumnPre=parseInt(this.radiusSelectorGridCommonHandle.val());
        this.determineForcedRadiusScale();
        let thisRef=this;
        this.currentWidth=$('#mainSide').width();
        const viewBox=`${-this.currentWidth*0.1} ${-this.currentWidth*0.00005} ${this.currentWidth*1.2} ${this.currentWidth*1.2}`;
        this.svg=d3Xselect('#flexiblePlotsContentMain')
            .classed("svg-container", true)
            .append("svg")
            .classed("container-fluid", true)
            .classed("wrap", true)
            .classed("svg-content-responsive", true)
            .attr("viewBox", viewBox)
            .attr("id",'flexiblePlotMain')
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("width", "100%")
            .attr("height","100%");
        this.svg
            .on("mousedown", function() {
            thisRef.rectStart = d3Xmouse(this);
            if(thisRef.rectStart.x>thisRef.svgWidth||thisRef.rectStart.y>thisRef.targetHeight){
                thisRef.resetSelectionRect();
                return;
            }
            if(thisRef.rectStart.x<0||thisRef.rectStart.y<0){
                thisRef.resetSelectionRect();
                return;
            }
            thisRef.svg.append("rect")
                .attr("id","flexibleDonorSelectBox")
                .attr("x",thisRef.rectStart[0])
                .attr("y",thisRef.rectStart[1])
                .attr("width",0)
                .attr("height",0)
                .style("fill","none")
                .style("stroke","Black")
                .style("stroke-width",0.6);
        })
            .on("mousemove", function() {
                let s = thisRef.svg.select("#flexibleDonorSelectBox");
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
                thisRef.svg.select("#flexibleDonorSelectBox").remove();
                if(thisRef.commonSettings.interactionLock){
                    return;
                }
                thisRef.commonSettings.lock();
                thisRef.rectEnd = d3Xmouse(this);
                if(thisRef.rectEnd.x>thisRef.svgWidth||thisRef.rectEnd.y>thisRef.targetHeight){
                    thisRef.resetSelectionRect();
                    return;
                }
                if(thisRef.rectEnd.x<0||thisRef.rectEnd.y<0){
                    thisRef.resetSelectionRect();
                    return;
                }
                let xs=[thisRef.rectStart[0],thisRef.rectEnd[0]].sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                let ys=[thisRef.rectStart[1],thisRef.rectEnd[1]].sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                let intersectingSubplots=new Set();
                thisRef.subplotModules.forEach((subplot,subplotIndex,map)=>{
                    if(subplot.svgStartX<=xs[0]&&xs[0]<=subplot.svgEndX){
                        if(subplot.svgStartY<=ys[0]&&ys[0]<=subplot.svgEndY){
                            if(subplot.svgStartX<=xs[1]&&xs[1]<=subplot.svgEndX){
                                if(subplot.svgStartY<=ys[1]&&ys[1]<=subplot.svgEndY){
                                    intersectingSubplots.add(subplotIndex);
                                }
                            }
                        }
                    }
                });
                if(intersectingSubplots.size===1){
                    const donorsToMark=thisRef.subplotModules.get([...intersectingSubplots][0]).emitSelectedDonorsFromSvgCoordinates(xs[0],xs[1],ys[0],ys[1]);
                    donorsToMark.forEach((donorIndex)=>{
                        thisRef.markDonor(donorIndex,false);
                    })
                }
                thisRef.commonSettings.releaseLock();
            });
        d3Xselect('#flexiblePlotMain').append("g").attr("id","gridGuides");
        this.gridGuides=d3Xselect("#gridGuides");
        const svgHandle=$('#flexiblePlotMain');
        const svgWidth=this.currentWidth*0.99;
        this.svgCellWidth=svgWidth/this.gridCellsX;
        const svgHeight=Math.max(this.svgCellWidth*this.gridCellsY,svgWidth);
        svgHandle.height(svgHeight*1.1);
        this.svgCellHeight=this.svgCellWidth;
        $('#flexiblePlotManifoldControls').css("display","inline");
        this.gridCellXstartPositions.length=0;
        this.gridCellXendPositions.length=0;
        for(let i=0;i<this.gridCellsX;++i){
            this.gridCellXstartPositions.push(this.svgCellWidth*i);
            this.gridCellXendPositions.push(this.svgCellWidth*(i+1));
        }
        this.gridCellYstartPositions.length=0;
        this.gridCellYendPositions.length=0;
        for(let i=0;i<this.gridCellsY;++i){
            this.gridCellYstartPositions.push(this.svgCellHeight*i);
            this.gridCellYendPositions.push(this.svgCellHeight*(i+1));
        }
        this.gridAvailable=true;
        this.addControlElements();
        $('#gridCreatorCollapse').collapse('hide');
    }
    findNextAvailableGridCell(){
        let flexibleGridX=this.nextAvailableGridX;
        let flexibleGridY=this.nextAvailableGridY;
        if(flexibleGridX===this.gridCellsX&& flexibleGridY===this.gridCellsY){
            flexibleGridX=0;
            flexibleGridY=0;
        }
        let foundMatch=true;
        for(let flexibleGridX=this.nextAvailableGridX;flexibleGridX<this.gridCellsX;++flexibleGridX){
            foundMatch=true;
            const starter=(flexibleGridX===this.nextAvailableGridX)?this.nextAvailableGridY:0;
            for(let flexibleGridY=starter;flexibleGridY<this.gridCellsY;++flexibleGridY){
                foundMatch=false;
                for (const subplotInfo of this.subplotInfo.values()) {
                    if(flexibleGridX <= subplotInfo.flexibleGridEndX && subplotInfo.flexibleGridStartX <= flexibleGridX){
                        if(flexibleGridY <= subplotInfo.flexibleGridEndY && subplotInfo.flexibleGridStartY <= flexibleGridY){
                            foundMatch=true;
                            break;
                        }
                    }
                }
                if(!foundMatch){
                    break;
                }
            }
            if(!foundMatch){
                break;
            }
        }
        if(foundMatch){
            for(let flexibleGridX=0;flexibleGridX<=this.nextAvailableGridX;++flexibleGridX){
                foundMatch=true;
                const ender=(flexibleGridX===this.nextAvailableGridX)?this.nextAvailableGridY:this.gridCellsY;
                for(let flexibleGridY=0;flexibleGridY<ender;++flexibleGridY){
                    foundMatch=false;
                    for (const subplotInfo of this.subplotInfo.values()) {
                        if(flexibleGridX <= subplotInfo.flexibleGridEndX && subplotInfo.flexibleGridStartX <= flexibleGridX){
                            if(flexibleGridY <= subplotInfo.flexibleGridEndY && subplotInfo.flexibleGridStartY <= flexibleGridY){
                                foundMatch=true;
                                break;
                            }
                        }
                    }
                    if(!foundMatch){
                        break;
                    }
                }
                if(!foundMatch){
                    break;
                }
            }
            if(foundMatch){
                flexibleGridX=0;
                flexibleGridY=0;
            }
        }
        this.nextAvailableGridX=flexibleGridX;
        this.nextAvailableGridY=flexibleGridY;

        this.gridStartXSelectorHandle.val(this.nextAvailableGridX);
        this.gridEndXSelectorHandle.val(this.nextAvailableGridX);
        this.gridStartYSelectorHandle.val(this.nextAvailableGridY);
        this.gridEndYSelectorHandle.val(this.nextAvailableGridY);
        this.gridStartXManifoldSelectorHandle.val(this.nextAvailableGridX);
        this.gridEndXManifoldSelectorHandle.val(this.nextAvailableGridX);
        this.gridStartYManifoldSelectorHandle.val(this.nextAvailableGridY);
        this.gridEndYManifoldSelectorHandle.val(this.nextAvailableGridY);
    }
    goToNextCell(){
        let gridX=parseInt(this.gridEndXSelectorHandle.val());
        let gridY=parseInt(this.gridEndYSelectorHandle.val());
        if(gridX===this.gridCellsX-1){
            gridX=0;
            gridY+=1;
            if(gridY===this.gridCellsY){
                gridY=0;
            }
        }else{
            gridX+=1;
        }
        if(gridY===-1){
            gridY=0;
        }
        this.gridStartXSelectorHandle.val(gridX);
        this.gridEndXSelectorHandle.val(gridX);
        this.gridStartYSelectorHandle.val(gridY);
        this.gridEndYSelectorHandle.val(gridY);
        this.gridStartXManifoldSelectorHandle.val(gridX);
        this.gridEndXManifoldSelectorHandle.val(gridX);
        this.gridStartYManifoldSelectorHandle.val(gridY);
        this.gridEndYManifoldSelectorHandle.val(gridY);
    }
    addControlElements(){
        $('#independentSubcohort').removeClass('checked').prop('checked', false);
        $('#flexiblePlotIndepentSubcohortCheck').css('display',this.multiplotMode?"inline":"none");
        $('#flexibleSubcohortSelectorGroup').css('display',this.multiplotMode?"none":"inline");
        this.flexibleSubcohortSelectorHandle.val(this.defaultSubcohort);

        $('#independentSubcohortManifold').removeClass('checked').prop('checked', false);
        $('#flexiblePlotIndepentSubcohortManifoldCheck').css('display',this.multiplotMode?"inline":"none");
        $('#flexibleSubcohortSelectorManifoldGroup').css('display',this.multiplotMode?"none":"inline");
        this.flexibleSubcohortSelectorManifoldHandle.val(this.defaultSubcohort);
        $('#flexiblePlotManifoldProgressBar').css('width',"0%");
        $('#flexiblePlotManifoldProgressBarGroup').css("display","none");
        this.resetGridSelectors();
        for(let i=0;i<this.gridCellsX;++i){
            this.gridStartXSelectorHandle.append(`<option value=${i}>X-Start Cell: ${i}</option>`);
            this.gridStartXManifoldSelectorHandle.append(`<option value=${i}>X-Start Cell: ${i}</option>`);
            this.gridEndXSelectorHandle.append(`<option value=${i}>X-End Cell: ${i}</option>`);
            this.gridEndXManifoldSelectorHandle.append(`<option value=${i}>X-End Cell: ${i}</option>`);
        }
        for(let i=0;i<this.gridCellsY;++i){
            this.gridStartYSelectorHandle.append(`<option value=${i}>Y-Start Cell: ${i}</option>`);
            this.gridStartYManifoldSelectorHandle.append(`<option value=${i}>Y-Start Cell: ${i}</option>`);
            this.gridEndYSelectorHandle.append(`<option value=${i}>Y-End Cell: ${i}</option>`);
            this.gridEndYManifoldSelectorHandle.append(`<option value=${i}>Y-End Cell: ${i}</option>`);
        }
        this.findNextAvailableGridCell();
        this.drawGridSelectionHelperRect();

        let flexibleSubcohortMarkerSelectorHandle=$('#flexibleSubcohortMarkerSelector');
        this.selectionManager.registeredSubcohortNames.forEach((subcohortName,subcohortIndex,map)=>{
            flexibleSubcohortMarkerSelectorHandle.append(`<option value=${subcohortIndex}>${this.selectionManager.cohortName}_${subcohortName}</option>`);
        });
        $('#flexiblePlotPostGridControls').css("display","inline");
        this.xAxisSelectorHandle.val(-1);
        this.yAxisSelectorHandle.val(-1);
        this.colourSelectorHandle.val(this.forcedColourColumnPre);
        this.radiusSelectorHandle.val(this.forcedRadiusColumnPre);
        this.symbolSelectorHandle.val(this.forcedSymbolColumnPre);
        this.enablePlotControls();
    }
    enableMultiplotSpecificControls(){
        let thisRef=this;
        $('#flexibleGridGoToNextAvailable').off('click').on('click',()=>{
            this.findNextAvailableGridCell();
            this.drawGridSelectionHelperRect();
        });
        $('#flexibleGridGoToNextAvailableManifold').off('click').on('click',()=>{
            this.findNextAvailableGridCell();
            this.drawGridSelectionHelperRect();
        });
        $('#flexibleGridGoToNext').off('click').on('click',()=>{
            this.goToNextCell();
            this.drawGridSelectionHelperRect();
        });
        $('#flexibleGridGoToNextManifold').off('click').on('click',()=>{
            this.goToNextCell();
            this.drawGridSelectionHelperRect();
        });
        this.gridStartXSelectorHandle.off("change").on("change",function(){
            thisRef.gridStartXManifoldSelectorHandle.val(this.value);
            const startVal=parseInt(this.value);
            if(parseInt(thisRef.gridEndXSelectorHandle.val())<startVal){
                thisRef.gridEndXSelectorHandle.val(this.value);
                thisRef.gridEndXManifoldSelectorHandle.val(this.value);
            }
            thisRef.drawGridSelectionHelperRect();
            if(thisRef.checkSelectionValidity(false,false)){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
        this.gridStartXManifoldSelectorHandle.off("change").on("change",function(){
            thisRef.gridStartXSelectorHandle.val(this.value);
            const startVal=parseInt(this.value);
            if(parseInt(thisRef.gridEndXSelectorHandle.val())<startVal){
                thisRef.gridEndXSelectorHandle.val(this.value);
                thisRef.gridEndXManifoldSelectorHandle.val(this.value);
            }
            thisRef.drawGridSelectionHelperRect();
            if(thisRef.checkSelectionValidity(false,false)){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
        this.gridEndXSelectorHandle.off("change").on("change",function(){
            thisRef.gridEndXManifoldSelectorHandle.val(this.value);
            const endVal=parseInt(this.value);
            if(parseInt(thisRef.gridStartXSelectorHandle.val())>endVal){
                thisRef.gridStartXSelectorHandle.val(this.value);
                thisRef.gridStartXManifoldSelectorHandle.val(this.value);
            }
            thisRef.drawGridSelectionHelperRect();
            if(thisRef.checkSelectionValidity(false,false)){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
        this.gridEndXManifoldSelectorHandle.off("change").on("change",function(){
            thisRef.gridEndXSelectorHandle.val(this.value);
            const endVal=parseInt(this.value);
            if(parseInt(thisRef.gridStartXSelectorHandle.val())>endVal){
                thisRef.gridStartXSelectorHandle.val(this.value);
                thisRef.gridStartXManifoldSelectorHandle.val(this.value);
            }
            thisRef.drawGridSelectionHelperRect();
            if(thisRef.checkSelectionValidity(false,false)){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
        this.gridStartYSelectorHandle.off("change").on("change",function(){
            thisRef.gridStartYManifoldSelectorHandle.val(this.value);
            const startVal=parseInt(this.value);
            if(parseInt(thisRef.gridEndYSelectorHandle.val())<startVal){
                thisRef.gridEndYSelectorHandle.val(this.value);
                thisRef.gridEndYManifoldSelectorHandle.val(this.value);
            }
            thisRef.drawGridSelectionHelperRect();
            if(thisRef.checkSelectionValidity(false,false)){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
        this.gridStartYManifoldSelectorHandle.off("change").on("change",function(){
            thisRef.gridStartYSelectorHandle.val(this.value);
            const startVal=parseInt(this.value);
            if(parseInt(thisRef.gridEndYSelectorHandle.val())<startVal){
                thisRef.gridEndYSelectorHandle.val(this.value);
                thisRef.gridEndYManifoldSelectorHandle.val(this.value);
            }
            thisRef.drawGridSelectionHelperRect();
            if(thisRef.checkSelectionValidity(false,false)){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
        this.gridEndYSelectorHandle.off("change").on("change",function(){
            thisRef.gridEndYManifoldSelectorHandle.val(this.value);
            const endVal=parseInt(this.value);
            if(parseInt(thisRef.gridStartYSelectorHandle.val())>endVal){
                thisRef.gridStartYSelectorHandle.val(this.value);
                thisRef.gridStartYManifoldSelectorHandle.val(this.value);
            }
            thisRef.drawGridSelectionHelperRect();
            if(thisRef.checkSelectionValidity(false,false)){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
        this.gridEndYManifoldSelectorHandle.off("change").on("change",function(){
            thisRef.gridEndYSelectorHandle.val(this.value);
            const endVal=parseInt(this.value);
            if(parseInt(thisRef.gridStartYSelectorHandle.val())>endVal){
                thisRef.gridStartYSelectorHandle.val(this.value);
                thisRef.gridStartYManifoldSelectorHandle.val(this.value);
            }
            thisRef.drawGridSelectionHelperRect();
            if(thisRef.checkSelectionValidity(false,false)){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
    }
    enablePlotControls(){
        if(this.multiplotMode){
            $('#flexibleGridSettingsGroup').css('display','inline');
            $('#flexibleGridSettingsManifoldGroup').css('display','inline');
            this.enableMultiplotSpecificControls();
        }else{
            $('#flexibleGridSettingsGroup').css('display','none');
            $('#flexibleGridSettingsManifoldGroup').css('display','none');
            this.colourSelectorHandle.off('change').on('change',function(){
                thisRef.forcedColourColumnPre=parseInt(this.value);
            });
            this.symbolSelectorHandle.off('change').on('change',function(){
                thisRef.forcedSymbolColumnPre=parseInt(this.value);
            });
            this.radiusSelectorHandle.off('change').on('change',function(){
                thisRef.forcedRadiusColumnPre=parseInt(this.value);
            });
        }
        let thisRef=this;
        this.flexibleSubcohortSelectorManifoldHandle.off('change').on('change',function () {
            thisRef.flexibleSubcohortSelectorHandle.val(this.value);
        });
        this.flexibleSubcohortSelectorHandle.off('change').on('change',function () {
            thisRef.flexibleSubcohortSelectorManifoldHandle.val(this.value);
        });
        $('#includeInBarplot_RelativeSignatures').off('change.bootstrapSwitch').on('change.bootstrapSwitch',function () {
            if($(this).is(':checked')){
                thisRef.relativeSignatureColumnIds.forEach((columnId)=>{
                    $(`#includeInBarplot_${columnId}`).prop('checked', true).parent().addClass('active');
                });
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.relativeSignatureColumnIds.forEach((columnId)=>{
                    $(`#includeInBarplot_${columnId}`).prop('checked', false).parent().removeClass('active');
                });
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
        $('#includeInBarplot_AbsoluteSignatures').off('change.bootstrapSwitch').on('change.bootstrapSwitch',function () {
            if($(this).is(':checked')){
                thisRef.absoluteSignatureColumnIds.forEach((columnId)=>{
                    $(`#includeInBarplot_${columnId}`).prop('checked', true).parent().addClass('active');
                });
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }else{
                thisRef.absoluteSignatureColumnIds.forEach((columnId)=>{
                    $(`#includeInBarplot_${columnId}`).prop('checked', false).parent().removeClass('active');
                });
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }
        });
        $('#includeInCustomManifold_RelativeSignatures').off('change.bootstrapSwitch').on('change.bootstrapSwitch',function () {
            if($(this).is(':checked')){
                thisRef.relativeSignatureColumnIds.forEach((columnId)=>{
                    $(`#includeInCustomManifold_${columnId}`).prop('checked', true).parent().addClass('active');
                });
                if(thisRef.checkSelectionValidity(true,false)){
                    $('#manifoldMainControls').css('display','inline');
                }
            }else{
                thisRef.relativeSignatureColumnIds.forEach((columnId)=>{
                    $(`#includeInCustomManifold_${columnId}`).prop('checked', true).parent().addClass('active');
                });
                if(
                    !thisRef.checkSelectionValidity(true,false)||
                    !thisRef.checkCustomManifoldValidity()
                ){
                    $('#manifoldMainControls').css('display','none');
                }
            }
        });
        $('#includeInCustomManifold_AbsoluteSignatures').off('change.bootstrapSwitch').on('change.bootstrapSwitch',function () {
            if($(this).is(':checked')){
                thisRef.absoluteSignatureColumnIds.forEach((columnId)=>{
                    $(`#includeInCustomManifold_${columnId}`).prop('checked', true).parent().addClass('active');
                });
                if(thisRef.checkSelectionValidity(true,false)){
                    $('#manifoldMainControls').css('display','inline');
                }
            }else{
                thisRef.absoluteSignatureColumnIds.forEach((columnId)=>{
                    $(`#includeInCustomManifold_${columnId}`).prop('checked', true).parent().addClass('active');
                });
                if(
                    !thisRef.checkSelectionValidity(true,false)||
                    !thisRef.checkCustomManifoldValidity()
                ){
                    $('#manifoldMainControls').css('display','none');
                }
            }
        });
        $('#flexibleDonorMarkerSelector').off('change').on('change',function () {
            if(parseInt(this.value)===-1){
                $('#submitDonorForMarking').css("display","none");
            } else{
                $('#submitDonorForMarking').css("display","inline");
            }
        });
        $('#submitDonorForMarking').off('click').on('click',()=>{
            const donorIndex=parseInt($('#flexibleDonorMarkerSelector').val());
            this.markDonor(donorIndex,false);
        });
        $('#flexibleSubcohortMarkerSelector').off('change').on('change',function () {
            if(parseInt(this.value)===-1){
                $('#submitSubcohortForMarking').css("display","none");
                $('#submitSubcohortForShading').css("display","none");
                $('#subcohortShadingConcavityGroup').css("display","none");
            } else{
                $('#submitSubcohortForMarking').css("display","inline");
                $('#submitSubcohortForShading').css("display","inline");
                $('#subcohortShadingConcavityGroup').css("display","inline");
            }
        });
        $('#submitSubcohortForMarking').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            const subcohortIndex=parseInt($('#flexibleSubcohortMarkerSelector').val());
            this.markSubcohort(subcohortIndex);
            this.commonSettings.fastRelease();
        });
        $('#submitSubcohortForShading').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            const subcohortIndex=parseInt($('#flexibleSubcohortMarkerSelector').val());
            let concavity = parseInt($('#subcohortShadingConcavityController').val());
            if(concavity>20){
                concavity=20*Math.pow(2,concavity-20);
            }
            this.shadeSubcohort(subcohortIndex,concavity);
            this.commonSettings.fastRelease();
        });
        this.xAxisSelectorHandle.off('change').on('change',function () {
            if(this.value==="-1"){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }else{
                if(thisRef.checkSelectionValidity(false,false)){
                    thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
                }else{
                    thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
                }
            }
            const currentText=$('#flexibleXaxisSelector :selected').text();
            if(currentText==="donor"){
                thisRef.yAxisSelectorGroupHandle.css('display','none');
                thisRef.resetStackedBarplotCheckboxes();
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
                thisRef.flexibleNumericColumnsForBarplotsGroupHandle.css('display','inline');
                thisRef.yAxisSelectorHandle.val(-1);
                thisRef.barplotAxisLabelHandle.html("<b>Y</b>");
            }else{
                thisRef.yAxisSelectorGroupHandle.css('display','inline');
                thisRef.flexibleNumericColumnsForBarplotsGroupHandle.css('display','none');
            }
        });
        this.yAxisSelectorHandle.off('change').on('change',function () {
            if(this.value==="-1"){
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
            }else{
                if(thisRef.checkSelectionValidity(false,false)){
                    thisRef.submitFlexiblePlotAnalysisHandle.css('display','inline');
                }else{
                    thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
                }
            }
            const currentText=$('#flexibleYaxisSelector :selected').text();
            if(currentText==="donor"){
                thisRef.xAxisSelectorGroupHandle.css('display','none');
                thisRef.resetStackedBarplotCheckboxes();
                thisRef.submitFlexiblePlotAnalysisHandle.css('display','none');
                thisRef.flexibleNumericColumnsForBarplotsGroupHandle.css('display','inline');
                thisRef.xAxisSelectorHandle.val(-1);
                thisRef.barplotAxisLabelHandle.html("<b>X</b>");
            }else{
                thisRef.xAxisSelectorGroupHandle.css('display','inline');
                thisRef.flexibleNumericColumnsForBarplotsGroupHandle.css('display','none');
            }
        });
        generalizedSliderEvents(
            "flexiblePlotBaseSizeFactorController",
            (x)=>{return Math.pow(2,parseInt(x)-3);},
            `DefaultSize x`,
            (x)=>{
                this.adjustDefaultSymbolSize(Math.pow(2,parseInt(x)-3));
                this.addLegend();
            });
        generalizedSliderEvents(
            "subcohortShadingConcavityController",
            (x)=>{
                if(x>20){
                    return 20*Math.pow(2,x-20);
                }else{
                    return x;
                }
                },
            `Concavity =`,
            (x)=>{
            });
        this.submitFlexiblePlotAnalysisHandle.off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            if(!this.multiplotMode){
                this.determineForcedColourScale();
                this.determineForcedSymbolScale();
                this.determineForcedRadiusScale();
            }
            this.submitFlexiblePlotAnalysisHandle.css('display','none');
            $('#flexiblePlotTypeToExpect').html("");
            this.usedDataPointsForClustering.length=0;
            this.usedDataPointsForClusteringDescriptions.length=0;
            $('#flexiblePlotManifoldChoicesCollapseControl').css('display','none');
            $('#flexiblePlotManifoldChoices').empty();
            $('#flexiblePlotGridSelectionHelperRect').remove();
            this.submitFlexiblePlotAnalysis();
            this.commonSettings.releaseLock();
        });
        $('#clearMarkedDonorsFromFlexiblePlot').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            this.clearMarkedDonors();
            $("#subcohortSelectionFromFlexiblePlotDescription").empty();
            this.commonSettings.fastRelease();
        });
        $('#clearShadedSubcohorts').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            this.clearShadedSubcohorts();
            this.commonSettings.fastRelease();
        });
        $('#flexibleSubcohortSelectionName').off('change').on('change',function(){
            if(thisRef.selectionManager.registeredSubcohortNamesSet.has(this.value)){
                $('#createSubcohortFromMarkedDonors').css('display','none');
            }else{
                $('#createSubcohortFromMarkedDonors').css('display','inline');
            }
        });
        $('#independentSubcohort').off('change').on('change',function () {
            $('#flexibleSubcohortSelector').val(thisRef.defaultSubcohort);
            $('#flexibleSubcohortSelectorManifold').val(thisRef.defaultSubcohort);
            if($(this).is(":checked")){
                $('#flexibleSubcohortSelectorGroup').css("display","inline");
            }else{
                $('#flexibleSubcohortSelectorGroup').css("display","none");
            }
        });
        $('#independentSubcohortManifold').off('change').on('change',function () {
            $('#flexibleSubcohortSelector').val(thisRef.defaultSubcohort);
            $('#flexibleSubcohortSelectorManifold').val(thisRef.defaultSubcohort);
            if($(this).is(":checked")){
                $('#flexibleSubcohortSelectorManifoldGroup').css("display","inline");
            }else{
                $('#flexibleSubcohortSelectorManifoldGroup').css("display","none");
            }
        });
        $('#independentColour').off('change').on('change',function () {
            $('#flexibleColourSelector').val(thisRef.forcedColourColumnPre);
            if($(this).is(":checked")){
                $('#flexibleColourSelectorGroup').css("display","inline");
            }else{
                $('#flexibleColourSelectorGroup').css("display","none");
            }
        });
        $('#independentSymbol').off('change').on('change',function () {
            $('#flexibleSymbolSelector').val(thisRef.forcedSymbolColumnPre);
            if($(this).is(":checked")){
                $('#flexibleSymbolSelectorGroup').css("display","inline");
            }else{
                $('#flexibleSymbolSelectorGroup').css("display","none");
            }
        });
        $('#independentRadius').off('change').on('change',function () {
            $('#flexibleRadiusSelector').val(thisRef.forcedRadiusColumnPre);
            if($(this).is(":checked")){
                $('#flexibleRadiusSelectorGroup').css("display","inline");
            }else{
                $('#flexibleRadiusSelectorGroup').css("display","none");
            }
        });
        $('#createSubcohortFromMarkedDonors').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            let directMarkedPanels=[];
            this.subplotModules.forEach((subplot,panelIndex,map)=>{
                if(subplot.directMarkedDonors.size>0){
                    directMarkedPanels.push(panelIndex);
                }
            });
            const selectionNameHandle=$('#flexibleSubcohortSelectionName');
            if(directMarkedPanels.length>1){
                let markedDonors=new Set();
                let missingDonors=new Set();
                this.cohortMetadata.donors.forEach((donorIndex)=>{
                    missingDonors.add(donorIndex);
                });
                this.subplotModules.forEach((subplot,panelIndex,map)=>{
                    missingDonors=new Set([...missingDonors].filter(x => subplot.missingDonors.has(x)));
                    markedDonors=new Set([...markedDonors, ...subplot.markedDonors]);
                });
                const selectionName=selectionNameHandle.val();
                this.cohortMetadata.finalizeSelection(
                    markedDonors,
                    missingDonors,
                    selectionName,"subcohortSelectionFromFlexiblePlotDescription");
            }else if(directMarkedPanels.length===1){
                const subplot=this.subplotModules.get(directMarkedPanels[0]);
                const selectionNameHandle=$('#flexibleSubcohortSelectionName');
                const selectionName=selectionNameHandle.val();
                this.cohortMetadata.finalizeSelection(
                    subplot.markedDonors,
                    subplot.missingDonors,
                    selectionName,"subcohortSelectionFromFlexiblePlotDescription");
            }
            this.submitFlexiblePlotAnalysisHandle.css('display','inline');
            selectionNameHandle.val('').css('display','none');
            this.commonSettings.fastRelease();
        });
    }
    submitFlexiblePlotAnalysis(){
        this.addSubplot(...this.readSubplotChoices());
        $('#flexiblePlotTypeToExpect').html("");
        this.xAxisSelectorHandle.val(-1);
        this.yAxisSelectorHandle.val(-1);
        this.xAxisSelectorGroupHandle.css('display','inline');
        this.yAxisSelectorGroupHandle.css('display','inline');
        this.colourSelectorHandle.val(this.forcedColourColumnPre);
        this.radiusSelectorHandle.val(this.forcedRadiusColumnPre);
        this.symbolSelectorHandle.val(this.forcedSymbolColumnPre);
        this.flexibleSubcohortSelectorManifoldHandle.val(this.defaultSubcohort);
        this.flexibleSubcohortSelectorHandle.val(this.defaultSubcohort);
        this.xAxisSelectorHandle.css('display','inline');
        this.yAxisSelectorHandle.css('display','inline');
        this.resetStackedBarplotCheckboxes();
        this.resetCustomManifoldCheckboxes();
    }
    drawGridSelectionHelperRect(panelIndex=null){
        let gridStartX=null;
        let gridEndX=null;
        let gridStartY=null;
        let gridEndY=null;
        if(panelIndex===null){
            gridStartX=parseInt(this.gridStartXSelectorHandle.val());
            if(gridStartX===-1){
                this.flexiblePlotGridSelectionHelperRectHandle.remove();
                this.submitFlexiblePlotAnalysisHandle.css('display','none');
                return;
            }
            gridEndX=parseInt(this.gridEndXSelectorHandle.val());
            if(gridEndX===-1){
                this.flexiblePlotGridSelectionHelperRectHandle.remove();
                this.submitFlexiblePlotAnalysisHandle.css('display','none');
                return;
            }
            if(gridStartX>gridEndX){
                return;
            }
            gridStartY=parseInt(this.gridStartYSelectorHandle.val());
            if(gridStartY===-1){
                this.flexiblePlotGridSelectionHelperRectHandle.remove();
                this.submitFlexiblePlotAnalysisHandle.css('display','none');
                return;
            }
            gridEndY=parseInt(this.gridEndYSelectorHandle.val());
            if(gridEndY===-1){
                this.flexiblePlotGridSelectionHelperRectHandle.remove();
                this.submitFlexiblePlotAnalysisHandle.css('display','none');
                return;
            }
            if(gridStartY>gridEndY){
                return;
            }
        }else{
            const subplotInfo=this.subplotInfo.get(panelIndex);
            gridStartX=subplotInfo.flexibleGridStartX;
            gridEndX=subplotInfo.flexibleGridEndX;
            gridStartY=subplotInfo.flexibleGridStartY;
            gridEndY=subplotInfo.flexibleGridEndY;
        }
        const gridWidth=this.svgCellWidth*(gridEndX-gridStartX+1);
        const gridHeight=this.svgCellHeight*(gridEndY-gridStartY+1);
        this.flexiblePlotGridSelectionHelperRectHandle.remove();
        this.gridGuides.append("rect")
            .attr("id","flexiblePlotGridSelectionHelperRect")
            .attr("x", this.gridCellXstartPositions[gridStartX])
            .attr("y", this.gridCellYstartPositions[gridStartY])
            .attr("width", gridWidth)
            .attr("height", gridHeight)
            .style("fill","none")
            .style("stroke","Red")
            .style("stroke-width",2);
        this.flexiblePlotGridSelectionHelperRectHandle=$('#flexiblePlotGridSelectionHelperRect')
    }
    resetSelectionRect(){
        this.rectStart={};
        this.rectEnd={};
        $('#flexibleDonorSelectBox').remove();
    }
    checkSelectionValidity(dimensionalityReductionMode,stackedBarMode){
        let selectorIds=[];
        if(this.multiplotMode){
            selectorIds.push("gridStartXSelectorHandle");
            selectorIds.push("gridEndXSelectorHandle");
            selectorIds.push("gridStartYSelectorHandle");
            selectorIds.push("gridEndYSelectorHandle");
        }
        if(!dimensionalityReductionMode&&!stackedBarMode){
            selectorIds.push("xAxisSelectorHandle");
            selectorIds.push("yAxisSelectorHandle");
        }
        const selectorIdsLength=selectorIds.length;
        for(let i=0; i<selectorIdsLength;++i){
            if(this[selectorIds[i]].val()==="-1"){
                return false;
            }
        }
        if(stackedBarMode){
            let includeInBarplotHandlesIter = this.includeInBarplotHandles.keys();
            for (const columnName of includeInBarplotHandlesIter) {
                if(this.includeInBarplotHandles.get(columnName).is(':checked')){
                    this.annotateExpectedPlotType(true);
                    return true;
                }
            }
            return false;
        }else{
            this.annotateExpectedPlotType(false);
            return true;
        }
    }
    annotateExpectedPlotType(stackedBar){
        if(stackedBar){
            if(this.xAxisSelectorHandle.val()==="-1"){
                $('#flexiblePlotTypeToExpect').html("Generated Plot -> Horizontal (Stacked) Bar Plot");
            }else{
                $('#flexiblePlotTypeToExpect').html("Generated Plot -> Vertical (Stacked) Bar Plot");
            }
        }else{
            const xAxisColumnId=parseInt(this.xAxisSelectorHandle.val());
            const yAxisColumnId=parseInt(this.yAxisSelectorHandle.val());
            const xAxisType=this.cohortMetadata.metadataDataTypes.get(this.columnIds.get(xAxisColumnId));
            const yAxisType=this.cohortMetadata.metadataDataTypes.get(this.columnIds.get(yAxisColumnId));
            const xNumeric=xAxisType==="numeric";
            const yNumeric=yAxisType==="numeric";
            if(xNumeric&&yNumeric){
                if(xAxisColumnId===yAxisColumnId){
                    $('#flexiblePlotTypeToExpect').html("-> Self-Scatter Plot With KDE & Boxplot");
                }else{
                    $('#flexiblePlotTypeToExpect').html("-> Scatter Plot");
                }
            }else{
                if(xNumeric&&!yNumeric){
                    $('#flexiblePlotTypeToExpect').html("-> Horizontal KDE & Boxplots with Jitters");
                }else if(!xNumeric&&yNumeric){
                    $('#flexiblePlotTypeToExpect').html("-> Vertical KDE & Boxplots with Jitters");
                }else{
                    $('#flexiblePlotTypeToExpect').html("-> Multi-Categorical Plot");
                }
            }
        }
    }
    resetStackedBarplotCheckboxes(){
        this.flexibleNumericColumnsForBarplotsGroupHandle.css('display','none');
        this.flexibleNumericColumnsForBarplotsCollapseHandle.collapse('hide');
        this.includeInBarplotHandles.forEach((handle,columnName,map)=>{
            handle.prop('checked', false).parent().removeClass('active');
        });
        $('#includeInBarplot_AbsoluteSignatures').prop('checked', false).parent().removeClass('active');
        $('#includeInBarplot_RelativeSignatures').prop('checked', false).parent().removeClass('active');
    }
    readSubplotChoices(){
        const flexibleGridStartX=parseInt(this.gridStartXSelectorHandle.val());
        const flexibleGridEndX=parseInt(this.gridEndXSelectorHandle.val());
        const flexibleGridStartY=parseInt(this.gridStartYSelectorHandle.val());
        const flexibleGridEndY=parseInt(this.gridEndYSelectorHandle.val());
        if(this.multiplotMode){
            this.gridStartXSelectorHandle.val("-1");
            this.gridEndXSelectorHandle.val("-1");
            this.gridEndYSelectorHandle.val("-1");
            this.gridStartYSelectorHandle.val("-1");
            this.gridStartXManifoldSelectorHandle.val("-1");
            this.gridStartYManifoldSelectorHandle.val("-1");
            this.gridEndXManifoldSelectorHandle.val("-1");
            this.gridEndYManifoldSelectorHandle.val("-1");
        }else{
            this.gridStartXSelectorHandle.val("0");
            this.gridEndXSelectorHandle.val("0");
            this.gridEndYSelectorHandle.val("0");
            this.gridStartYSelectorHandle.val("0");
            this.gridEndYSelectorHandle.val("0");
            this.gridStartXManifoldSelectorHandle.val("0");
            this.gridStartYManifoldSelectorHandle.val("0");
            this.gridEndXManifoldSelectorHandle.val("0");
            this.gridEndYManifoldSelectorHandle.val("0");
        }
        const subcohortIndex=parseInt(this.flexibleSubcohortSelectorHandle.val());
        const xAxisColumnPre=parseInt(this.xAxisSelectorHandle.val());
        const yAxisColumnPre=parseInt(this.yAxisSelectorHandle.val());
        const colourColumnPre=parseInt(this.colourSelectorHandle.val());
        const radiusColumnPre=parseInt(this.radiusSelectorHandle.val());
        const symbolColumnPre=parseInt(this.symbolSelectorHandle.val());
        let colourColumn="";
        if(colourColumnPre!==-1){
            colourColumn=this.cohortMetadata.possibleMetadataColumnsReverse.get(colourColumnPre);
        }
        let symbolColumn="";
        if(symbolColumnPre!==-1){
            symbolColumn=this.cohortMetadata.possibleMetadataColumnsReverse.get(symbolColumnPre);
        }
        let radiusColumn="";
        if(radiusColumnPre!==-1){
            radiusColumn=this.cohortMetadata.possibleMetadataColumnsReverse.get(radiusColumnPre);
        }

        const xAxisColumn=this.cohortMetadata.possibleMetadataColumnsReverse.get(xAxisColumnPre);
        const yAxisColumn=this.cohortMetadata.possibleMetadataColumnsReverse.get(yAxisColumnPre);
        const xAxisType=this.cohortMetadata.metadataDataTypes.get(xAxisColumn);
        const yAxisType=this.cohortMetadata.metadataDataTypes.get(yAxisColumn);

        if(xAxisType==="numeric" && yAxisType==="numeric"){
            this.flexiblePlotClusteringTargetPanelSelectorHandle.append(`<option value="${this.maxSubplotInfo}">Subplot ${this.maxSubplotInfo}</option>`);
            $('#flexiblePlotClusteringControls').css('display','inline');
        }
        $('#flexiblePlotBaseSizeFactorControllerGroup').css('display','inline');
        $('#flexibleDonorMarkerGroup').css('display','inline');
        $('#flexibleSubcohortMarkerGroup').css('display','inline');
        let stackedBarNumericColumns=[];
        if(xAxisColumnPre===-1||yAxisColumnPre===-1){
            this.includeInBarplotHandles.forEach((barplotHandle,columnName,map)=>{
                if(barplotHandle.is(':checked')){
                    stackedBarNumericColumns.push(columnName);
                }
            })
        }
        return[
            flexibleGridStartX,
            flexibleGridStartY,
            flexibleGridEndX,
            flexibleGridEndY,
            subcohortIndex,
            xAxisColumn,
            yAxisColumn,
            colourColumn,
            symbolColumn,
            radiusColumn,
            stackedBarNumericColumns
        ]
    }
    cleanupAllSubplots(){
        let panelsToDestroy=new Set();
        this.subplotInfo.forEach((subplotInfo,panelIndex,map)=>{
            panelsToDestroy.add(panelIndex);
        });
        panelsToDestroy.forEach((panelIndex)=>{
            this.subplotInfo.delete(panelIndex);
            this.subplotModules.get(panelIndex).cleanup();
            this.subplotModules.delete(panelIndex);
            this.flexiblePlotClusteringTargetPanelSelectorHandle.find(`[value="${panelIndex}"]`).remove();
        });
    }
    addSubplot(
        flexibleGridStartX,
        flexibleGridStartY,
        flexibleGridEndX,
        flexibleGridEndY,
        subcohortIndex,
        xAxisColumn,
        yAxisColumn,
        colourColumn,
        symbolColumn,
        radiusColumn,
        stackedBarNumericColumns,
    ){
        let panelsToDestroy=new Set();
        this.subplotInfo.forEach((subplotInfo,panelIndex,map)=>{
            if(flexibleGridStartX <= subplotInfo.flexibleGridEndX && subplotInfo.flexibleGridStartX <= flexibleGridEndX){
                if(flexibleGridStartY <= subplotInfo.flexibleGridEndY && subplotInfo.flexibleGridStartY <= flexibleGridEndY){
                    panelsToDestroy.add(panelIndex);
                }
            }
        });
        panelsToDestroy.forEach((panelIndex)=>{
            this.subplotInfo.delete(panelIndex);
            this.subplotModules.get(panelIndex).cleanup();
            this.subplotModules.delete(panelIndex);
            this.flexiblePlotClusteringTargetPanelSelectorHandle.find(`[value="${panelIndex}"]`).remove();
        });
        const bottomRow=flexibleGridStartY===this.gridCellYstartPositions.length-1;
        this.subplotInfo.set(this.maxSubplotInfo,
            {
                panelIndex:this.maxSubplotInfo,
                flexibleGridStartX:flexibleGridStartX,
                flexibleGridStartY:flexibleGridStartY,
                flexibleGridEndX:flexibleGridEndX,
                flexibleGridEndY:flexibleGridEndY,
                svgStartX:this.gridCellXstartPositions[flexibleGridStartX],
                svgStartY:this.gridCellYstartPositions[flexibleGridStartY],
                svgWidth:this.svgCellWidth*(flexibleGridEndX-flexibleGridStartX+1),
                svgHeight:this.svgCellHeight*(flexibleGridEndY-flexibleGridStartY+1),
                subcohortIndex:subcohortIndex,
                xAxisColumn:xAxisColumn,
                yAxisColumn:yAxisColumn,
                colourColumn:colourColumn,
                symbolColumn:symbolColumn,
                radiusColumn:radiusColumn,
                stackedBarNumericColumns:stackedBarNumericColumns,
                leftMostColumn:flexibleGridStartX===0,
                rightMostColumn:flexibleGridStartX===this.gridCellXstartPositions.length-1,
                bottomRow:bottomRow,
                topRow:flexibleGridStartY===0,
                forcedIndependence:
                    colourColumn!==this.forcedColourColumn||
                    symbolColumn!==this.forcedSymbolColumn||
                    radiusColumn!==this.forcedRadiusColumn
            }
        );
        this.subplotModules.set(
            this.maxSubplotInfo,
            new FlexiblePlotModule(
                this.commonSettings,
                this.references,
                this.cohortMetadata,
                this.selectionManager,
                this.fontManager,
                this,
                subcohortIndex,
                this.subplotInfo.get(this.maxSubplotInfo),
                null,
                null,
                null,
                null
            )
        );
        if(flexibleGridEndY>this.maxYDepth){
            this.maxYDepth=flexibleGridEndY;
        }
        this.addLegend();
        this.maxSubplotInfo+=1;
    }
    markSubcohort(subcohortIndex){
        this.selectionManager.registeredSubcohorts.get(subcohortIndex).forEach((donorIndex)=>{
            this.markDonor(donorIndex,false);
        });
    }
    shadeSubcohort(subcohortIndex,concavity){
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.shadeSubcohort(subcohortIndex,concavity);
        });
    }
    removeSubcohortShade(subcohortIndex){
        let currentShadedSubcohorts=new Set();
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.removeSubcohortShade(subcohortIndex);
            subplot.subcohortShades.keys().forEach((subcohortIndex)=>{
                currentShadedSubcohorts.add(subcohortIndex);
            });
        });
        if(currentShadedSubcohorts.size===0){
            $("#clearShadedSubcohorts").css("display","none");
        }
    }
    clearShadedSubcohorts(){
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.clearShadedSubcohorts();
        });
        $("#clearShadedSubcohorts").css("display","none");
    }
    replotSubplots(){
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.replot();
        });
    }
    refreshHoverColumns(){
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.refreshHoverColumns();
        });
    }
    refreshLabelColumns(){
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.refreshLabelColumns();
        });
    }
    remarkDonors(){
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.remarkDonors();
        });
    }
    clearMarkedDonors(){
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.clearMarkedDonors();
        });
        $('#clearMarkedDonorsFromFlexiblePlot').css('display','none');
    }
    removeDonorMark(donorIndex){
        let currentMarkedDonors=new Set();
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.removeDonorMark(donorIndex);
            currentMarkedDonors=new Set([...currentMarkedDonors,...subplot.markedDonors]);
        });
        if(currentMarkedDonors.size===0){
            $('#clearMarkedDonorsFromFlexiblePlot').css('display','none');
            $('#subcohortSelectionFromFlexiblePlotGroup').css('display','none');
            $('#flexibleSubcohortSelectionName').css('display','none');
        }
    }
    markDonor(donorIndex,removeExisting){
        if(removeExisting&&this.markedDonors.has(donorIndex)){
            this.markedDonors.delete(donorIndex);
        }else{
            this.markedDonors.add(donorIndex);
        }
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.markDonor(donorIndex,removeExisting);
        })
    }
    adjustDefaultSymbolSize(newSymbolSize){
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.adjustDefaultSymbolSize(newSymbolSize);
        })
    }

    enablePCAControls(){
        $("#PCASubmit").off("click").on("click", ()=> {
            $("#PCASubmit").css("display","none");
            this.runPCA();
        });
    }
    enableUMAPControls(){
        let thisRef=this;
        $("#nDimPCAPreUmap").slider('setAttribute','max',this.cohortMetadata.donors.size).slider('setValue',Math.min(50,this.cohortMetadata.donors.size)).slider('refresh');
        $("#nDimPCAPreUmapLabel").html(`Dimensions: ${Math.min(50,this.cohortMetadata.donors.size)}`);
        let UMAPDistanceSelector=$('#UMAPDistanceSelector');
        UMAPDistanceSelector.off('change').on('change',function () {
            if(this.value==="-1" ||
                !FlexiblePlotManagerNew.checkMinDistSpreadValidity()||
                !thisRef.checkSelectionValidity(true,false)){
                $('#UMAPSubmit').css('display','none');
            }else{
                $('#UMAPSubmit').css('display','inline');
            }
        });
        const controlElements=["UMAP_minDist","UMAP_spread","UMAP_n_neighbors","UMAP_n_epochs","UMAP_learningRate","UMAP_set_op_mix_ratio","UMAP_local_connectivity","UMAP_repulsion_strength","UMAP_negative_sample_rate","nDimPCAPreUmap"];
        const controlElementLabels=["minDist (must be <= spread)","spread (must be >= minDist)","n_neighbors","n_epochs","learningRate","set_op_mix_ratio","local_connectivity","repulsion_strength","negative_sample_rate","Dimensions"];
        for(let i=0;i<controlElements.length;++i){
            generalizedSliderEvents(
                `${controlElements[i]}`,
                (x)=>{return x;},
                `${controlElementLabels[i]}:`,
                (x)=>{
                    if(i===0||i===1){
                        if(FlexiblePlotManagerNew.checkMinDistSpreadValidity()&&
                            UMAPDistanceSelector.val()!=="-1"&&
                            this.checkSelectionValidity(true,false)){
                            $('#UMAPSubmit').css('display','inline');
                        }else{
                            $('#UMAPSubmit').css('display','none');
                        }
                    }
                });
        }
        $("#UMAPSubmit").off("click").on("click", ()=> {
            $("#UMAPSubmit").css("display","none");
            this.runUMAP();
        });
        $('#nDimPCAPreUmapGroup').css('display','none');
        $('#pcaPreUmap').removeClass('checked').prop('checked', false).off('change.bootstrapSwitch').on('change.bootstrapSwitch',function(){
            if($(this).is(':checked')){
                $('#nDimPCAPreUmapGroup').css('display','inline');
            }else{
                $('#nDimPCAPreUmapGroup').css('display','none');
            }
        });
    }
    static checkMinDistSpreadValidity(){
        const minDistVal=+$('#UMAP_minDist').val();
        const spreadVal=+$('#UMAP_spread').val();
        return minDistVal<=spreadVal;
    }
    enableTSNEControls(){
        let thisRef=this;
        const controlElements=[
            "tSNEPerplexity",
            "tSNELearningRate",
            "tSNEIterations",
            "nDimPCAPreTsne",
            "tSNEEarlyExaggeration",
            "tSNEIterationsEarlyExaggeration",
            "tSNELateExaggeration",
            "tSNEIterationsLateExaggeration",
            "tSNEAlpha",
        ];
        const controlElementLabels=[
            "Perplexity",
            "Learning Rate",
            "Iterations",
            "Dimensions",
            "EarlyExaggeration",
            "IterationsEarlyExaggeration",
            "LateExaggeration",
            "IterationsLateExaggeration",
            "Alpha",
        ];
        for(let i=0;i<controlElements.length;++i){
            generalizedSliderEvents(
                `${controlElements[i]}`,
                (x)=>{return x;},
                `${controlElementLabels[i]}:`,
                (x)=>{});
        }
        $("#tSNEPerplexity").slider('setAttribute','max',this.cohortMetadata.donors.size-1).slider('refresh');
        $("#nDimPCAPreTsne").slider('setAttribute','max',this.cohortMetadata.donors.size).slider('setValue',Math.min(50,this.cohortMetadata.donors.size)).slider('refresh');
        $("#nDimPCAPreTsneLabel").html(`Dimensions: ${Math.min(50,this.cohortMetadata.donors.size)}`);
        $("#tSNESubmit").off("click").on("click", ()=> {
            $("#tSNESubmit").css('display','none');
            this.runTSNE();
        });
        $('#nDimPCAPreTsneGroup').css('display','none');
        $('#pcaPreTsne').removeClass('checked').prop('checked', false).off('change.bootstrapSwitch').on('change.bootstrapSwitch',function(){
            if($(this).is(':checked')){
                $('#nDimPCAPreTsneGroup').css('display','inline');
            }else{
                $('#nDimPCAPreTsneGroup').css('display','none');
            }
        });
    }
    enableClusteringControls(){
        let thisRef=this;
        this.flexiblePlotClusteringTargetPanelSelectorHandle.off("change").on("change",function(){
            thisRef.drawGridSelectionHelperRect(thisRef.subplotInfo.get(parseInt(this.value)).panelIndex);
        });
        let cleanupClusterIfNecessary=(panelIndex)=>{
            this.commonSettings.fastLock();
            const clusteringPrefixName=`p_${panelIndex}_${$('#flexibleClusteringPrefixName').val()}`;
            if(this.selectionManager.clusteringPrefixToSubcohortIndices.has(clusteringPrefixName)){
                const deletedSubcohorts=this.selectionManager.cleanupSubcohortCluster(clusteringPrefixName,this.cohortMetadata);
                deletedSubcohorts.forEach((subcohortIndex)=>{
                   this.removeSubcohortShade(subcohortIndex);
                });
                this.cohortMetadata.setupComplexSelectionQueryBuilder();
                this.cohortMetadata.refreshMetadata();
                this.cohortMetadata.updateSelectionToCategoricalControls();
                this.submitFlexiblePlotAnalysisHandle.css('display','inline');
            }
            this.commonSettings.fastRelease();
        };
        const clusteringPrefixNameHandle = $('#flexibleClusteringPrefixName');
        const clusteringPrefixDistanceHandle = $('#FlexibleClusteringDistanceSelector');
        const buttonIds=["#KmeansSubmit","#KmedoidsSubmit","#DBSCANSubmit","#OPTICSSubmit"];
        // const buttonIds=["#KmeansSubmit","#KmedoidsSubmit","#DBSCANSubmit","#OPTICSSubmit","#HDBSCANSubmit"];
        clusteringPrefixNameHandle.off('change').on('change',function(){
            if(this.value==="" || clusteringPrefixDistanceHandle.val()==="-1"){
                for(let i=0;i<buttonIds.length;++i){
                    $(buttonIds[i]).css('display','none');
                }
            }else {
                for(let i=0;i<buttonIds.length;++i){
                    $(buttonIds[i]).css('display','inline');
                }
            }
        });
        clusteringPrefixDistanceHandle.off('change').on('change',function () {
            const clusteringPrefixName=clusteringPrefixNameHandle.val();
            if(this.value==="-1" || clusteringPrefixName===""){
                for(let i=0;i<buttonIds.length;++i){
                    $(buttonIds[i]).css('display','none');
                }
            }else{
                for(let i=0;i<buttonIds.length;++i){
                    $(buttonIds[i]).css('display','inline');
                }
            }
        });
        $("#KmeansSubmit").off("click").on("click", ()=> {
            this.commonSettings.lock();
            this.flexiblePlotGridSelectionHelperRectHandle.remove();
            const panelIndex=parseInt(this.flexiblePlotClusteringTargetPanelSelectorHandle.val());
            cleanupClusterIfNecessary(panelIndex);
            this.subplotModules.get(panelIndex).runKmeans($('#flexibleClusteringPrefixName').val(),$('#shadeClusters').is(":checked"),$('#FlexibleClusteringDistanceSelector').val());
            this.commonSettings.releaseLock();
        });
        $("#KmedoidsSubmit").off("click").on("click", ()=> {
            this.commonSettings.lock();
            this.flexiblePlotGridSelectionHelperRectHandle.remove();
            const panelIndex=parseInt(this.flexiblePlotClusteringTargetPanelSelectorHandle.val());
            cleanupClusterIfNecessary(panelIndex);
            this.subplotModules.get(panelIndex).runKmedoids($('#flexibleClusteringPrefixName').val(),$('#shadeClusters').is(":checked"),$('#FlexibleClusteringDistanceSelector').val());
            this.commonSettings.releaseLock();
        });
        $("#DBSCANSubmit").off("click").on("click", ()=> {
            this.commonSettings.lock();
            this.flexiblePlotGridSelectionHelperRectHandle.remove();
            const panelIndex=parseInt(this.flexiblePlotClusteringTargetPanelSelectorHandle.val());
            cleanupClusterIfNecessary(panelIndex);
            this.subplotModules.get(panelIndex).runDBSCAN($('#flexibleClusteringPrefixName').val(),$('#shadeClusters').is(":checked"),$('#FlexibleClusteringDistanceSelector').val());
            this.commonSettings.releaseLock();
        });
        $("#OPTICSSubmit").off("click").on("click", ()=> {
            this.commonSettings.lock();
            this.flexiblePlotGridSelectionHelperRectHandle.remove();
            const panelIndex=parseInt(this.flexiblePlotClusteringTargetPanelSelectorHandle.val());
            cleanupClusterIfNecessary(panelIndex);
            this.subplotModules.get(panelIndex).runOPTICS($('#flexibleClusteringPrefixName').val(),$('#shadeClusters').is(":checked"));
            this.commonSettings.releaseLock();
        });
        // $("#HDBSCANSubmit").off("click").on("click", ()=> {
        //     this.commonSettings.lock();
        //     this.flexiblePlotGridSelectionHelperRectHandle.remove();
        //     const panelIndex=parseInt(this.flexiblePlotClusteringTargetPanelSelectorHandle.val());
        //     cleanupClusterIfNecessary(panelIndex);
        //     this.subplotModules.get(panelIndex).runHDBSCAN();
        //     this.commonSettings.releaseLock();
        // });
        const controlElements=["mPtsMinOPTICS","neighbourhoodRadiusOPTICS","mPtsMaxDBSCAN","mPtsMinDBSCAN", "epsMaxDBSCAN", "epsMinDBSCAN", "kmedoidsK", "kmeansK"];
        const controlElementLabels=["mPtsMin","neighbourhoodRadius","mPtsMax","mPtsMin","epsMax","epsMin","K","K"];
        for(let i=0;i<controlElements.length;++i){
            generalizedSliderEvents(
                `${controlElements[i]}`,
                (x)=>{return x;},
                `${controlElementLabels[i]}:`,
                (x)=>{});
        }
    }
    runPCA(){
        this.commonSettings.lock();
        if(!this.customManifoldMode){
            const phenotype=$("#ManifoldPhenotypeSelector").val();
            if(phenotype==="cnStatus" || phenotype==="svStatus"){
                setTimeout(()=>{this.runManifoldAnalysisNoDb(phenotype,"PCA")},0);
            }else{
                setTimeout(()=>{this.runManifoldAnalysis(phenotype,"PCA")},0);
            }
        }else{
            setTimeout(()=>{this.runManifoldAnalysisCustomMetadata(this.getMetadataColumnsForCustomManifoldAnalysis(),"PCA");},0);
        }
    }
    runTSNE(){
        this.commonSettings.lock();
        if(!this.customManifoldMode){
            const phenotype=$("#ManifoldPhenotypeSelector").val();
            if(phenotype==="cnStatus" || phenotype==="svStatus"){
                setTimeout(()=>{this.runManifoldAnalysisNoDb(phenotype,"tSNE")},0);
            }else{
                setTimeout(()=>{this.runManifoldAnalysis(phenotype,"tSNE")},0);
            }
        }else{
            setTimeout(()=>{this.runManifoldAnalysisCustomMetadata(this.getMetadataColumnsForCustomManifoldAnalysis(),"tSNE");},0);
        }
    }
    runUMAP(){
        this.commonSettings.lock();
        if(!this.customManifoldMode){
            const phenotype=$("#ManifoldPhenotypeSelector").val();
            if(phenotype==="cnStatus" || phenotype==="svStatus"){
                setTimeout(()=>{this.runManifoldAnalysisNoDb(phenotype,"UMAP")},0);
            }else{
                setTimeout(()=>{this.runManifoldAnalysis(phenotype,"UMAP")},0);
            }
        }else{
            setTimeout(()=>{this.runManifoldAnalysisCustomMetadata(this.getMetadataColumnsForCustomManifoldAnalysis(),"UMAP");},0);
        }
    }
    getMetadataColumnsForCustomManifoldAnalysis(){
        let metadataColumns=[];
        this.includeInCustomManifoldHandles.forEach((handle,columnName,map)=>{
            if(handle.is(':checked')){
                metadataColumns.push(columnName);
            }
        });
        return metadataColumns;
    }
    enableManifoldControls(){
        let thisRef=this;
        generalizedSliderEvents(
            "ManifoldTopN",
            (x)=>{return 50*x;},
            "Top N:",
            (x)=>{});
        $('#manifoldMainControls').css('display','none');
        let phenotypeSelector=$('#ManifoldPhenotypeSelector');
        phenotypeSelector.empty();
        phenotypeSelector.append(`<option value="-1">Select Phenotype</option>`);
        if(this.cohortMetadata.geneExpressionAvailable>2){
            phenotypeSelector.append(`<option value="geneExpressions">Gene Expression</option>`);
        }
        if(this.cohortMetadata.methylomeArrayAvailable>2){
            phenotypeSelector.append(`<option value="methylomeBetas">Methylome Betas</option>`);
        }
        if(this.cohortMetadata.cnvAvailable>2){
            phenotypeSelector.append(`<option value="cnStatus">Copy Number Status</option>`);
        }
        if(this.cohortMetadata.svAvailable>2){
            phenotypeSelector.append(`<option value="svStatus">SV Status</option>`);
        }
        phenotypeSelector.append(`<option value="custom">Custom Numeric Metadata Columns (at least 3)</option>`);
        phenotypeSelector.off('change').on('change',function () {
            if(this.value==="custom"){
                $('#ManifoldTopNGroup').css('display','none');
                thisRef.resetCustomManifoldCheckboxes();
                thisRef.customManifoldMode=true;
                thisRef.flexibleNumericColumnsForCustomManifoldGroupHandle.css('display','inline');
                thisRef.includeInCustomManifoldHandles.forEach((handle,columnName,map)=>{
                    handle.off('change.bootstrapSwitch').on('change.bootstrapSwitch',()=>{
                        if(
                            !thisRef.checkSelectionValidity(true,false)||
                            !thisRef.checkCustomManifoldValidity()
                        ){
                            $('#manifoldMainControls').css('display','none');
                        }else{
                            $('#manifoldMainControls').css('display','inline');
                        }
                    });
                });
            }else{
                thisRef.resetCustomManifoldCheckboxes();
                $('#ManifoldTopNGroup').css('display','inline');
                if(parseInt(this.value)===-1||!thisRef.checkSelectionValidity(true,false)){
                    $('#manifoldMainControls').css('display','none');
                }else{
                    $('#manifoldMainControls').css('display','inline');
                }
            }
        });
    }
    runManifoldAnalysisCustomMetadata(metadataColumns,analysisType){
        let validDonors=[];
        const numColumns=metadataColumns.length;
        const lenMetadata=this.cohortMetadata.metadata.length;
        const currentValidDonors=this.selectionManager.registeredSubcohorts.get(parseInt($('#flexibleSubcohortSelectorManifold').val()));
        for(let i=0;i<lenMetadata;++i){
            if(currentValidDonors.has(this.cohortMetadata.metadata[i].index)){
                let validDonor=true;
                for(let c=0;c<numColumns;++c){
                    if(this.commonSettings.undefinedValues.has(this.cohortMetadata.metadata[i][metadataColumns[c]])){
                        validDonor=false;
                        break;
                    }
                }
                if(validDonor){
                    validDonors.push(this.cohortMetadata.metadata[i].index);
                }
            }
        }
        let phenotypeMatrix=[];
        for(let q=0;q<validDonors.length;++q){
            let i=validDonors[q];
            phenotypeMatrix.push([]);
            for(let c=0;c<numColumns;++c){
                const val = this.cohortMetadata.metadata[i][metadataColumns[c]];
                phenotypeMatrix[q].push(val);
            }
        }
        let phenotype=$('#flexibleCustomManifoldName').val();
        if(phenotype===""){
            phenotype=metadataColumns.join(',');
        }
        this.continueWithManifoldData(analysisType,phenotype,-1,phenotypeMatrix,validDonors);
    }
    runManifoldAnalysisNoDb(phenotype,analysisType){
        this.usedDataPointsForClustering.length=0;
        this.usedDataPointsForClusteringDescriptions.length=0;
        let topN=50*(+$("#ManifoldTopN").slider().val());
        const lenMetadata=this.cohortMetadata.metadata.length;
        const currentValidDonors=this.selectionManager.registeredSubcohorts.get(parseInt($('#flexibleSubcohortSelectorManifold').val()));
        let validDonors=[];
        let preData=[];
        if(phenotype==="cnStatus"){
            topN=topN*2;
            for(let i=0;i<lenMetadata;++i){
                const donorIndex=this.cohortMetadata.metadata[i].index;
                if(currentValidDonors.has(donorIndex)){
                    if(this.cohortMetadata.metadata[i]["CNV"]==="+"){
                        validDonors.push(donorIndex);
                    }
                }
            }
            for(let i=1;i<this.references.tads.length;++i){
                if(this.references.tads[i].chromosomeIndex<23){
                    const lossDonors = this.references.tads[i].cnvLossDonorContributorIndices;
                    const gainDonors = this.references.tads[i].cnvGainDonorContributorIndices;
                    const lohDonors = this.references.tads[i].lohDonorContributorIndices;
                    let tmpListLohLoss=[];
                    let tmpListGain=[];
                    let anyHitLohLoss=false;
                    let anyHitGain=false;
                    for(let j=0;j<validDonors.length;++j){
                        if(lossDonors.has(validDonors[j]) || lohDonors.has(validDonors[j])){
                            tmpListLohLoss[j] = Math.random() * 0.05 + 0.95;
                            anyHitLohLoss=true;
                        }else{
                            tmpListLohLoss[j] = Math.random() * 0.05;
                        }
                        if(gainDonors.has(validDonors[j])){
                            tmpListGain[j] = Math.random() * 0.05 + 0.95;
                            anyHitGain=true;
                        }else{
                            tmpListGain[j] = Math.random() * 0.05;
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
        }else if(phenotype==="svStatus"){
            for(let i=0;i<lenMetadata;++i){
                const donorIndex=this.cohortMetadata.metadata[i].index;
                if(currentValidDonors.has(donorIndex)){
                    if(this.cohortMetadata.metadata[i]["SV"]==="+"){
                        validDonors.push(donorIndex);
                    }
                }
            }
            for(let i=1;i<this.references.tads.length;++i){
                if(this.references.tads[i].chromosomeIndex<23){
                    let svDonors = this.references.tads[i].svDonorContributorIndicesOffset0;
                    let tmpListSv=[];
                    let anyHit=false;
                    for(let j=0;j<validDonors.length;++j){
                        if(svDonors.has(validDonors[j])){
                            anyHit=true;
                            tmpListSv[j] = Math.random() * 0.1 + 0.95;
                        }else{
                            tmpListSv[j] = Math.random() * 0.1;
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
        for(let i=0;i<preData.length&&i<=topN;++i){
            const currentTadIndex=preData[i].tadIndex;
            const direction=preData[i].direction;
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
        }
        if(phenotype==="cnStatus"){
            for(let i=0; i<this.usedDataPointsForClustering.length; ++i){
                this.usedDataPointsForClusteringDescriptions.push([
                this.references.tads[this.usedDataPointsForClustering[i][0]].printTadRange(this.references),
                    this.usedDataPointsForClustering[i][1]===-1?"loss":"gain"].join('\t'));
            }
        }else{
            this.usedDataPointsForClusteringDescriptions.push(["TADs sorted by genomic location","TADs sorted by top Variance"].join('\t'));
            for(let i=0; i<this.usedDataPointsForClustering.length; ++i){
                this.usedDataPointsForClusteringDescriptions.push(this.references.tads[this.usedDataPointsForClustering[i][0]].printTadRange(this.references))
            }
        }
        let phenotypeMatrixT=math.transpose(phenotypeMatrix);
        this.continueWithManifoldData(analysisType,phenotype,topN,phenotypeMatrixT,validDonors);
    }
    runManifoldAnalysis(phenotype,analysisType){
        this.usedDataPointsForClustering.length=0;
        this.usedDataPointsForClusteringDescriptions.length=0;
        const topN=50*parseInt($("#ManifoldTopN").slider().val());
        // console.log("expQueryStart:",currentTime())
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getTopNDataFromPhenotypeDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: phenotype,
                topN: topN
            }),
            error: function(err){
                console.error(err);
                thisRef.commonSettings.releaseLock();
            },
            success: function(data){
                // console.log("expQueryEnd:",currentTime())
                const lenMetadata=thisRef.cohortMetadata.metadata.length;
                const currentValidDonors=thisRef.selectionManager.registeredSubcohorts.get(parseInt($('#flexibleSubcohortSelectorManifold').val()));
                let validDonors=[];
                let validDonorsStr=[];
                const colToSearch=phenotype==="geneExpressions"?"RNA":"MethylationArray";
                const dbCol=phenotype==="geneExpressions"?"gene":"probe";
                for(let i=0;i<lenMetadata;++i){
                    const donorIndex=thisRef.cohortMetadata.metadata[i].index;
                    if(currentValidDonors.has(donorIndex)){
                        if(thisRef.cohortMetadata.metadata[i][colToSearch]==="+"){
                            validDonors.push(donorIndex);
                            validDonorsStr.push(donorIndex.toString());
                        }
                    }
                }
                let usedDataPointsForClusteringIndex=[];
                const lenData=data.length;
                let selectedDonorsValid=[];
                let selectedDonorsValidStr=[];
                for(let j=0;j<validDonors.length;++j){
                    if(data[0].hasOwnProperty(validDonorsStr[j])){
                        selectedDonorsValid.push(validDonors[j]);
                        selectedDonorsValidStr.push(validDonorsStr[j])
                    }
                }
                const selectedDonorsValidLength=selectedDonorsValid.length;
                let phenotypeMatrixT=new Array(selectedDonorsValidLength).fill([]);
                for(let jPre=0;jPre<selectedDonorsValidLength;++jPre){
                    phenotypeMatrixT[jPre]=new Array(lenData).fill(0);
                    const j=selectedDonorsValidStr[jPre];
                    for(let i=0;i<lenData;++i){
                        phenotypeMatrixT[jPre][i]=+data[i][j];
                    }
                }
                for(let i=0;i<lenData;++i){
                    let entry=data[i][dbCol];
                    if(!isNaN(entry)){
                        thisRef.usedDataPointsForClustering[i]=+entry;
                    }else{
                        thisRef.usedDataPointsForClustering[i]=entry;
                    }
                    usedDataPointsForClusteringIndex.push(i);
                }
                // console.log("expQueryProcessed:",currentTime())
                // for(let i=0;i<lenData;++i){
                //     let newRow=new Array(selectedDonorsValidLength).fill(0);
                //     for(let j=0;j<selectedDonorsValidLength;++j){
                //         newRow[j]=+data[i][selectedDonorsValid[j]];
                //     }
                //     phenotypeMatrix.push(newRow);
                //     let entry=data[i][dbCol];
                //     if(!isNaN(entry)){
                //         thisRef.usedDataPointsForClustering[i]=+entry;
                //     }else{
                //         thisRef.usedDataPointsForClustering[i]=entry;
                //     }
                //     usedDataPointsForClusteringIndex.push(i);
                // }
                // console.log("expQueryProcessed:",currentTime())
                if(dbCol==="gene"){
                    for(let i=0;i<thisRef.usedDataPointsForClustering.length;++i){
                        thisRef.usedDataPointsForClusteringDescriptions.push(thisRef.references.genes.get(thisRef.usedDataPointsForClustering[i]).geneName);
                    }
                }else if(dbCol==="probe"){
                    for(let i=0;i<thisRef.usedDataPointsForClustering.length;++i){
                        thisRef.usedDataPointsForClusteringDescriptions.push(thisRef.usedDataPointsForClustering[i]);
                    }
                }
                thisRef.continueWithManifoldData(analysisType,phenotype,topN,phenotypeMatrixT,selectedDonorsValid);
            }
        });
    }
    umapCalculation(phenotypeMatrix,
                    n_neighbors,
                    dim,
                    umapDistanceFunction,
                    n_epochs,
                    UMAP_learningRate,
                    initializationMethod,
                    minDist,
                    spread,
                    set_op_mix_ratio,
                    local_connectivity,
                    repulsion_strength,
                    negative_sample_rate,
                    analysisType,
                    phenotype,
                    topN,
                    validDonors){
        let umap=new UMAP(n_neighbors,
            dim,
            umapDistanceFunction,
            n_epochs,
            UMAP_learningRate,
            initializationMethod,
            minDist,
            spread,
            set_op_mix_ratio,
            local_connectivity,
            repulsion_strength,
            negative_sample_rate);
        const umapResults=umap.fit_transform(phenotypeMatrix);
        this.processManifoldresults(analysisType,phenotype,topN,validDonors,umapResults,[],n_neighbors);
        $('#flexiblePlotManifoldProgressBarGroup').css("display","none");
        $('#flexiblePlotManifoldProgressBar').css('width',"0%");
        $('#UMAPCollapse').collapse('hide');
    }
    tsneCalculation(initDataRaw,
                    perplexity,
                    learningRate,
                    maxIter,
                    earlyExaggeration,
                    iterationsEarlyExaggeration,
                    lateExaggeration,
                    iterationsLateExaggeration,
                    alpha,
                    analysisType,
                    phenotype,
                    topN,
                    validDonors,
    ){
        let q=d3Xqueue(1);
        let tsne = new tsnejs.tSNE({
            epsilon:learningRate,
            perplexity:perplexity,
            alpha:alpha,
            dim:2,
            earlyExaggeration:earlyExaggeration,
            iterationsEarlyExaggeration:iterationsEarlyExaggeration,
            lateExaggeration:lateExaggeration,
            iterationsLateExaggeration:iterationsLateExaggeration,
            maxIter:maxIter,
        });
        if($('#pcaPreTsne').is(':checked')){
            const pca = new PCA(initDataRaw);
            const preTsnePcaNdim=Math.min(parseInt($('#nDimPCAPreTsne').val()),initDataRaw.length);
            tsne.initDataRaw(pca.predict(initDataRaw,{nComponents:preTsnePcaNdim}));
        }else{
            tsne.initDataRaw(initDataRaw);
        }
        let progressBarHandle=$('#flexiblePlotManifoldProgressBar');
        $('#flexiblePlotManifoldProgressBarGroup').css("display","inline");
        let validToStep = true;
        q.defer((callback)=>{
            for(let i = 0; i < maxIter; ++i) {
                if(validToStep){
                    const cost = tsne.step();
                    if(cost===Number.MAX_VALUE){
                        const fakeIter=maxIter-iterationsLateExaggeration;
                        tsne.iter=fakeIter;
                        for(let j = fakeIter; j < maxIter; ++j) {
                            tsne.step();
                        }
                        validToStep=false;
                    }
                }else{
                    break;
                }
                setTimeout(()=>{progressBarHandle.css('width',`${i*100/maxIter}%`);},1);
            }
            callback();
        });
        q.awaitAll(()=>{
            this.processManifoldresults(analysisType,phenotype,topN,validDonors,tsne.getSolution(),[],perplexity);
            $('#flexiblePlotManifoldProgressBarGroup').css("display","none");
            $('#flexiblePlotManifoldProgressBar').css('width',"0%");
            $('#tSNECollapse').collapse('hide');
            $('#tSNESubmit').css('display','inline');
        });
    }
    continueWithManifoldData(analysisType,phenotype,topN,phenotypeMatrixT,validDonors){
        if(analysisType==="tSNE"){
            const perplexity=parseInt($("#tSNEPerplexity").slider().val());
            const tSNELearningRate=+$("#tSNELearningRate").slider().val();
            const tSNEIterations=parseInt($("#tSNEIterations").slider().val());
            const tSNEEarlyExaggeration=parseInt($("#tSNEEarlyExaggeration").slider().val());
            const tSNEIterationsEarlyExaggeration=parseInt($("#tSNEIterationsEarlyExaggeration").slider().val());
            const tSNELateExaggeration=+$("#tSNELateExaggeration").slider().val();
            const tSNEIterationsLateExaggeration=parseInt($("#tSNEIterationsLateExaggeration").slider().val());
            const tSNEAlpha=+$('#tSNEAlpha').slider().val();
            setTimeout(()=>{
                this.tsneCalculation(
                    phenotypeMatrixT,
                    perplexity,
                    tSNELearningRate,
                    tSNEIterations,
                    tSNEEarlyExaggeration,
                    tSNEIterationsEarlyExaggeration,
                    tSNELateExaggeration,
                    tSNEIterationsLateExaggeration,
                    tSNEAlpha,
                    analysisType,
                    phenotype,
                    topN,
                    validDonors);
            },0);
        }
        else if(analysisType==="PCA"){
            const pca = new PCA(phenotypeMatrixT);
            const explainedVariances=pca.getExplainedVariance();
            const explainedVariancesPercentages=[];
            for(let i=0;i<10;++i){
                explainedVariancesPercentages.push((100*explainedVariances[i]).toFixed(2));
            }
            this.processManifoldresults(analysisType,phenotype,topN,validDonors,pca.predict(phenotypeMatrixT,{nComponents:10}), explainedVariancesPercentages,0);
            $('#PCACollapse').collapse('hide');
            $("#PCASubmit").css("display","inline");
        }else if(analysisType==="UMAP"){
            const n_neighbors=parseInt($("#UMAP_n_neighbors").slider().val());
            const n_epochs=parseInt($("#UMAP_n_epochs").slider().val());
            const UMAP_learningRate=+$("#UMAP_learningRate").slider().val();
            const minDist=+$("#UMAP_minDist").slider().val();
            const spread=+$("#UMAP_spread").slider().val();
            const set_op_mix_ratio=+$("#UMAP_set_op_mix_ratio").slider().val();
            const local_connectivity=+$("#UMAP_local_connectivity").slider().val();
            const repulsion_strength=+$("#UMAP_repulsion_strength").slider().val();
            const negative_sample_rate=+$("#UMAP_negative_sample_rate").slider().val();
            const initializationMethod=$('#UMAPInitSelector').val();
            const umapDistanceFunction=$('#UMAPDistanceSelector').val();
            $('#UMAPDistanceSelector').val(-1);
            let inputData=phenotypeMatrixT;
            if($('#pcaPreUmap').is(':checked')){
                // console.log("preUmapPca begin",currentTime())
                const pca = new PCA(phenotypeMatrixT);
                const preUmapPcaNdim=Math.min(parseInt($('#nDimPCAPreUmap').val()),phenotypeMatrixT.length);
                inputData=pca.predict(phenotypeMatrixT,{nComponents:preUmapPcaNdim});
            }
            setTimeout(()=>{
                this.umapCalculation(
                    inputData,
                    n_neighbors,
                    2,
                    umapDistanceFunction,
                    n_epochs,
                    UMAP_learningRate,
                    initializationMethod,
                    minDist,
                    spread,
                    set_op_mix_ratio,
                    local_connectivity,
                    repulsion_strength,
                    negative_sample_rate,
                    analysisType,
                    phenotype,
                    topN,
                    validDonors)},0);
        }
    }
    processManifoldresults(analysisType,phenotype,topN,validDonors,results,explainedVariances,perplexity){
        let fieldNameDim1="";
        let fieldNameDim2="";
        let topnExpression=topN>0?` top${topN} `:' ';
        const subcohortName=this.selectionManager.registeredSubcohortNames.get(parseInt($('#flexibleSubcohortSelectorManifold').val()));
        if(analysisType==="PCA"){
            fieldNameDim1=`${phenotype} ${analysisType}${topnExpression}${subcohortName} (${explainedVariances[0]}% variance) dim1`;
            fieldNameDim2=`${phenotype} ${analysisType}${topnExpression}${subcohortName} (${explainedVariances[1]}% variance) dim2`;
            for(let n=3;n<11;++n){
                const fieldNameDim_n=`${phenotype} ${analysisType}${topnExpression}${subcohortName} (${explainedVariances[n-1]}% variance) dim${n}`;
                this.cohortMetadata.metadataDataPossibleValues.set(fieldNameDim_n,new Set());
                this.cohortMetadata.metadataDataTypes.set(fieldNameDim_n,"numeric");
                for(let q=0;q<this.cohortMetadata.metadata.length;++q){
                    this.cohortMetadata.metadata[q][fieldNameDim_n]="";
                }
                for(let i = 0; i < validDonors.length; ++i) {
                    this.cohortMetadata.metadata[validDonors[i]][fieldNameDim_n]=results[i][n];
                    this.cohortMetadata.metadataDataPossibleValues.get(fieldNameDim_n).add(results[i][n]);
                }
                this.cohortMetadata.addPossibleMetadataColumn(fieldNameDim_n);
            }
        }else if(analysisType==="tSNE"){
            fieldNameDim1=`${phenotype} ${analysisType}${topnExpression}${subcohortName} perplexity ${perplexity} dim1`;
            fieldNameDim2=`${phenotype} ${analysisType}${topnExpression}${subcohortName} perplexity ${perplexity} dim2`;
            let run=2;
            while(this.cohortMetadata.possibleMetadataColumns.has(fieldNameDim1)){
                fieldNameDim1=`${phenotype} ${analysisType}${topnExpression}${subcohortName} perplexity ${perplexity} run${run} dim1`;
                fieldNameDim2=`${phenotype} ${analysisType}${topnExpression}${subcohortName} perplexity ${perplexity} run${run} dim2`;
                run+=1;
            }
        }
        else if(analysisType==="UMAP"){
            fieldNameDim1=`${phenotype} ${analysisType}${topnExpression}${subcohortName} n_neighbors ${perplexity} dim1`;
            fieldNameDim2=`${phenotype} ${analysisType}${topnExpression}${subcohortName} n_neighbors ${perplexity} dim2`;
            let run=2;
            while(this.cohortMetadata.possibleMetadataColumns.has(fieldNameDim1)){
                fieldNameDim1=`${phenotype} ${analysisType}${topnExpression}${subcohortName} n_neighbors ${perplexity} run${run} dim1`;
                fieldNameDim2=`${phenotype} ${analysisType}${topnExpression}${subcohortName} n_neighbors ${perplexity} run${run} dim2`;
                run+=1;
            }
        }
        this.cohortMetadata.metadataDataPossibleValues.set(fieldNameDim1,new Set());
        this.cohortMetadata.metadataDataPossibleValues.set(fieldNameDim2,new Set());
        this.cohortMetadata.metadataDataTypes.set(fieldNameDim1,"numeric");
        this.cohortMetadata.metadataDataTypes.set(fieldNameDim2,"numeric");
        for(let q=0;q<this.cohortMetadata.metadata.length;++q){
            this.cohortMetadata.metadata[q][fieldNameDim1]="";
            this.cohortMetadata.metadata[q][fieldNameDim2]="";
        }
        for(let i = 0; i < validDonors.length; ++i) {
            this.cohortMetadata.metadata[validDonors[i]][fieldNameDim1]=results[i][0];
            this.cohortMetadata.metadataDataPossibleValues.get(fieldNameDim1).add(results[i][0]);
            this.cohortMetadata.metadata[validDonors[i]][fieldNameDim2]=results[i][1];
            this.cohortMetadata.metadataDataPossibleValues.get(fieldNameDim2).add(results[i][1]);
        }
        this.cohortMetadata.addPossibleMetadataColumn(fieldNameDim1);
        this.cohortMetadata.addPossibleMetadataColumn(fieldNameDim2);
        this.commonSettings.lock();
        this.xAxisSelectorHandle.val(this.cohortMetadata.possibleMetadataColumns.get(fieldNameDim1));
        this.yAxisSelectorHandle.val(this.cohortMetadata.possibleMetadataColumns.get(fieldNameDim2));
        $('#flexiblePlotGridSelectionHelperRect').remove();
        this.submitFlexiblePlotAnalysis();
        $('#flexiblePlotManifoldChoicesCollapseControl').css('display','inline');
        $('#flexiblePlotManifoldChoices').html(this.usedDataPointsForClusteringDescriptions.join('<br>'));
        this.commonSettings.releaseLock();
    }
    getTitleChunks(){
        if(this.subplotModules.size===1){
            return this.subplotModules.values().next().value.getTitleChunks();
        }else{
            return [this.cohortMetadata.cohortName,"MultiPlot"];
        }
    }
    saveFlexibleSvg(){
        const targetSvgId="flexiblePlotMain";
        let titleChunks=this.getTitleChunks();
        titleChunks.push("svg");
        const finalFileName=titleChunks.join(".");
        saveSvg(targetSvgId,finalFileName);
    }
    textExport(){
        if(this.subplotModules.size>1){
            let outputChunks=[["Donor", "panel", "x","xVal","y","yVal","colour","colourVal","symbol","symbolVal","radius","radiusVal"]];
            this.subplotModules.forEach((subplotModule,panelIndex,map)=>{
                subplotModule.provideRowsForTextExport(true).forEach((row)=>{
                    outputChunks.push(row);
                })
            });
            return outputChunks;
        }else{
            const subplot=this.subplotModules.values().next().value;
            let outputChunks=[subplot.getHeaderChunksForTextExport()];
            subplot.provideRowsForTextExport(false).forEach((row)=>{
                outputChunks.push(row);
            });
            return outputChunks;
        }
    }
    checkLegendValidity(){
        this.subplotInfo.forEach((subplotInfo,panelIndex,map)=>{
            if(subplotInfo.forcedIndependence){
                return false;
            }
        });
        return true;
    }
    addLegend(){
        if(this.svgLegendGroup!==null){
            $('#flexiblePlotLegendGroup').remove();
            this.svgLegendGroup=null;
        }
        if(!this.checkLegendValidity()){
            return;
        }
        const colourLegendNeeded=this.forcedColourColumn!==null;
        const symbolLegendNeeded=this.forcedSymbolColumn!==null;
        const radiusLegendNeeded=this.forcedRadiusColumn!==null;
        const totalLegendsNeeded=colourLegendNeeded+symbolLegendNeeded+radiusLegendNeeded;
        if(totalLegendsNeeded===0){
            return;
        }
        this.svgLegendGroup=d3Xselect('#flexiblePlotMain').append("g").attr("id","flexiblePlotLegendGroup");
        let svgHandle=$('#flexiblePlotMain');
        const targetWidth=svgHandle.width()*0.99;
        const legendLabelFont = this.fontManager.fontTree.get("flexiblePlotFontTargetSelector").get("legendLabels").generateFontCssText();
        let xAxisLabelsHighest=0;
        this.subplotInfo.forEach((subplotInfo,panelIndex,map)=>{
            if(subplotInfo.flexibleGridEndY===this.maxYDepth){
                const currentHeight=document.getElementById(`flexibleXaxisLabels_p${panelIndex}`).getBBox().height;
                if(currentHeight>xAxisLabelsHighest){
                    xAxisLabelsHighest=currentHeight;
                }
            }
        });
        const plotDepth=this.gridCellYendPositions[this.maxYDepth];
        const singleBlockHeight=this.currentWidth*0.05;
        let legendStartHeight=plotDepth+xAxisLabelsHighest*1.2;
        let blocksNeeded=0;
        if(colourLegendNeeded){
            if(this.forcedColourScaleType!=="numeric"){
                blocksNeeded+=Math.ceil(this.forcedColourValsReverseMapper.size/2);
            }else{
                blocksNeeded+=1;
            }
        }
        if(symbolLegendNeeded){
            blocksNeeded+=Math.ceil(this.forcedSymbolValsReverseMapper.size/2);
        }
        if(radiusLegendNeeded){
            blocksNeeded+=1;
        }
        svgHandle.height(Math.max(targetWidth,plotDepth*1.2+singleBlockHeight*blocksNeeded));
        const legendSymbolSize=Math.pow(singleBlockHeight/2,2)*0.5;
        if(colourLegendNeeded){
            const blockHeight = this.forcedColourScaleType!=="numeric"?Math.ceil(this.forcedColourValsReverseMapper.size/2)*singleBlockHeight:singleBlockHeight;
            this.svgLegendGroup.append("rect")
                .attr("x", 0)
                .attr("y", legendStartHeight)
                .attr("width", targetWidth)
                .attr("height", blockHeight)
                .style("fill","none")
                .style("stroke","black");
            if(this.forcedColourScaleType==="numeric") {
                this.forcedColourValsReverseMapper.clear();
                const numSteps=5;
                const halfBlockSize=1/(2*numSteps);
                const colourSteps=linspace(this.minColourForced,this.maxColourForced,numSteps);
                for(let i=0;i<colourSteps.length;++i){
                    const colour = colourSteps[i];
                    this.forcedColourValsReverseMapper.set(colour,colour);
                }
                const symbolStartHeight= legendStartHeight+(0.165)*singleBlockHeight;
                const symbolMidHeight=symbolStartHeight+singleBlockHeight*0.25;
                const yVal=symbolStartHeight+singleBlockHeight*0.5;
                let index=0;
                this.forcedColourValsReverseMapper.forEach((val,key,map)=>{
                    const xOffset=1/numSteps*index+halfBlockSize;
                    const xVal=(xOffset)*targetWidth;
                    const xTextStart=(xOffset-halfBlockSize)*targetWidth;
                    const xTextEnd=(xOffset+halfBlockSize)*targetWidth;
                    let helperPath=d3Xpath();
                    helperPath.moveTo(xTextStart, yVal);
                    helperPath.lineTo(xTextEnd, yVal);
                    this.svgLegendGroup.append("path")
                        .style('stroke',this.forcedColourScale(key))
                        .style('fill',this.forcedColourScale(key))
                        .attr('d',
                            d3Xsymbol()
                                .type(d3Xsymbols[0])
                                .size(legendSymbolSize)
                        )
                        .attr("transform",(d)=>{return `translate(${xVal},${symbolMidHeight})`;});
                    this.svgLegendGroup.append("path")
                        .attr("id", `flexiblePlotColourLegendHelper_${index}`)
                        .attr("d", helperPath)
                        .style("display","none");
                    this.svgLegendGroup.append("text")
                        .style("dominant-baseline", "hanging")
                        .style("alignment-baseline", "hanging")
                        .style("text-anchor", "middle")
                        .append("textPath")
                        .attr("class",`markerText`)
                        .attr("id", `flexiblePlotColourLegend_${index}`)
                        .attr("xlink:href", `#flexiblePlotColourLegendHelper_${index}`)
                        .style("dominant-baseline", "hanging")
                        .style("alignment-baseline", "hanging")
                        .style("text-anchor", "middle")
                        .attr("startOffset", "50%")
                        .style("font", legendLabelFont)
                        .html(val);
                    index+=1;
                });
            }
            else{
                let index=0;
                this.forcedColourValsReverseMapper.forEach((val,key,map)=>{
                    const xOffset=index%2===0?0.25:0.75;
                    const yLayer=Math.floor(index/2);
                    const xVal=(xOffset)*targetWidth;
                    const xTextStart=(xOffset-0.25)*targetWidth;
                    const xTextEnd=(xOffset+0.25)*targetWidth;
                    const symbolStartHeight= legendStartHeight+(yLayer+0.165)*singleBlockHeight;
                    const symbolMidHeight=symbolStartHeight+singleBlockHeight*0.25;
                    const yVal=symbolStartHeight+singleBlockHeight*0.5;
                    let helperPath=d3Xpath();
                    helperPath.moveTo(xTextStart, yVal);
                    helperPath.lineTo(xTextEnd, yVal);
                    this.svgLegendGroup.append("path")
                        .style('stroke',this.forcedColourScale(key))
                        .style('fill',this.forcedColourScale(key))
                        .attr('d',
                            d3Xsymbol()
                                .type(d3Xsymbols[0])
                                .size(legendSymbolSize)
                        )
                        .attr("transform",(d)=>{return `translate(${xVal},${symbolMidHeight})`;});
                    this.svgLegendGroup.append("path")
                        .attr("id", `flexiblePlotColourLegendHelper_${index}`)
                        .attr("d", helperPath)
                        .style("display","none");
                    this.svgLegendGroup.append("text")
                        .style("dominant-baseline", "hanging")
                        .style("alignment-baseline", "hanging")
                        .style("text-anchor", "middle")
                        .append("textPath")
                        .attr("class",`markerText`)
                        .attr("id", `flexiblePlotColourLegend_${index}`)
                        .attr("xlink:href", `#flexiblePlotColourLegendHelper_${index}`)
                        .style("dominant-baseline", "hanging")
                        .style("alignment-baseline", "hanging")
                        .style("text-anchor", "middle")
                        .attr("startOffset", "50%")
                        .style("font", legendLabelFont)
                        .html(val);
                    index+=1;
                });
            }
            let helperPath=d3Xpath();
            helperPath.moveTo(0, legendStartHeight);
            helperPath.lineTo(targetWidth, legendStartHeight);
            this.svgLegendGroup.append("path")
                .attr("id", "flexiblePlotColourLegendTitleHelper")
                .attr("d", helperPath)
                .style("display","none");
            this.svgLegendGroup.append("text")
                .style("dominant-baseline", "hanging")
                .style("alignment-baseline", "hanging")
                .style("text-anchor", "start")
                .append("textPath")
                .attr("class",`markerText`)
                .attr("id", "flexiblePlotColourLegendTitle")
                .attr("xlink:href", "#flexiblePlotColourLegendTitleHelper")
                .style("dominant-baseline", "hanging")
                .style("alignment-baseline", "hanging")
                .style("text-anchor", "start")
                .attr("startOffset", "0%")
                .style("font", legendLabelFont)
                .html(this.forcedColourColumn);
            legendStartHeight+=blockHeight;
        }
        if(symbolLegendNeeded){
            const blockHeight = Math.ceil(this.forcedSymbolValsReverseMapper.size/2)*singleBlockHeight;
            this.svgLegendGroup.append("rect")
                .attr("x", 0)
                .attr("y", legendStartHeight)
                .attr("width", targetWidth)
                .attr("height", blockHeight)
                .style("fill","none")
                .style("stroke","black");
            let index=0;
            this.forcedSymbolValsReverseMapper.forEach((val,key,map)=>{
                const xOffset=index%2===0?0.25:0.75;
                const yLayer=Math.floor(index/2);
                const xVal=(xOffset)*targetWidth;
                const xTextStart=(xOffset-0.25)*targetWidth;
                const xTextEnd=(xOffset+0.25)*targetWidth;
                const symbolStartHeight= legendStartHeight+(yLayer+0.165)*singleBlockHeight;
                const symbolMidHeight=symbolStartHeight+singleBlockHeight*0.25;
                const yVal=symbolStartHeight+singleBlockHeight*0.5;
                let helperPath=d3Xpath();
                helperPath.moveTo(xTextStart, yVal);
                helperPath.lineTo(xTextEnd, yVal);
                // helperPath.closePath();
                this.svgLegendGroup.append("path")
                    .style('stroke',"slategray")
                    .style('fill',"slategray")
                    .attr('d',
                        d3Xsymbol()
                            .type(d3Xsymbols[key])
                            .size(legendSymbolSize)
                    )
                    .attr("transform",(d)=>{return `translate(${xVal},${symbolMidHeight})`;});
                this.svgLegendGroup.append("path")
                    .attr("id", `flexiblePlotSymbolLegendHelper_${index}`)
                    .attr("d", helperPath)
                    .style("display","none");
                this.svgLegendGroup.append("text")
                    .style("dominant-baseline", "hanging")
                    .style("alignment-baseline", "hanging")
                    .style("text-anchor", "middle")
                    .append("textPath")
                    .attr("class",`markerText`)
                    .attr("id", `flexiblePlotSymbolLegend_${index}`)
                    .attr("xlink:href", `#flexiblePlotSymbolLegendHelper_${index}`)
                    .style("dominant-baseline", "hanging")
                    .style("alignment-baseline", "hanging")
                    .style("text-anchor", "middle")
                    .attr("startOffset", "50%")
                    .style("font", legendLabelFont)
                    .html(val);
                index+=1;
            });
            let helperPath=d3Xpath();
            helperPath.moveTo(0, legendStartHeight);
            helperPath.lineTo(targetWidth, legendStartHeight);
            this.svgLegendGroup.append("path")
                .attr("id", "flexiblePlotSymbolLegendTitleHelper")
                .attr("d", helperPath)
                .style("display","none");
            this.svgLegendGroup.append("text")
                .style("dominant-baseline", "hanging")
                .style("alignment-baseline", "hanging")
                .style("text-anchor", "start")
                .append("textPath")
                .attr("class",`markerText`)
                .attr("id", "flexiblePlotSymbolLegendTitle")
                .attr("xlink:href", "#flexiblePlotSymbolLegendTitleHelper")
                .style("dominant-baseline", "hanging")
                .style("alignment-baseline", "hanging")
                .style("text-anchor", "start")
                .attr("startOffset", "0%")
                .style("font", legendLabelFont)
                .html(this.forcedSymbolColumn);
            legendStartHeight+=blockHeight;
        }
        if(radiusLegendNeeded){
            const baseSize=Math.pow(2,parseInt($('#flexiblePlotBaseSizeFactorController').val())-3);
            this.svgLegendGroup.append("rect")
                .attr("x", 0)
                .attr("y", legendStartHeight)
                .attr("width", targetWidth)
                .attr("height", singleBlockHeight)
                .style("fill","none")
                .style("stroke","black");
            let radiusReverseMapper=new Map();
            const numSteps=5;
            const halfBlockSize=1/(2*numSteps);
            const radiusSteps=linspace(this.minRadiusForced,this.maxRadiusForced,numSteps);
            for(let i=0;i<radiusSteps.length;++i){
                const radius = radiusSteps[i];
                radiusReverseMapper.set(radius,radius);
            }
            const symbolStartHeight= legendStartHeight+(0.165)*singleBlockHeight;
            const symbolMidHeight=symbolStartHeight+singleBlockHeight*0.25;
            const yVal=symbolStartHeight+singleBlockHeight*0.5;
            let index=0;
            radiusReverseMapper.forEach((val,key,map)=>{
                const xOffset=1/numSteps*index+halfBlockSize;
                const xVal=(xOffset)*targetWidth;
                const xTextStart=(xOffset-halfBlockSize)*targetWidth;
                const xTextEnd=(xOffset+halfBlockSize)*targetWidth;
                let helperPath=d3Xpath();
                helperPath.moveTo(xTextStart, yVal);
                helperPath.lineTo(xTextEnd, yVal);
                this.svgLegendGroup.append("path")
                    .style('stroke',"slategray")
                    .style('fill',"slategray")
                    .attr('d',
                        d3Xsymbol()
                            .type(d3Xsymbols[0])
                            .size(baseSize*Math.pow(5*this.forcedRadiusScale(key),2)*AREAFACTORS[0])
                    )
                    .attr("transform",(d)=>{return `translate(${xVal},${symbolMidHeight})`;});
                this.svgLegendGroup.append("path")
                    .attr("id", `flexiblePlotRadiusLegendHelper_${index}`)
                    .attr("d", helperPath)
                    .style("display","none");
                this.svgLegendGroup.append("text")
                    .style("dominant-baseline", "hanging")
                    .style("alignment-baseline", "hanging")
                    .style("text-anchor", "middle")
                    .append("textPath")
                    .attr("class",`markerText`)
                    .attr("id", `flexiblePlotRadiusLegend_${index}`)
                    .attr("xlink:href", `#flexiblePlotRadiusLegendHelper_${index}`)
                    .style("dominant-baseline", "hanging")
                    .style("alignment-baseline", "hanging")
                    .style("text-anchor", "middle")
                    .attr("startOffset", "50%")
                    .style("font", legendLabelFont)
                    .html(val);
                index+=1;
            });
            let helperPath=d3Xpath();
            helperPath.moveTo(0, legendStartHeight);
            helperPath.lineTo(targetWidth, legendStartHeight);
            this.svgLegendGroup.append("path")
                .attr("id", "flexiblePlotRadiusLegendTitleHelper")
                .attr("d", helperPath)
                .style("display","none");
            this.svgLegendGroup.append("text")
                .style("dominant-baseline", "hanging")
                .style("alignment-baseline", "hanging")
                .style("text-anchor", "start")
                .append("textPath")
                .attr("class",`markerText`)
                .attr("id", "flexiblePlotRadiusLegendTitle")
                .attr("xlink:href", "#flexiblePlotRadiusLegendTitleHelper")
                .style("dominant-baseline", "hanging")
                .style("alignment-baseline", "hanging")
                .style("text-anchor", "start")
                .attr("startOffset", "0%")
                .style("font", legendLabelFont)
                .html(this.forcedRadiusColumn);
        }
    }
    adjustPlotSupporters(){
        this.subplotModules.forEach((subplot,panelIndex,map)=>{
            subplot.addPlotSupporters();
        });
    }
}
