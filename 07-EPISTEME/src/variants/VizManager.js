import {VariantViz} from "./VariantViz";
import {queue as d3Xqueue } from 'd3-queue';
import {VariantFetcher} from "../dataFetchersAndStorage/VariantFetcher";
import {VariantEntrySv} from "./VariantEntrySv";
import {VariantEntrySnv} from "./VariantEntrySnv";
import {generalizedSliderEvents} from "../Utils";

export class VizManager {
    constructor(commonSettings,references,cohortMetadata,selectionManager,fontManager,selectedSubcohortIndex,cohortData){
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.fontManager=fontManager;
        this.selectedSubcohortIndex=selectedSubcohortIndex;
        this.cohortData=cohortData;
        this.svViz=new VariantViz(false);
        this.vdjSvViz=new VariantViz(false);
        this.midSizedSvViz=new VariantViz(false);
        this.svVizFocused=new VariantViz(true);
        this.vdjSvVizFocused=new VariantViz(true);
        this.midSizedSvVizFocused=new VariantViz(true);
        this.smallVarVizFocused=new VariantViz(true);
        this.svViz.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,this.cohortData.Svs,"sv");
        this.vdjSvViz.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,this.cohortData.VdjSvs,"vdjSv");
        this.midSizedSvViz.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,this.cohortData.midSizedSvs,"midSizedSv");
        this.variantVizControls();
    }
    variantVizControls(){
        let thisRef=this;

        generalizedSliderEvents(
            "maxVdjGrade",
            (x)=>{return x},
            "Max IG/T-cell Receptor Rearrangement Grade:",
            (x)=>{
                this.commonSettings.maxVdjGrade=x;
                this.svViz.updateVisibility();
                this.svVizFocused.updateVisibility();
                if($('#vdjTraMode').is(':checked')){
                    this.vdjSvViz.replotVdjLabels();
                    this.vdjSvVizFocused.replotVdjLabels();
                }
                this.vdjSvViz.updateVisibility();
                this.vdjSvVizFocused.updateVisibility();
            });
        generalizedSliderEvents(
            "minRec",
            (x)=>{return x},
            `Min SV Event<br/> Recurrence:`,
            (x)=>{
                this.commonSettings.minRecurrence=x;
                this.updateVisibility();
            });
        generalizedSliderEvents(
            "transparencyScaling",
            (x)=>{return x},
            `<br/>Transparency<br/>Scaling:`,
            (x)=>{
                this.commonSettings.transparencyScaling=x;
                this.updateOpacity();
            });
        $('#vdjTraMode').off('change').on('change',()=>{
           this.svViz.switchVdjMode();
           this.vdjSvViz.switchVdjMode();
           this.midSizedSvViz.switchVdjMode();
           this.svVizFocused.switchVdjMode();
           this.vdjSvVizFocused.switchVdjMode();
           this.midSizedSvVizFocused.switchVdjMode();
           this.smallVarVizFocused.switchVdjMode();
        });
    }
    updateVisibility(){
        setTimeout(()=>{this.svViz.updateVisibility()},0);
        setTimeout(()=>{this.vdjSvViz.updateVisibility()},0);
        setTimeout(()=>{this.midSizedSvViz.updateVisibility()},0);

        setTimeout(()=>{this.svVizFocused.updateVisibility()},0);
        setTimeout(()=>{this.vdjSvVizFocused.updateVisibility()},0);
        setTimeout(()=>{this.midSizedSvVizFocused.updateVisibility()},0);
        setTimeout(()=>{this.smallVarVizFocused.updateVisibility()},0);
    }
    updateOpacity(){
        setTimeout(()=>{this.svViz.updateOpacity()},0);
        setTimeout(()=>{this.vdjSvViz.updateOpacity()},0);
        setTimeout(()=>{this.midSizedSvViz.updateOpacity()},0);
        setTimeout(()=>{this.svVizFocused.updateOpacity()},0);
        setTimeout(()=>{this.vdjSvVizFocused.updateOpacity()},0);
        setTimeout(()=>{this.midSizedSvVizFocused.updateOpacity()},0);
        setTimeout(()=>{this.smallVarVizFocused.updateOpacity()},0);
    }
    plot(){
        setTimeout(()=>{
            this.svViz.plot();
            this.svViz.enableControls();
        },0);
        setTimeout(()=>{
            this.vdjSvViz.plot();
            this.vdjSvViz.enableControls();
        },0);
        setTimeout(()=>{
            this.midSizedSvViz.plot();
            this.midSizedSvViz.enableControls();
        },0);
    }
    plotFocused(){
        setTimeout(()=>{
            this.svVizFocused.plot();
            this.svVizFocused.enableControls();
        },0);
        setTimeout(()=>{
            this.vdjSvVizFocused.plot();
            this.vdjSvVizFocused.enableControls();
        },0);
        setTimeout(()=>{
            this.midSizedSvVizFocused.plot();
            this.midSizedSvVizFocused.enableControls();
        },0);
    }
    plotFocusedSmallVariant(){
        setTimeout(()=>{
            this.smallVarVizFocused.plot();
            this.smallVarVizFocused.enableControls();
        },0);
    }
    updateAngles(){
        setTimeout(()=>{this.svViz.updatePaths()},0);
        setTimeout(()=>{this.vdjSvViz.updatePaths()},0);
        setTimeout(()=>{this.midSizedSvViz.updatePaths()},0);
        setTimeout(()=>{this.svVizFocused.updatePaths()},0);
        setTimeout(()=>{this.vdjSvVizFocused.updatePaths()},0);
        setTimeout(()=>{this.midSizedSvVizFocused.updatePaths()},0);
        setTimeout(()=>{this.smallVarVizFocused.updatePaths()},0);
        if(this.commonSettings.hyperzoomMode>1){
            this.updateOpacity();
        }
    }
    preparePlotForFocus(){
        this.resetFocusViz();
        this.svViz.hideAll();
        this.midSizedSvViz.hideAll();
        this.vdjSvViz.hideAll();
        $('#vdjTraMode').prop('checked', false).parent().removeClass('active');
        $('#resetFocus').css('display','inline').off('click').on('click',()=>{
            this.resetView();
        });
    }
    resetView(){
        $('#geneRecDescription').empty();
        $('#cytobandDescription').empty();
        $('#tadDescription').empty();
        this.resetFocusViz();
        setTimeout(()=>{this.svViz.updateVisibility()},0);
        setTimeout(()=>{this.vdjSvViz.updateVisibility()},0);
        setTimeout(()=>{this.midSizedSvViz.updateVisibility()},0);
    }
    resetFocusViz(){
        this.svViz.lockDisplay=false;
        this.vdjSvViz.lockDisplay=false;
        this.midSizedSvViz.lockDisplay=false;
        this.svVizFocused.destroy();
        this.vdjSvVizFocused.destroy();
        this.midSizedSvVizFocused.destroy();
        this.smallVarVizFocused.destroy();
        this.svVizFocused=new VariantViz(true);
        this.vdjSvVizFocused=new VariantViz(true);
        this.midSizedSvVizFocused=new VariantViz(true);
        this.smallVarVizFocused=new VariantViz(true);
        this.svViz.enableControls();
        this.midSizedSvViz.enableControls();
        this.vdjSvViz.enableControls();
        $('#resetFocus').css('display','none');
    }
    focusOnCytoband(cytobandIndex){
        this.preparePlotForFocus();
        let variantFetcher=new VariantFetcher(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,[0]);
        let q=d3Xqueue();
        q.defer((callback)=>{variantFetcher.getVariantDataForVariantPlotsFromCytobandIndex(cytobandIndex,this.selectedSubcohortIndex, callback)});
        q.awaitAll(()=>{
            this.svVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher.variantsForVariantPlots.get(0).get('svData'),"sv");
            this.vdjSvVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher.variantsForVariantPlots.get(0).get('vdjSvData'),"vdjSv");
            this.midSizedSvVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher.variantsForVariantPlots.get(0).get('midSizedSvData'),"midSizedSv");
            this.plotFocused();
            $('#fetchSmallVariantsFromCytoband').off('click').on('click',()=>{
                $('#fetchSmallVariantsFromCytoband').css('display','none');
                $('#smallVariantDescriptionPaneControl').css('display','inline');
                let variantFetcher2=new VariantFetcher(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,[0]);
                let q2=d3Xqueue();
                q2.defer((callback)=>{variantFetcher2.getSmallVariantDataForVariantPlotsFromCytobandIndex(cytobandIndex,this.selectedSubcohortIndex, callback)});
                q2.awaitAll(()=>{
                    this.smallVarVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher2.variantsForVariantPlots.get(0).get('smallVariantData'),"smallVariant");
                    this.plotFocusedSmallVariant();
                });
            });
        });
    }
    focusOnTad(tadIndex){
        this.preparePlotForFocus();
        let variantFetcher=new VariantFetcher(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,[0]);
        let q=d3Xqueue();
        q.defer((callback)=>{variantFetcher.getVariantDataForVariantPlotsFromTadIndices([tadIndex],1,0,this.selectedSubcohortIndex, callback)});
        q.awaitAll(()=>{
            this.svVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher.variantsForVariantPlots.get(0).get('svData'),"sv");
            this.vdjSvVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher.variantsForVariantPlots.get(0).get('vdjSvData'),"vdjSv");
            this.midSizedSvVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher.variantsForVariantPlots.get(0).get('midSizedSvData'),"midSizedSv");
            this.plotFocused();
            $('#fetchSmallVariantsFromTad').off('click').on('click',()=>{
                $('#fetchSmallVariantsFromTad').css('display','none');
                $('#smallVariantDescriptionPaneControl').css('display','inline');
                let variantFetcher2=new VariantFetcher(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,[0]);
                let q2=d3Xqueue();
                q2.defer((callback)=>{variantFetcher2.getSmallVariantDataForVariantPlotsFromTadIndices([tadIndex],1,0,this.selectedSubcohortIndex, callback)});
                q2.awaitAll(()=>{
                    this.smallVarVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher2.variantsForVariantPlots.get(0).get('smallVariantData'),"smallVariant");
                    this.plotFocusedSmallVariant();
                });
            });
        });
    }
    focusOnGene(geneId){
        this.preparePlotForFocus();
        let variantFetcher=new VariantFetcher(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,[0,geneId]);
        let q=d3Xqueue();
        q.defer((callback)=>{variantFetcher.getVariantDataForVariantPlotsFromGeneId(geneId,1,0,this.selectedSubcohortIndex, callback)});
        q.awaitAll(()=>{
            this.svVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher.variantsForVariantPlots.get(0).get('svData'),"sv");
            this.vdjSvVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher.variantsForVariantPlots.get(0).get('vdjSvData'),"vdjSv");
            this.midSizedSvVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher.variantsForVariantPlots.get(0).get('midSizedSvData'),"midSizedSv");
            this.plotFocused();
            $('#fetchSmallVariantsFromGene').off('click').on('click',()=>{
                $('#fetchSmallVariantsFromGene').css('display','none');
                $('#smallVariantDescriptionPaneControl').css('display','inline');
                let variantFetcher2=new VariantFetcher(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,[0,geneId]);
                let q2=d3Xqueue();
                q2.defer((callback)=>{variantFetcher2.getSmallVariantDataForVariantPlotsFromGeneId(geneId,1,0,this.selectedSubcohortIndex, callback)});
                q2.awaitAll(()=>{
                    this.smallVarVizFocused.init(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.selectedSubcohortIndex,variantFetcher2.variantsForVariantPlots.get(0).get('smallVariantData'),"smallVariant");
                    this.plotFocusedSmallVariant();
                });
            });
        });
    }
    tracerCleanup(){
        this.svViz.tracerCleanup();
        this.vdjSvViz.tracerCleanup();
        this.midSizedSvViz.tracerCleanup();
        this.svVizFocused.tracerCleanup();
        this.vdjSvVizFocused.tracerCleanup();
        this.midSizedSvVizFocused.tracerCleanup();
        this.smallVarVizFocused.tracerCleanup();
    }
    textExport(dataType){
        if(dataType==="sv"){
            let outputChunks=[VariantEntrySv.generalHeaderExport()];
            let toExport1=null;
            let toExport2=null;
            let toExport3=null;
            if(this.svVizFocused.constructed){
                toExport1 = this.svVizFocused.textExport();
            }else{
                toExport1 = this.svViz.textExport();
            }
            if(this.vdjSvVizFocused.constructed){
                toExport2 = this.vdjSvVizFocused.textExport();
            }else{
                toExport2= this.vdjSvViz.textExport();
            }
            if(this.midSizedSvVizFocused.constructed){
                toExport3 = this.midSizedSvVizFocused.textExport();
            }else{
                toExport3 = this.midSizedSvViz.textExport();
            }
            for(let i=0;i<toExport1.length;++i){
                outputChunks.push(toExport1[i]);
            }
            for(let i=0;i<toExport2.length;++i){
                outputChunks.push(toExport2[i]);
            }
            for(let i=0;i<toExport3.length;++i){
                outputChunks.push(toExport3[i]);
            }
            return outputChunks;
        }else if(dataType==="smallVar"){
            let outputChunks=[VariantEntrySnv.generalHeaderExport()];
            let toExport=null;
            if(this.smallVarVizFocused.constructed){
                toExport = this.smallVarVizFocused.textExport();
            }
            for(let i=0;i<toExport.length;++i){
                outputChunks.push(toExport[i]);
            }
            return outputChunks;
        }
    }
    adjustVdjMarkerFont(){
        const cytobandAndGeneLabelFont = this.fontManager.fontTree.get("variantViewFontTargetSelector").get("cytobandAndGeneLabels").generateFontCssText();
        if(this.vdjSvVizFocused.constructed){
            this.vdjSvVizFocused.labelGroup.selectAll("*").style("font",cytobandAndGeneLabelFont);
        }
        if(this.vdjSvViz.constructed){
            this.vdjSvViz.labelGroup.selectAll("*").style("font",cytobandAndGeneLabelFont);
        }
    }
}