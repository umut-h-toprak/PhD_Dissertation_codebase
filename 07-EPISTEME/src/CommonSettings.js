import {select as d3Xselect} from 'd3';
import {cleanup, polarToCartesian} from "./Utils";
import Veil from 'html-veil';
export class CommonSettings {
    constructor(wesMode) {
        cleanup();
        this.wesMode=wesMode;
        this.baseUrl = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname.split('/')[1];
        this.cohortName=null;
        this.markedCytobands=new Set();
        this.markedGenes=new Set();
        this.hyperzoomDisplayedGenes=new Set();
        this.hyperzoomMarkedGenes=new Set();
        this.hyperzoomMarkedCytobands=new Set();
        this.volcanoMarkedGenes=new Set();
        this.mainSvgContainerId="#mainContent";
        this.variantLandscapeSvgId="variantLandscapeSVG";
        this.mainSvg = d3Xselect(this.mainSvgContainerId)
            .classed("svg-container", true)
            .append("svg")
            .classed("svg-content-responsive", true)
            .attr("viewBox", (this.isAnyMarked()) ? "-500 -500 1000 1000" :"-500 -460 1000 1000")
            .attr("id",this.variantLandscapeSvgId)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("width", "95%")
            .attr("height", "95%");
        this.svRadius=0;
        this.wheelGap=5;
        this.chromosomeAxisRadius=440;
        this.currentGeneMutTypes=new Set();
        const [pre1X,pre1Y] = polarToCartesian(325-5,0);
        const [pre2X,pre2Y] = polarToCartesian(325,0.01);
        this.eventMarkerRadius = Math.sqrt(Math.pow(pre1X-pre2X,2)+Math.pow(pre1Y-pre2Y,2));
        this.transparencyScaling=3;
        this.minRecurrence=1;
        this.interactionLock=false;
        this.hyperzoomMode=0;
        this.maxVdjGrade=0;
        this.undefinedValues=new Set([undefined,NaN,"NA","N.A","N.A.","",Infinity]);
        this.veil=new Veil;
    }
    resetCohortSvg(){
        this.mainSvg = d3Xselect(this.mainSvgContainerId)
            .classed("svg-container", true)
            .append("svg")
            .classed("svg-content-responsive", true)
            .attr("viewBox", (this.isAnyMarked()) ? "-500 -500 1000 1000" :"-500 -460 1000 1000")
            .attr("id",this.variantLandscapeSvgId)
            .attr("preserveAspectRatio", "xMinYMin slice")
            .attr("width", "95%")
            .attr("height", "95%");
    }
    isAnyMarked(){
        return this.markedGenes.size>0 || this.hyperzoomMarkedGenes.size>0  || this.markedCytobands.size>0 || this.hyperzoomMarkedCytobands.size>0;
    }
    lock(){
        this.interactionLock=true;
        this.veil.inject();
        this.veil.activate();
        CommonSettings.lockCommon();
    }
    fastLock(){
        this.interactionLock=true;
        CommonSettings.lockCommon();
    }
    static lockCommon(){
        $('#expressionContentPaneControl').addClass('disabled');
        $('#mainContentControl').addClass('disabled');
        $('#cohortMetadataContentControl').addClass('disabled');
        $('#flexiblePlotsContentPaneControl').addClass('disabled');
        $('#heatmapContentPaneControl').addClass('disabled');
        $('#survivalContentPaneControl').addClass('disabled');
        $('#phenotypeExpressionContentPaneControl').addClass('disabled');
        $('#correlationGeneExpressionVolcanoContentPaneControl').addClass('disabled');
        $('#variantGeneExpressionVolcanoContentPaneControl').addClass('disabled');
        $('#subcohortGeneExpressionVolcanoContentPaneControl').addClass('disabled');
        $('#subcohortMutexVolcanoContentPaneControl').addClass('disabled');
        $('#variantRppaExpressionVolcanoContentPaneControl').addClass('disabled');
        $('#subcohortRppaExpressionVolcanoContentPaneControl').addClass('disabled');
    }
    static releaseCommon(){
        $('#expressionContentPaneControl').removeClass('disabled');
        $('#mainContentControl').removeClass('disabled');
        $('#cohortMetadataContentControl').removeClass('disabled');
        $('#flexiblePlotsContentPaneControl').removeClass('disabled');
        $('#heatmapContentPaneControl').removeClass('disabled');
        $('#survivalContentPaneControl').removeClass('disabled');
        $('#phenotypeExpressionContentPaneControl').removeClass('disabled');
        $('#correlationGeneExpressionVolcanoContentPaneControl').removeClass('disabled');
        $('#variantGeneExpressionVolcanoContentPaneControl').removeClass('disabled');
        $('#subcohortGeneExpressionVolcanoContentPaneControl').removeClass('disabled');
        $('#subcohortMutexVolcanoContentPaneControl').removeClass('disabled');
        $('#variantRppaExpressionVolcanoContentPaneControl').removeClass('disabled');
        $('#subcohortRppaExpressionVolcanoContentPaneControl').removeClass('disabled');
    }
    releaseLock(){
        this.interactionLock=false;
        try{
            this.veil.remove();
        }catch (e) {
            
        }
        CommonSettings.releaseCommon();
    }
    fastRelease(){
        this.interactionLock=false;
        CommonSettings.releaseCommon();
    }
}