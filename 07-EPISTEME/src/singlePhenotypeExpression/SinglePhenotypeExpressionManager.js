import {generalizedSliderEvents, switchElements} from "../Utils";
import {SinglePhenotypeExpression} from "./SinglePhenotypeExpression";

export class SinglePhenotypeExpressionManager {
    constructor(commonSettings,references,cohortMetadata,selectionManager,fontManager,textExportManager){
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.fontManager=fontManager;
        this.textExportManager=textExportManager;
        this.singleGeneExpression=null;
        this.singleRppaExpression=null;
        this.svMaxTadOffset=1;
        this.offIndelMaxTadOffset=-1;
        this.geneId=null;
        this.gene2Id=null;
        this.rppaId=null;
        this.rppa2Id=null;
        this.group1=0;
        this.group2=0;
        this.customMagFactor=1;
        this.singleDonorVariantContributions=null;
        this.enableControls();
    }
    reset(){
        $('#singleGeneExpressionSelection').empty().append('<option value"-1">Select Gene</option>');
        $('#geneExpressionContent').empty();
        $('#singleRppaExpressionSelector').empty().append('<option value"-1">Select RPPA Antibody</option>');
        $('#rppaExpressionContent').empty();
        $('#singleGeneExpressionSelectorGroup').css('display','none');
        $('#singleRppaExpressionSelectorGroup').css('display','none');
        this.geneId=null;
        this.gene2Id=null;
        this.rppaId=null;
        this.rppa2Id=null;
        this.singleGeneExpression=null;
        this.singleRppaExpression=null;
        this.singleDonorVariantContributions=null;
        this.singleDonorVariantContributions2=null;
        this.setGroup1(0);
        this.setGroup2(0);
    }
    setGroup1(newGroup1){
        this.group1=newGroup1;
        $('#groupSelectorSinglePhenotypeSelector1').val(newGroup1);
    }
    setGroup2(newGroup2){
        this.group2=newGroup2;
        $('#groupSelectorSinglePhenotypeSelector2').val(newGroup2);
    }
    setSvMaxTadOffset(newSvMaxTadOffset){
        this.svMaxTadOffset=newSvMaxTadOffset;
        $('#svTadOffsetSelectorSinglePhenotypeSelector').val(newSvMaxTadOffset);
    }
    setOffIndelMaxTadOffset(newOffIndelMaxTadOffset){
        this.offIndelMaxTadOffset=newOffIndelMaxTadOffset;
        $('#offIndelTadOffsetSelectorSinglePhenotypeSelector').val(newOffIndelMaxTadOffset);
    }
    setSingleDonorVariantContributions(newSingleDonorVariantContributions){
        this.singleDonorVariantContributions=newSingleDonorVariantContributions;
    }
    setSingleDonorVariantContributions2(newSingleDonorVariantContributions){
        this.singleDonorVariantContributions2=newSingleDonorVariantContributions;
    }
    enableControls(){
        let controlElements=[
            "svgDownloader",
            "svDescriptionPaneControl",
            "midSizedSvDescriptionPaneControl",
            "vdjSvDescriptionPaneControl",
            "smallVariantDescriptionPaneControl",
            "selectorControlsCollapseControl",
            "singlePhenotypeExpressionControls",
            "groupSelectorSinglePhenotypeGroup",
            "singlePhenotypeViewSpecificCytobandSelectorControls",
            "singlePhenotypeViewSpecificGeneSelectorControls",
            "singlePhenotypeViewSpecificAntibodySelectorControls",
        ];
        $('#phenotypeExpressionContentPane')
            .off('hide.bs.tab')
            .on('hide.bs.tab',()=>{
                switchElements(
                    controlElements,
                    [
                        "tsvExportPanel",
                    ]);
            })
            .off('hidden.bs.tab')
            .on('hidden.bs.tab',()=>{
                switchElements(
                    controlElements,
                    [
                        "tsvExportPanel",
                    ]);
            })
            .off('shown.bs.tab')
            .on('shown.bs.tab', ()=> {
                $('.nav-tabs a[href="#controlsPane"]').tab("show");
                switchElements(
                    [
                        "tsvExportPanel",
                    ],
                    controlElements
                );
                this.fontManager.setAvailableFontSettings("singlePhenotypeExpression");
                this.textExportManager.setAvailableExportSettings("singlePhenotypeExpression");
                // $('#helpInfo').html(tutorials.Tutorials.expressionScreenTutorial());
            });

        $('#plotSingleGeneAsSinglePhenotype').off("click").on("click",()=>{
            this.reset();
            this.geneId=this.references.geneInputAwesompleteCurrentGene;
            $('#geneSelector').val('FETCHING');
            if(this.cohortMetadata.rppaExpressionAvailable>0){
                let candidateRppaIds=this.references.genes.get(this.geneId).rppaIds;
                this.addCorrespondingAntibodies(candidateRppaIds);
            }
            this.plotSingleGeneExpression();
        });
        $('#addSecondGeneAsSinglePhenotype').off("click").on("click",()=>{
            if(this.geneId===null){
                return;
            }
            this.gene2Id=this.references.geneInputAwesompleteCurrentGene;
            $('#geneSelector').val('FETCHING');
            this.plotSingleGeneExpression();
        });
        $('#plotSingleAntibodyAsSinglePhenotype').off("click").on("click",()=>{
            this.reset();
            this.rppaId=this.references.rppaInputAwesompleteCurrentRppa;
            $('#antibodySelector').val('FETCHING');
            this.plotSingleRppaExpression();
            let candidateGenes=this.references.rppaAntibodies[this.rppaId].geneIds;
            if(this.cohortMetadata.rppaExpressionAvailable>0){
                let candidateRppaIds=new Set([this.rppaId]);
                candidateGenes.forEach((x)=>{
                    this.references.genes.get(x).rppaIds.forEach((rppaId)=>{
                        candidateRppaIds.add(rppaId)
                    })
                });
                candidateRppaIds=Array.from(candidateRppaIds);
            }
        });
        $('#addSecondAntibodyAsSinglePhenotype').off("click").on("click",()=>{
            this.rppa2Id=this.references.rppaInputAwesompleteCurrentRppa;
            $('#antibodySelector').val('FETCHING');
            this.plotSingleRppaExpression();
            let candidateGenes=this.references.rppaAntibodies[this.rppa2Id].geneIds;
            if(this.cohortMetadata.rppaExpressionAvailable>0){
                let candidateRppaIds=new Set([this.rppa2Id]);
                candidateGenes.forEach((x)=>{
                    this.references.genes.get(x).rppaIds.forEach((rppaId)=>{
                        candidateRppaIds.add(rppaId)
                    })
                });
                candidateRppaIds=Array.from(candidateRppaIds);
            }
        });
        let thisRef=this;
        $('#svTadOffsetSelectorSinglePhenotypeSelector').off('change').on('change',function(){
            thisRef.svMaxTadOffset=parseInt(this.value);
            thisRef.resetPlots();
        });
        $('#offIndelTadOffsetSelectorSinglePhenotypeSelector').off('change').on('change',function(){
            thisRef.offIndelMaxTadOffset=parseInt(this.value);
            thisRef.resetPlots();
        });
        $('#addGenesOnCytobandCarryingGenesToList').off('click').on('click',()=>{
            this.reset();
            let geneId=this.references.geneInputAwesompleteCurrentGene;
            this.references.currentCohort.resetGeneSelector();
            let cytobandIndices=this.references.genes.get(geneId).cytobandIndices;
            let candidateGeneIds=new Set([geneId]);
            cytobandIndices.forEach((x)=>{
                this.references.cytobands[x].getGeneIndices().forEach((geneId)=>{
                    candidateGeneIds.add(geneId)
                })
            });
            candidateGeneIds=Array.from(candidateGeneIds);
        });
        $('#addGenesOnCytobandToList').off('click').on('click',()=>{
            $('#singleGeneExpressionSelection').empty();
            $('#singleRppaExpressionSelector').empty();
            let cytobandIndex=this.references.cytobandInputAwesompleteCurrentCytoband;
            this.references.currentCohort.resetCytobandSelector();
            let candidateGeneIds=new Set([]);
            this.references.cytobands[cytobandIndex].getGeneIndices().forEach((geneId)=>{
                candidateGeneIds.add(geneId)
            });
        });
        $('#singleGeneExpressionSelector').off('change').on('change',function(){
            if(this.value!=="-1"){
                thisRef.geneId=parseInt(this.value);
                thisRef.plotSingleGeneExpression();
                if(this.cohortMetadata.rppaExpressionAvailable>0){
                    let candidateRppaIds=thisRef.references.genes.get(thisRef.geneId).rppaIds;
                    thisRef.addCorrespondingAntibodies(candidateRppaIds);
                }
            }
        });
        $('#singleRppaExpressionSelector').off('change').on('change',function(){
            if(this.value!=="-1"){
                thisRef.rppaId=parseInt(this.value);
                thisRef.plotSingleRppaExpression();
            }
        });
        $('#groupSelectorSinglePhenotypeSelector1').off('change').on('change',function(){
            if(this.value!=="-1"){
                thisRef.group1=parseInt(this.value);
                thisRef.resetPlots();
            }
        });
        $('#groupSelectorSinglePhenotypeSelector2').off('change').on('change',function(){
            if(this.value!=="-1"){
                thisRef.group2=parseInt(this.value);
                thisRef.resetPlots();
            }
        });
        generalizedSliderEvents(
            "singlePhenotypePlotBaseSizeFactorController",
            (x)=>{return parseInt(x)/100;},
            `DefaultSize x`,
            (x)=>{
                this.customMagFactor=parseInt(x)/100;
                this.resetPlots();
            });
    }
    redrawPlotSupporters(){
        if(this.singleGeneExpression){
            this.singleGeneExpression.drawPlotSupporters();
        }
        if(this.singleRppaExpression){
            this.singleRppaExpression.drawPlotSupporters();
        }
    }
    resetPlots(){
        if(this.singleGeneExpression){
            this.plotSingleGeneExpression();
        }
        if(this.singleRppaExpression){
            this.plotSingleRppaExpression();
        }
    }
    addGenesToCandidateList(geneIds){
        if(geneIds.length>0){
            $('#singleGeneExpressionSelectorGroup').css('display','inline');
        }
        geneIds.forEach((geneId)=>{
            $('#singleGeneExpressionSelector').append(`<option value=${geneId}>${this.references.genes.get(geneId).geneName}</option>`);
        });
    }
    addCorrespondingAntibodies(rppaIds){
        if(rppaIds.length>0){
            $('#singleRppaExpressionSelectorGroup').css('display','inline');
        }
        rppaIds.forEach((rppaId)=>{
            $('#singleRppaExpressionSelector').append(`<option value=${rppaId}>${this.references.rppaAntibodies[rppaId].antibodyName}</option>`);
        });
    }
    plotSingleGeneExpression(){
        this.singleGeneExpression=null;
        $('#geneExpressionContent').empty();
        this.singleGeneExpression=new SinglePhenotypeExpression(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,false,"gene",this.geneId,this.gene2Id,this.svMaxTadOffset,this.offIndelMaxTadOffset,this.group1,this.group2,this.fontManager,this.singleDonorVariantContributions,this.singleDonorVariantContributions2,this.customMagFactor);
        $('#geneSelector').val('');
        this.references.currentCohort.resetGeneSelector();
    }
    plotSingleRppaExpression(){
        this.singleRppaExpression=null;
        $('#rppaExpressionContent').empty();
        this.singleRppaExpression=new SinglePhenotypeExpression(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,false,"rppa",this.rppaId,this.rppa2Id,this.svMaxTadOffset,this.offIndelMaxTadOffset,this.group1,this.group2,this.fontManager,this.singleDonorVariantContributions,this.singleDonorVariantContributions2,this.customMagFactor);
        $('#antibodySelectorSelector').val('');
        this.references.currentCohort.resetRppaSelector();
    }
    savePhenotypeSvg(){
        if(this.singleGeneExpression){
            this.singleGeneExpression.savePhenotypeSvg();
        }
        if(this.singleRppaExpression){
            this.singleRppaExpression.savePhenotypeSvg();
        }
    }

    textExport(){

    }
}