import {HeatmapPlotter} from "./HeatmapPlotter";
import {generalizedSliderEvents, selectTextFromDivAndCopy, switchElements} from "../Utils";
import {path as d3Xpath} from "d3-path";

export class HeatmapManager {
    constructor(commonSettings,references,cohortMetadata,selectionManager,fontManager,textExportManager) {
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.fontManager=fontManager;
        this.textExportManager=textExportManager;
        this.heatmapPlotter=null;
        this.newAnalysisRequired=true;
    }
    enableControls(){
        let thisRef=this;
        let heatmapPhenotypeSelector=$('#heatmapPhenotypeSelector');
        heatmapPhenotypeSelector.empty();
        heatmapPhenotypeSelector.append(`<option value="-1">Select Phenotype</option>`);
        if(this.cohortMetadata.geneExpressionAvailable>2){
            heatmapPhenotypeSelector.append(`<option value="geneExpressions">Gene Expression</option>`);
        }
        if(this.cohortMetadata.methylomeArrayAvailable>2){
            heatmapPhenotypeSelector.append(`<option value="methylomeBetas">Methylome Betas</option>`);
        }
        if(this.cohortMetadata.cnvAvailable>2){
            heatmapPhenotypeSelector.append(`<option value="cnStatus">Copy Number Status</option>`);
        }
        if(this.cohortMetadata.svAvailable>2){
            heatmapPhenotypeSelector.append(`<option value="svStatus">SV Status</option>`);
        }
        let heatmapSubmitButton=$('#heatmapSubmit');
        generalizedSliderEvents(
            "heatmapTopN",
            (x)=>{return 100*x;},
            "Top N:",
            (x)=>{
                this.newAnalysisRequired=true;
                if(this.heatmapPlotter){
                    this.heatmapPlotter.heightCoefficient=Math.pow(2,x-3);
                }
            });
        generalizedSliderEvents(
            "heatmapHeightCoeff",
            (x)=>{return Math.pow(2,x-3).toFixed(2);},
            `Height = Width *`,
            (x)=>{
                if(this.heatmapPlotter){
                    this.heatmapPlotter.heightCoefficient=Math.pow(2,x-3);
                }
            });
        $("#heatmapDistanceSelector").off('change').on('change',function () {
            if(this.value!=="-1"){
                thisRef.newAnalysisRequired=true;
                if($("#heatmapLinkageSelector").val()!=="-1"&&heatmapPhenotypeSelector.val()!=="-1"){
                    heatmapSubmitButton.css('display','inline');
                }
            }else{
                heatmapSubmitButton.css('display','none');
            }
        });
        $("#heatmapLinkageSelector").off('change').on('change',function () {
            if(this.value!=="-1"){
                thisRef.newAnalysisRequired=true;
                if($("#heatmapDistanceSelector").val()!=="-1"&&heatmapPhenotypeSelector.val()!=="-1"){
                    heatmapSubmitButton.css('display','inline');
                }
            }else{
                heatmapSubmitButton.css('display','none');
            }
        });
        heatmapPhenotypeSelector.off('change').on('change',function () {
            if(this.value!=="-1"){
                thisRef.newAnalysisRequired=true;
                if($("#heatmapDistanceSelector").val()!=="-1"&&$("#heatmapLinkageSelector").val()!=="-1"){
                    heatmapSubmitButton.css('display','inline');
                }
            }else{
                heatmapSubmitButton.css('display','none');
            }
        });
        heatmapSubmitButton.off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            heatmapSubmitButton.css('display','none');
            if(this.newAnalysisRequired){
                this.launchHeatmapAnalysis();
                this.newAnalysisRequired=false;
            }else{
                this.heatmapPlotter.plotHeatmapSupporters();
                this.heatmapPlotter.plotHeatmap();
            }
        });
        let controlElements=[
            "heatmapControls",
            "subcohortSelectorGroup",
            "svgDownloader"];
        $('#heatmapContentPane')
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
                $('.nav-tabs a[href="#controlsPane"]').tab("show");
                switchElements(
                    [],
                    controlElements);
                $('#selectorControlsCollapse').collapse('hide');
                $('#subcohortSelectionFromFlexiblePlotDescription').empty();
                this.fontManager.setAvailableFontSettings("heatmap");
                this.textExportManager.setAvailableExportSettings("heatmap");
                this.commonSettings.releaseLock();
            });

        $("#heatmapLaunchConsensusPathDb").off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            selectTextFromDivAndCopy("heatmapMarkedEntriesList");
            window.open("http://cpdb.molgen.mpg.de/CPDB/fct_annot", '_blank');
        });
        $("#heatmapLaunchGsea").off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            selectTextFromDivAndCopy("heatmapMarkedEntriesList");
            window.open("http://software.broadinstitute.org/gsea/msigdb/annotate.jsp", '_blank');
        });
        $("#heatmapLaunchReactome").off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            selectTextFromDivAndCopy("heatmapMarkedEntriesList");
            window.open("https://reactome.org/PathwayBrowser/#TOOL=AT", '_blank');
        });
        $("#heatmapLaunchDavid").off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            selectTextFromDivAndCopy("heatmapMarkedEntriesList");
            window.open("https://david.ncifcrf.gov/gene2gene.jsp", '_blank');
        });

        $('#heatmapSubcohortSelectionName').off('change').on('change',function(){
            if(thisRef.selectionManager.registeredSubcohortNamesSet.has(this.value)){
                $('#createSubcohortFromMarkedDonorsHeatmap').css('display','none');
            }else{
                $('#createSubcohortFromMarkedDonorsHeatmap').css('display','inline');
            }
        });
        $('#createSubcohortFromMarkedDonorsHeatmap').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            let selectionNameHandle=$('#heatmapSubcohortSelectionName');
            let selectionName=selectionNameHandle.val();
            console.log(this.heatmapPlotter.manuallySelectedDonors)
            this.cohortMetadata.finalizeSelection(this.heatmapPlotter.manuallySelectedDonors,this.heatmapPlotter.missingDonors,selectionName,"heatmapSubcohortSelectionDescription");
            this.commonSettings.fastRelease();
        });
        $('#heatmapSubcohortMarkerSelector').off('change').on('change',function () {
            if(parseInt(this.value)===-1){
                $('#submitSubcohortForMarkingHeatmap').css("display","none");
            } else{
                $('#submitSubcohortForMarkingHeatmap').css("display","inline");
            }
        });
        $('#submitSubcohortForMarkingHeatmap').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            let subcohortIndex=parseInt($('#heatmapSubcohortMarkerSelector').val());
            this.heatmapPlotter.markSubcohort(subcohortIndex);
            this.commonSettings.fastRelease();
        });
        $('#clearMarkedDonorsFromHeatmap').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            this.heatmapPlotter.clearMarkedDonors();
            $("#subcohortSelectionFromFlexiblePlotDescription").empty();
            this.commonSettings.fastRelease();
        });
    }
    remarkDonors(){
        this.heatmapPlotter.remarkDonors();
        $('#heatmapSubcohortSelectionDescription').empty();
    }
    remarkPhenotypes(){
        this.heatmapPlotter.heatmapPhenotypeLabelsGroup.selectAll("*").remove();
        this.heatmapPlotter.markSelectedPhenotypes(this.heatmapPlotter.markedPhenotypeIndices);
    }
    textExport(){

    }
    getTitleChunks(){

    }
    launchHeatmapAnalysis(){
        $('#heatmapSubcohortSelectionDescription').empty();
        $('#heatmapSubcohortSelectionName').empty();
        $('#createSubcohortFromMarkedDonorsHeatmap').css('display','none');
        let topN=100*(+$("#heatmapTopN").slider().val());
        let phenotype=$("#heatmapPhenotypeSelector").val();
        let selectedSubcohort=parseInt($("#subcohortSelector").val());
        let heightCoefficient=Math.pow(2,+$("#heatmapHeightCoeff").val()-3);
        let hclustDistance=$("#heatmapDistanceSelector").val();
        let hclustLinkage=$("#heatmapLinkageSelector").val();
        delete this.heatmapPlotter;
        this.heatmapPlotter=new HeatmapPlotter(
            this.commonSettings,
            this.references,
            this.cohortMetadata,
            this.selectionManager,
            this.fontManager,
            this.textExportManager,
            selectedSubcohort,
            phenotype,
            topN,
            heightCoefficient,
            hclustDistance,
            hclustLinkage);
    }
}