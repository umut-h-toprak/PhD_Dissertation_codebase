import {path as d3Xpath} from 'd3';
import {SelectionManager} from "./SelectionManager";
import {CommonSettings} from "./CommonSettings";
import {Metadata} from "./metadata/Metadata";
import {queue as d3Xqueue} from "d3-queue";
import {VariantRecurrenceEntryGene} from "./variantRecurrenceEntries/VariantRecurrenceEntryGene";
import {CohortData} from "./dataFetchersAndStorage/CohortData";
import {WheelManager} from "./wheel/WheelManager";
import {VizManager} from "./variants/VizManager";
import {Volcano} from "./volcano/Volcano";
import {SurvivalPlotManager} from "./survival/SurvivalPlotManager";
import {generalizedSliderEvents, saveSvg, switchElements, transitionToVariantScreen} from "./Utils";
import {SinglePhenotypeExpressionManager} from "./singlePhenotypeExpression/SinglePhenotypeExpressionManager";
import {FontManager} from "./fontManager/fontManager";
import {TsvExportManager} from "./tsvExport/tsvExportManager";
import {HeatmapManager} from "./heatmap/HeatmapManager";
import {FlexiblePlotManager} from "./flexiblePlots/FlexiblePlotManager";
export class Cohort {
    constructor(references,cohortName,wesMode){
        this.cohortName=cohortName;
        $('#cohortTitle').html(`Loading ${this.cohortName}`);
        $('#cohortSelectorGroup').css("display","none");
        this.commonSettings = new CommonSettings(wesMode);
        transitionToVariantScreen(this.commonSettings);
        this.commonSettings.lock();
        this.references=references;
        this.references.registerCohort(this);
        this.fontManager=new FontManager();
        this.fontManager.registerCohort(this);
        this.textExportManager=new TsvExportManager();
        this.textExportManager.registerCohort(this);
        this.selectionManager=new SelectionManager();
        this.cohortMetadata=new Metadata(this.commonSettings,this.references,this.selectionManager,this.cohortName,this.textExportManager,this.textExportManager);
        this.cohortData=new CohortData(this.commonSettings,this.references,this.cohortMetadata);
        this.flexiblePlotManager=new FlexiblePlotManager(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.textExportManager);
        this.heatmapManager=null;
        this.singlePhenotypePlotManager=null;
        this.survivalPlotManager=null;
        this.wheelManager=null;
        this.vizManager=null;
        this.correlationGeneExpressionVolcano=null;
        this.variantGeneExpressionVolcano=null;
        this.subcohortGeneExpressionVolcano=null;
        this.subcohortMutexVolcano=null;
        this.variantRppaExpressionVolcano=null;
        this.subcohortRppaExpressionVolcano=null;
        this.currentSubcohortIndex=0;
        this.selectedDiffSubcohortIndex=0;
        $('#mainContentControl').css('display','inline');
        $('#fontControlsCollapseControl').css('display','inline');
        $('#tsvExportControlsCollapseControl').css('display','inline');
        this.populateCohort();
    }
    enableControls(){
        $('#mainContentControl').css('display','inline');
        const controlElements=[
            "subcohortSelectorGroup",
            "cytobandDescriptionPaneControl",
            "svDescriptionPaneControl",
            "midSizedSvDescriptionPaneControl",
            "vdjSvDescriptionPaneControl",
            "smallVariantDescriptionPaneControl",
            "tadDescriptionPaneControl",
            "geneRecDescriptionPaneControl",
            "selectorControlsCollapseControl",
            "variantVizSpecificGeneSelectorControls",
            "geneSelectorMarkers",
            "geneSelectorMarkersOuter",
            "cytobandSelectorMarkers",
            "cytobandSelectorMarkersOuter",
            "gotoGeneVariants",
            "gotoCytoband",
            "variantVizSpecificCytobandSelectorControls",
            "variantDisplayControls",
            "svgDownloader",
        ];
        if($('#mainContentControl').hasClass('active')){
            switchElements([],controlElements);
        }
        $('#mainContentPane')
            .off('hide.bs.tab')
            .on('hide.bs.tab',()=>{
                switchElements(
                    controlElements,
                    [
                    ]);
            })
            .off('hidden.bs.tab')
            .on('hidden.bs.tab',()=>{
                switchElements(
                    controlElements,
                    [
                    ]);
            })
            .off('shown.bs.tab')
            .on('shown.bs.tab', ()=> {
                $('.nav-tabs a[href="#controlsPane"]').tab("show");
                switchElements(
                    [
                    ],
                    controlElements);
                // $('#helpInfo').html(tutorials.Tutorials.mainScreenTutorial());
                if(this.cohortData.VdjSvs.length>0){
                    $('#maxVdjGrade').slider('setValue',0);
                    $('#maxVdjGradeLabel').html("Max IG/T-cell Receptor Rearrangement Grade: 0");
                    $('#vdjSvDescriptionPaneControl').css('display','inline');
                }else{
                    $('#vdjSvDescriptionPaneControl').css('display','none');
                }
                this.fontManager.setAvailableFontSettings("variantView");
                this.textExportManager.setAvailableExportSettings("variantView");
            });
        $('#svgDownloader').off('click').on('click',()=>{
            this.commonSettings.lock();
            if($('#mainContentControl').hasClass('active')){
                let targetFileName=`${this.generateTitle(this.currentSubcohortIndex,this.selectedDiffSubcohortIndex).join("_")}.svg`;
                saveSvg(this.commonSettings.variantLandscapeSvgId,targetFileName);
            }
            else if($('#phenotypeExpressionContentPaneControl').hasClass('active')){
                this.singlePhenotypePlotManager.savePhenotypeSvg();
            }
            else if($('#survivalContentPaneControl').hasClass('active')){
                this.survivalPlotManager.saveSurvivalSvg();
            }
            else if($('#flexiblePlotsContentPaneControl').hasClass('active')){
                this.flexiblePlotManager.saveFlexibleSvg();
            }
            else{
                let currentVolcano=this.determineCurrentVolcano();
                if(currentVolcano!==null){
                    currentVolcano.saveVolcanoSvg();
                }
            }
            this.commonSettings.releaseLock();
        });

        $('#singleDonorSelector').off('change').on('change',function () {
            if(parseInt(this.value)===-1){
                $('#plotSingleDonor').css("display","none");
            } else{
                $('#plotSingleDonor').css("display","inline");
            }
        });
        $('#plotSingleDonor').off('click').on('click',()=>{
            const donorIndex=parseInt($('#singleDonorSelector').val());
            this.plotSingleDonor(donorIndex);
        });
        this.fontManager.setAvailableFontSettings("variantView");
        this.textExportManager.setAvailableExportSettings("variantView");
    }
    plotSingleDonor(donorIndex) {
        let donorName=this.cohortMetadata.metadata[donorIndex].donor;
        if(!this.selectionManager.registeredSubcohortNamesSet.has(donorName)){
            this.selectionManager.addNewSubcohort(new Set([donorIndex]), this.cohortMetadata.metadata[donorIndex].donor, this.cohortMetadata.metadata.length);
            this.cohortMetadata.refreshMetadata();
            this.launchAnalysis(this.selectionManager.currentMaxIndex,-1);
        }else{
            const singleDonorSubcohortIndex=this.selectionManager.registeredSubcohortNames.get(donorName);
            this.launchAnalysis(singleDonorSubcohortIndex,-1);
        }
    }
    populateCohort(){
        let q = d3Xqueue();
        q.defer((callback)=>{this.cohortMetadata.fetchCohortInformation(callback)});
        q.defer((callback)=>{this.cohortMetadata.fetchCohortMetadata(callback)});
        q.awaitAll((err)=> {
            if (err){
                console.error(err);
            }else{
                this.postMetadataSteps();
                let q2 = d3Xqueue();
                q2.defer((callback2)=>{this.wheelManager.readGeneMutTypes(callback2)});
                q2.awaitAll(()=>{
                    let q3 = d3Xqueue();
                    q3.defer((callback3)=>{this.cohortData.fetchRecData(callback3)});
                    q3.awaitAll(()=>{
                        this.postRecurrenceSteps();
                        let q4 = d3Xqueue();
                        q4.defer((callback4)=>{this.cohortData.fetchVarData(callback4)});
                        q4.awaitAll(()=>{
                            this.postVariantSteps();
                        });
                    });
                });
            }
        });
    }
    postMetadataSteps(){
        this.angleControls();
        this.subcohortControls();
        let donorIndices=new Set();
        let donorIndicesTumour=new Set();
        let realCohortSize=0;
        for(let i=0;i<this.cohortMetadata.metadata.length;++i){
            donorIndices.add(i);
            if(!this.cohortMetadata.metadata[i].hasOwnProperty("HealthySample")||this.cohortMetadata.metadata[i]["HealthySample"]==="-"){
                donorIndicesTumour.add(i);
                realCohortSize+=1;
            }
        }
        this.selectionManager.setCohortName(this.cohortMetadata.cohortName);
        this.selectionManager.addNewSubcohort(donorIndicesTumour,"WholeCohort",this.cohortMetadata.metadata.length);
        this.selectionManager.fullCohortSubcohortIndices.add(this.selectionManager.currentMaxIndex);
        if(donorIndices.size>donorIndicesTumour.size){
            this.selectionManager.addNewSubcohort(donorIndices,"WholeCohortAndHealthyTissue",this.cohortMetadata.metadata.length);
            this.selectionManager.fullCohortSubcohortIndices.add(this.selectionManager.currentMaxIndex);
        }
        this.wheelManager=new WheelManager(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,0,-1,this.cohortData,this.fontManager);
        this.determineMinSvRec(0);
        let anyPheno=false;
        if(this.cohortMetadata.geneExpressionAvailable>1){
            this.variantGeneExpressionVolcano=new Volcano(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,"GeneExpression","variant",this.fontManager,this.textExportManager);
            this.subcohortGeneExpressionVolcano=new Volcano(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,"GeneExpression","subcohort",this.fontManager,this.textExportManager);
            this.correlationGeneExpressionVolcano=new Volcano(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,"GeneExpression","correlation",this.fontManager,this.textExportManager);
            $('#variantGeneExpressionVolcanoContentPaneControl').css("display","inline");
            $('#correlationGeneExpressionVolcanoContentPaneControl').css("display","inline");
            anyPheno=true;
        }
        if(this.cohortMetadata.rppaExpressionAvailable>1){
            this.variantRppaExpressionVolcano=new Volcano(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,"RppaExpression","variant",this.fontManager,this.textExportManager);
            this.subcohortRppaExpressionVolcano=new Volcano(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,"RppaExpression","subcohort",this.fontManager,this.textExportManager);
            $('#variantRppaExpressionVolcanoContentPaneControl').css("display","inline");
            $('#volcanorppaExpressionControlsAux').css("display","inline");
            $('#antibodySelectorGroup').css("display","inline");
            $('#selectorControlsCollapseControl').html("Operations on Cytobands, Genes and RPPA Antibodies");
            anyPheno=true;
        }else{
            $('#selectorControlsCollapseControl').html("Operations on Cytobands and Genes");
        }
        if(anyPheno){
            $('#phenotypeExpressionContentPaneControl').css("display","inline");
            this.singlePhenotypePlotManager=new SinglePhenotypeExpressionManager(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.textExportManager);
        }
        if(this.cohortMetadata.geneExpressionAvailable>2 || this.cohortMetadata.methylomeArrayAvailable>2 || this.cohortMetadata.cnvAvailable>2 || this.cohortMetadata.svAvailable>2){
            this.heatmapManager=new HeatmapManager(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,this.textExportManager);
            $('#heatmapContentPaneControl').css('display','inline');
            this.flexiblePlotManager.enableManifoldControls();
            this.flexiblePlotManager.enablePCAControls();
            this.flexiblePlotManager.enableTSNEControls();
            // this.flexiblePlotManager.enableTSNEGPUControls();
            this.flexiblePlotManager.enableUMAPControls();
            this.heatmapManager.enableControls();
            $('#PCACollapseControl').css("display","inline");
            $('#tSNECollapseControl').css("display","inline");
        }else{
            $('#PCACollapseControl').css("display","none");
            $('#tSNECollapseControl').css("display","none");
        }
        if(this.cohortMetadata.survivalAvailable>1){
            $('#survivalContentPaneControl').css('display','inline');
            this.survivalPlotManager=new SurvivalPlotManager(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager);
        }
        $('#flexiblePlotsContentPaneControl').css('display','inline');
        this.subcohortMutexVolcano=new Volcano(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,"Mutex","subcohort",this.fontManager,this.textExportManager);
        this.registerVolcanoCommonControls();
        this.flexiblePlotManager.initialize();
    }
    postRecurrenceSteps(){
        this.wheelManager.readWheelChoices(true);
        $('#cohortTitle').html("");
        $('#introInfo').empty();
        $('#cohortSelectorGroup').css("display","inline");
        $('#subcohortSelectorGroup').css("display","inline");
        this.plotTitle(0);
        this.wheelManager.plot();
        this.registerSelectorControls();
    }
    postVariantSteps(){
        this.vizManager=new VizManager(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,0,this.cohortData);
        this.cohortData.assessChromosomeArmLevelCnvEffects();
        this.cohortData.assessFocalCnvEffects();
        this.cohortData.propagateTadCnvsToCytobands();
        this.cohortData.propagateTadSvsToCytobands();
        this.vizManager.plot(0);
        this.enableControls();
        this.commonSettings.releaseLock();
    }
    cleanupCohort(){
        $('#cohortTitle').html(`Cleaning-up ${this.cohortName}`);
        delete this.selectionManager;
        this.references.resetCohortContributions();
        this.fontManager.resetCohortContributions();
        this.textExportManager.resetCohortContributions();
        this.resetChromosomeArmSelector();
        this.resetGeneSelector();
        this.resetRppaSelector();
        this.resetCytobandSelector();
    }
    determineMinSvRec(selectedSubcohortIndex){
        let realCohortSize=0;
        for(let i=0;i<this.cohortMetadata.metadata.length;++i){
            if(this.selectionManager.registeredSubcohorts.get(selectedSubcohortIndex).has(this.cohortMetadata.metadata[i].index)){
                if(this.cohortMetadata.metadata[i]["SV"]==="+"){
                    realCohortSize+=1;
                }
            }
        }
        let tmpRec=Math.ceil(realCohortSize/5);
        this.commonSettings.minRecurrence=tmpRec;
        $('#minRec').slider().slider('setAttribute','data-slider-max',this.cohortMetadata.metadata.length).slider('setAttribute','max',this.cohortMetadata.metadata.length).slider('setValue',tmpRec);
        $('#minRecLabel').html(`Min SV Event<br/> Recurrence: ${tmpRec}`);
    }
    launchAnalysis(selectedSubcohortIndex,selectedDiffSubcohortIndex){
        this.currentSubcohortIndex=selectedSubcohortIndex;
        this.selectedDiffSubcohortIndex=selectedDiffSubcohortIndex;
        this.determineMinSvRec(selectedSubcohortIndex);
        $('#mainContent').empty();
        this.commonSettings.resetCohortSvg();
        this.plotTitle(selectedSubcohortIndex,selectedDiffSubcohortIndex);
        this.wheelManager=new WheelManager(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,selectedSubcohortIndex,selectedDiffSubcohortIndex,this.cohortData,this.fontManager);
        let q = d3Xqueue();
        q.defer((callback2)=>{this.wheelManager.readGeneMutTypes(callback2)});
        q.awaitAll(()=> {
            this.wheelManager.readWheelChoices(true);
            this.vizManager=new VizManager(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,this.fontManager,selectedSubcohortIndex,this.cohortData);
            setTimeout(()=>{this.wheelManager.plot()},0);
            setTimeout(()=>{this.vizManager.plot()},0);
        });
    }
    resetSelections(){
        $("#svTadDescriptionPaneControl").css("display","none");
        $("#indelTadDescriptionPaneControl").css("display","none");
        $("#variantDescriptionPaneControl").css("display","none");
        $("#cnvTadDescriptionPaneControl").css("display","none");
        $("#cytobandDescriptionPaneControl").css("display","none");
        $('#expressionContentPaneControl').addClass('disabled');
        $('#expressionContentPane').removeAttr("data-toggle");
        $('#survivalContentPaneControl').addClass('disabled');
        $('#survivalContentPane').removeAttr("data-toggle");
        $('#igTraMode').prop('checked', false);
    }

    generateTitle(selectionIndex,selectionDiffIndex){
        let longTitle= ``;
        const selectedDonors = new Set([...this.selectionManager.registeredSubcohorts.get(selectionIndex)].filter(x => this.cohortMetadata.anyVariantAvailableDonors.has(x)));
        if(selectedDonors.size>1){
            if(selectionIndex!==0){
                longTitle=`${this.cohortName}_${this.selectionManager.registeredSubcohortNames.get(selectionIndex)}(${selectedDonors.size}/${this.cohortMetadata.donors.size})`;
            }else{
                longTitle=`${this.cohortName}(${selectedDonors.size}/${this.cohortMetadata.donors.size})`;
            }

        }else{
            let donorIndex=Array.from(selectedDonors)[0];
            longTitle=`${this.cohortName}:(${this.cohortMetadata.metadata[donorIndex].donor}/${this.cohortMetadata.donors.size})`;
        }
        let titleChunks=[longTitle];
        if(longTitle.length>20){
            titleChunks= longTitle.split("(");
            if(titleChunks[0].length>20){
                titleChunks=longTitle.split("-");
                titleChunks[1]="-"+titleChunks[1];
            }else{
                titleChunks[1]="("+titleChunks[1];
            }
        }
        return titleChunks;
    }
    plotTitle(selectionIndex){
        let titleChunks=this.generateTitle(selectionIndex);
        let svg = this.commonSettings.mainSvg;
        let startY = (this.commonSettings.markedGenes.size>0) ? -460: -500;
        let startX = -500;
        let helperPath=d3Xpath();
        helperPath.moveTo(startX+30, startY+60);
        helperPath.lineTo(startX+1000,startY+60);
        helperPath.closePath();
        $("#cohortNameFrame").remove();
        svg.append("path")
            .attr("id", "cohortNameFrame")
            .attr("d", helperPath);
        let titleFontPre=this.fontManager.fontTree.get("variantViewFontTargetSelector").get("title");
        let titleFont=titleFontPre.generateFontCssText();
        $("#cohortNameSvg").remove();
        svg.append("text")
            .append("textPath")
            .attr("class","markerTextCohort")
            .attr("xlink:href", "#cohortNameFrame")
            .attr("id","cohortNameSvg")
            .style("dominant-baseline", "hanging")
            .style("text-anchor", "start")
            .attr("startOffset", "0%")
            .style("display","inline")
            .style("font",titleFont)
            .html(titleChunks[0]);
        if(titleChunks.length===2){
            let offset = $("#cohortNameSvg").get(0).getBoundingClientRect().height*1.2;
            let helperPath2=d3Xpath();
            helperPath2.moveTo(startX+30, startY+60+offset);
            helperPath2.lineTo(startX+1000,startY+60+offset);
            helperPath2.closePath();
            $("#cohortNameFrame2").remove();
            $("#cohortNameSvgLine2").remove();
            svg.append("path")
                .attr("id", "cohortNameFrame2")
                .attr("d", helperPath2);
            svg.append("text")
                .append("textPath")
                .attr("class","markerTextCohort")
                .attr("xlink:href", "#cohortNameFrame2")
                .attr("id","cohortNameSvgLine2")
                .style("dominant-baseline", "hanging")
                .style("text-anchor", "start")
                .attr("startOffset", "0%")
                .style("display","inline")
                .style("font",titleFont)
                .html(titleChunks[1]);
        }
    }
    angleControls(){
        let thisRef=this;
        this.resetChromosomeSliders();
        generalizedSliderEvents(
            "rotationAngleSelector",
            (x)=>{return x;},
            "Rotation Angle:",
            (x)=>{
                this.references.offsetRadians=parseInt(x)*(Math.PI/180);
                this.updateAngles();
            });
        for (let i = 1; i < 49; ++i) {
            generalizedSliderEvents(
                `armcoeff${i}`,
                (x)=>{return `${Math.pow(2,x-7)}x`;},
                `${thisRef.references.chromosomeArms[i].chromosomeArmName}:`,
                (x)=>{
                    const newCoefficient=Math.pow(2,x-7);
                    this.references.chromosomeArms[i].coefficient=newCoefficient;
                    let chromosomeArm=thisRef.references.chromosomeArms[i];
                    this.references.chromosomes[chromosomeArm.chromosomeIndex].daughterCoefficients.set(chromosomeArm.chromosomeArmIndex,newCoefficient);
                    for(let j=chromosomeArm.firstCytobandIndex;j<=chromosomeArm.lastCytobandIndex;++j){
                        this.references.cytobands[j].coefficient=newCoefficient;
                    }
                    this.updateAngles();
                });
        }
        for (let i = 1; i < 28; ++i) {
            generalizedSliderEvents(
                `coeff${i}`,
                (x)=>{return `${Math.pow(2,x-7)}x`;},
                `${thisRef.references.chromosomes[i].chromosomeName}:`,
                (x)=>{
                    const rawCoefficient=x;
                    const newCoefficient=Math.pow(2,rawCoefficient-7);
                    this.references.chromosomes[i].coefficient=newCoefficient;
                    let chromosome=thisRef.references.chromosomes[i];
                    for(let j=chromosome.firstCytobandIndex;j<=chromosome.lastCytobandIndex;++j){
                        this.references.cytobands[j].coefficient=newCoefficient;
                    }
                    for(let j=this.references.chromosomes[i].firstChromosomeArmIndex;j<=this.references.chromosomes[i].lastChromosomeArmIndex;++j){
                        $(`#armcoeff${j}`).slider('setValue',rawCoefficient);
                        $(`#armcoeff${j}Label`).html(`${thisRef.references.chromosomeArms[j].chromosomeArmName}: ${newCoefficient}x`);
                    }
                    this.updateAngles();
                });
        }
        generalizedSliderEvents(
            "coeff28",
            (x)=>{return `${Math.pow(2,x-7)}x`;},
            "GL*:",
            (x)=>{
                const chromosomeIndex = 28;
                const newCoefficient=Math.pow(2,x-7);
                for (let j = chromosomeIndex; j < this.references.chromosomes.length; ++j) {
                    this.references.chromosomes[j].coefficient=newCoefficient;
                    const chromosome=this.references.chromosomes[j];
                    for(let i=chromosome.firstCytobandIndex;i<=chromosome.lastCytobandIndex;++i){
                        this.references.cytobands[i].coefficient=newCoefficient;
                    }
                }
                this.updateAngles();
            });
        $('#resetChrs').off("click").on("click",()=>{
            thisRef.references.cytobands.forEach((x)=>{
                x.resetCoefficient();
            });
            thisRef.references.chromosomes.forEach((x)=>{
                x.resetCoefficient();
            });
            thisRef.resetChromosomeSliders();
            setTimeout(()=>{thisRef.updateAngles()},0);
        });
        $('#resetChrArms').off("click").on("click",()=>{
            thisRef.references.cytobands.forEach((x)=>{
                x.resetCoefficient();
            });
            thisRef.references.chromosomes.forEach((x)=>{
                x.resetCoefficient();
            });
            thisRef.resetChromosomeSliders();
            setTimeout(()=>{thisRef.updateAngles()},0);
        });
    }
    subcohortControls(){
        let thisRef=this;
        $('#subcohortSelector').off('change').on('change',function () {
            let subcohortIndex=parseInt(this.value);
            let subcohortDiffIndex=parseInt($('#subcohortDiffSelector').val());
            if(subcohortIndex!==subcohortDiffIndex){
                thisRef.launchAnalysis(subcohortIndex,subcohortDiffIndex);
            }
        });
        $('#subcohortDiffSelector').off('change').on('change',function () {
            let subcohortDiffIndex=parseInt(this.value);
            let subcohortIndex=parseInt($('#subcohortSelector').val());
            if(subcohortIndex!==subcohortDiffIndex){
                thisRef.launchAnalysis(subcohortIndex,subcohortDiffIndex);
            }
        });
    }
    resetChromosomeSliders(){
        for (let i = 1; i < 28; ++i) {
            let initVal=this.references.chromosomes[i].coefficientInit;
            let initValAdj=Math.log2(initVal)+7;
            $(`#coeff${i}`).slider().slider('setValue',initValAdj);
            $(`#coeff${i}Label`).html(`${this.references.chromosomes[i].chromosomeName}: ${initVal}x`);
        }
        let glVal=this.references.chromosomes[28].coefficientInit;
        let glValAdj=Math.log2(glVal)+7;
        $('#coeff28').slider('setValue',glValAdj);
        $('#coeff28Label').html(`GL*: ${glVal}x`);

        for (let i = 1; i < 49; ++i) {
            let initVal=this.references.chromosomeArms[i].coefficientInit;
            let initValAdj=Math.log2(initVal)+7;
            $(`#armcoeff${i}`).slider().slider('setValue',initValAdj);
            $(`#armcoeff${i}Label`).html(`${this.references.chromosomeArms[i].chromosomeArmName}: ${initVal}x`);
        }
        $('#rotationAngleSelector').val("0");
        $('#rotationAngleSelectorLabel').html("Rotation Angle: 0");
    }

    updateAngles(){
        this.references.assessCurrentCumulativeSizes();
        this.wheelManager.updateAngles();
        this.vizManager.updateAngles();
    }

    selectTad(tadIndex,tadVariantClasses){
        this.vizManager.tracerCleanup();
        const currentValidPatients=this.selectionManager.registeredSubcohorts.get(this.currentSubcohortIndex);
        const [tadReport,displayedDistinctDonors]=this.references.tads[tadIndex].annotate(this.cohortMetadata,this.references,currentValidPatients,tadVariantClasses);
        $('#tadDescription').html(tadReport);
        $('.nav-tabs a[href="#tadDescriptionPane"]').tab("show");
        $('#fetchSmallVariantsFromTad').css('display','inline');
        this.registerTadControls(tadIndex,tadVariantClasses,displayedDistinctDonors);
        this.vizManager.focusOnTad(tadIndex);
    }
    registerTadControls(tadIndex,tadVariantClasses,displayedDistinctDonors){
        $('#geneInTadSelector').empty().append(`<option value=0>Select Gene</option>`);
        this.references.tads[tadIndex].geneIndices.forEach((g)=>{
            $('#geneInTadSelector').append(`<option value=${g}>${this.references.genes.get(g).geneName}</option>`);
        });
        $('#tadDescriptionPaneControl').css("display","inline");
        $('#svDescriptionPaneControl').css("display","inline");
        $('#cytobandDescriptionPaneControl').css("display","none");
        $('#resetFocus').css("display","inline");
        let thisRef=this;
        let cytobandIndices=this.references.tads[tadIndex].cytobandIndices;
        let cytCoeffMax=0;
        let cytAnnoStrs=[];
        cytobandIndices.forEach((x)=>{
            let coeff = this.references.cytobands[x].coefficient;
            if(coeff>cytCoeffMax){
                cytCoeffMax=coeff;
            }
            cytAnnoStrs.push(this.references.cytobands[x].cytobandName);
        });
        let cytCoeffAdj=Math.log2(cytCoeffMax)+7;
        let cytAnnoStrFinal=cytAnnoStrs.join(', ');
        $('#coeffCurrentTadLabel').html(`${cytAnnoStrFinal}: ${cytCoeffMax}x`);
        $('#coeffCurrentTad').slider('setValue',cytCoeffAdj).off("change").on("change", function() {
            let newCoefficient=Math.pow(2,+$(this).val()-7);
            $('#coeffCurrentTadLabel').html(`${cytAnnoStrFinal}: ${newCoefficient}x`);
        }).off("slideStop").on("slideStop",function(){
            let newCoefficient=Math.pow(2,+$(this).val()-7);
            cytobandIndices.forEach((cytobandIndex)=>{
                thisRef.references.cytobands[cytobandIndex].coefficient=newCoefficient;
            });
            setTimeout(()=>{thisRef.updateAngles()},0);
        });
        let prevTad=tadIndex-1;
        if(prevTad===0){
            prevTad=3486;
        }
        $('#tadSweepLeft').off("click").on("click",()=>{
            this.selectTad(prevTad,tadVariantClasses);
        });
        let nextTad=tadIndex+1;
        if(nextTad===3487){
            nextTad=1;
        }
        $('#tadSweepRight').off("click").on("click",()=>{
            this.selectTad(nextTad,tadVariantClasses);
        });
        $('#createSubcohortFromTadRecurrence').css('display','none').off('click').on('click',()=>{
            const unknownDonors=new Set(
                [...this.cohortMetadata.anyVariantAvailableDonors]
                    .filter(x =>
                        !this.selectionManager.registeredSubcohorts.get(this.currentSubcohortIndex).has(x)));
            let selectionNameHandle=$('#tadRecurrenceSubcohortSelectionName');
            const selectionName=selectionNameHandle.val();
            this.cohortMetadata.finalizeSelection(displayedDistinctDonors,unknownDonors,selectionName,"subcohortSelectionFromTadRecurrenceDescription");
            selectionNameHandle.val('');
        });
        $('#tadRecurrenceSubcohortSelectionName').off('change').on('change',function(){
            if(thisRef.selectionManager.registeredSubcohortNamesSet.has(this.value)){
                $('#createSubcohortFromTadRecurrence').css('display','none');
            }else{
                $('#createSubcohortFromTadRecurrence').css('display','inline');
            }
        });
    }

    selectCytoband(cytobandIndex){
        this.vizManager.tracerCleanup();
        $('.nav-tabs a[href="#cytobandDescriptionPane"]').tab("show");
        $('#fetchSmallVariantsFromCytoband').css('display','inline');
        this.registerCytobandControls(cytobandIndex);
        $('#cytobandDescription').html(this.references.cytobands[cytobandIndex].annotate(this.references,this.cohortMetadata));
        this.vizManager.focusOnCytoband(cytobandIndex);
    }
    registerCytobandControls(cytobandIndex){
        $('#geneInCytobandSelector').empty().append(`<option value=0>Select Gene</option>`);
        this.references.cytobands[cytobandIndex].getGeneIndices(this.references).forEach((g)=>{
            $('#geneInCytobandSelector').append(`<option value=${g}>${this.references.genes.get(g).geneName}</option>`);
        });
        $('#tadDescriptionPaneControl').css("display","none");
        $('#cytobandDescriptionPaneControl').css("display","inline");
        $('#resetFocus').css("display","inline");
        $('#svDescriptionPaneControl').css("display","inline");
        let thisRef=this;
        let cytCoeff=this.references.cytobands[cytobandIndex].coefficient;
        let cytCoeffAdj=Math.log2(cytCoeff)+7;
        $('#coeffCurrentCytobandLabel').html(`${this.references.cytobands[cytobandIndex].cytobandName}: ${cytCoeff}x`);
        this.selectionManager.currentCytoband=cytobandIndex;
        $('#coeffCurrentCytoband').slider('setValue',cytCoeffAdj).off("change").on("change", function() {
            let newCoefficient=Math.pow(2,+$(this).val()-7);
            $('#coeffCurrentCytobandLabel').html(`${thisRef.references.cytobands[cytobandIndex].cytobandName}: ${newCoefficient}x`);
        }).off("slideStop").on("slideStop",function(){
            thisRef.references.cytobands[cytobandIndex].coefficient=Math.pow(2,+$(this).val()-7);
            setTimeout(()=>{thisRef.updateAngles()},0);
        });
        $('#submitCytobandChoices').off("click").on("click",()=>{

        });
        let prevCyt=cytobandIndex-1;
        if(prevCyt===0){
            prevCyt=this.references.cytobands.length-1;
        }
        $('#cytobandSweepLeft').off("click").on("click",()=>{
            this.selectCytoband(prevCyt);
        });
        let nextCyt=cytobandIndex+1;
        if(nextCyt===this.references.cytobands.length){
            nextCyt=1;
        }
        $('#markCytobandFromDesc').css('display','inline').off('click').on('click',()=>{
            this.wheelManager.markCytoband(cytobandIndex);
            $('#markCytobandFromDesc').css('display','none');
        });
        $('#cytobandSweepRight').off("click").on("click",()=>{
            this.selectCytoband(nextCyt);
        });
    }
    selectGeneRecurrence(geneId,wheelMutTypes){
        this.vizManager.tracerCleanup();
        $('#fetchSmallVariantsFromGene').css('display','inline');
        $('#resetFocus').css("display","inline");
        $('#svDescriptionPaneControl').css("display","inline");
        $('#geneRecDescriptionPaneControl').css("display","inline");
        $('#tadDescriptionPaneControl').css("display","none");
        $('#cytobandDescriptionPaneControl').css("display","none");
        if(!this.references.genes.has(geneId)){
            return;
        }
        let q = d3Xqueue();
        q.defer((callback)=>{
            this.cohortData.fetchSingleGeneRecurrenceData(callback,geneId);
        });
        q.awaitAll(()=>{
            this.registerGeneControls(geneId,wheelMutTypes);
            this.vizManager.focusOnGene(geneId);
        });
    }
    registerGeneControls(geneId,wheelMutTypes){
        let variantTypesFull=new Set();
        for(let i=0;i<this.references.variantTypes.length-1;++i){
            variantTypesFull.add(i);
        }
        const tmpRec = new VariantRecurrenceEntryGene(this.cohortData.currentSingleGeneRecurrence,variantTypesFull);
        const tmpEntry=this.references.genes.get(geneId);
        const currentValidPatients=this.selectionManager.registeredSubcohorts.get(this.currentSubcohortIndex);
        let [geneRecReport,displayedDistinctDonors]=tmpEntry.annotateDonorContributions(this.cohortMetadata,this.references,tmpRec.contributions,wheelMutTypes,currentValidPatients);
        $('#geneRecDescription').html(geneRecReport);
        const cytobandIndices=this.references.genes.get(geneId).cytobandIndices;
        let cytCoeffMax=0;
        let cytAnnoStrs=[];
        cytobandIndices.forEach((x)=>{
            let coeff = this.references.cytobands[x].coefficient;
            if(coeff>cytCoeffMax){
                cytCoeffMax=coeff;
            }
            cytAnnoStrs.push(this.references.cytobands[x].cytobandName);
        });
        const cytCoeffAdj=Math.log2(cytCoeffMax)+7;
        const cytAnnoStrFinal=cytAnnoStrs.join(', ');
        $('#coeffCurrentGeneLabel').html(`${cytAnnoStrFinal}: ${cytCoeffMax}x`);
        let thisRef=this;
        $('#coeffCurrentGene').slider('setValue',cytCoeffAdj).off("change").on("change", function() {
            let newCoefficient=Math.pow(2,+$(this).val()-7);
            $('#coeffCurrentGeneLabel').html(`${cytAnnoStrFinal}: ${newCoefficient}x`);
        }).off("slideStop").on("slideStop",function(){
            let newCoefficient=Math.pow(2,+$(this).val()-7);
            cytobandIndices.forEach((cytobandIndex)=>{
                thisRef.references.cytobands[cytobandIndex].coefficient=newCoefficient;
            });
            setTimeout(()=>{thisRef.updateAngles()},0);
        });
        $('#addGeneExpressionToMetadataFromDesc').css('display','inline').off('click').on('click',()=>{
            this.cohortMetadata.addGeneExpressionToMetadata(geneId,this.flexiblePlotManager);
            $('#addGeneExpressionToMetadataFromDesc').css('display','none');
        });
        $('#addGeneVariantsToMetadataFromDesc').css('display','inline').off('click').on('click',()=>{
            this.cohortMetadata.addGeneVariantsToMetadata(geneId,this.flexiblePlotManager);
            $('#addGeneVariantsToMetadataFromDesc').css('display','none');
        });
        $('#markGeneFromDesc').css('display','inline').off('click').on('click',()=>{
            this.wheelManager.markGene(geneId);
            $('#markGeneFromDesc').css('display','none');
        });
        $('#createSubcohortFromGeneRecurrence').css('display','none').off('click').on('click',()=>{
            const displayedDonors=displayedDistinctDonors;
            const unknownDonors=new Set(
                [...this.cohortMetadata.anyVariantAvailableDonors]
                    .filter(x =>
                        !this.selectionManager.registeredSubcohorts.get(this.currentSubcohortIndex).has(x)));
            let selectionNameHandle=$('#geneRecurrenceSubcohortSelectionName');
            const selectionName=selectionNameHandle.val();
            this.cohortMetadata.finalizeSelection(displayedDonors,unknownDonors,selectionName,"subcohortSelectionFromGeneRecurrenceDescription");
            selectionNameHandle.val('');
        });
        $('#geneRecurrenceSubcohortSelectionName').off('change').on('change',function(){
            if(thisRef.selectionManager.registeredSubcohortNamesSet.has(this.value)){
                $('#createSubcohortFromGeneRecurrence').css('display','none');
            }else{
                $('#createSubcohortFromGeneRecurrence').css('display','inline');
            }
        });
        $('.nav-tabs a[href="#geneRecDescriptionPane"]').tab("show");
    }
    registerSelectorControls(){
        let thisRef=this;
        this.resetChromosomeArmSelector();
        this.resetGeneSelector();
        this.resetCytobandSelector();
        this.resetRppaSelector();
        $('#geneSelector').off("awesomplete-selectcomplete").on('awesomplete-selectcomplete',function(){
            let selectedGene=parseInt(this.value);
            let label=thisRef.references.genes.get(selectedGene).geneName;
            thisRef.references.geneInputAwesompleteCurrentGene=selectedGene;
            this.value=label;
            thisRef.enableGeneSelectorFeatures();
        });
        $('#cytobandSelector').off("awesomplete-selectcomplete").on('awesomplete-selectcomplete',function(){
            let selectedCytoband=parseInt(this.value);
            let label=thisRef.references.cytobands[selectedCytoband].cytobandName;
            thisRef.references.cytobandInputAwesompleteCurrentCytoband=selectedCytoband;
            this.value=label;
            thisRef.enableCytobandSelectorFeatures();
        });
        $('#chromosomeArmSelector').off("awesomplete-selectcomplete").on('awesomplete-selectcomplete',function(){
            let selectedChromosomeArm=parseInt(this.value);
            let label=thisRef.references.chromosomeArms[selectedChromosomeArm].chromosomeArmName;
            thisRef.references.chromosomeArmInputAwesompleteCurrentChromosomeArm=selectedChromosomeArm;
            this.value=label;
            thisRef.enableChromosomeArmSelectorFeatures();
        });
        $('#antibodySelector').off("awesomplete-selectcomplete").on('awesomplete-selectcomplete',function(){
            let selectedRppa=parseInt(this.value);
            let label=thisRef.references.rppaAntibodies[selectedRppa].rppaName;
            thisRef.references.rppaInputAwesompleteCurrentRppa=selectedRppa;
            this.value=label;
            thisRef.enableRppaSelectorFeatures();
        });
        $('#markGene').off("click").on("click",()=>{
            let geneToMark=this.references.geneInputAwesompleteCurrentGene;
            if($('#mainContentControl').hasClass('active')){
                this.wheelManager.markGene(geneToMark);
            }else{
                let currentVolcano=this.determineCurrentVolcano();
                if(currentVolcano!==null){
                    currentVolcano.markGene(geneToMark,-1,false);
                }
            }
            this.resetGeneSelector();
        });
        $('#markCytoband').off("click").on("click",()=>{
            let cytobandToMark=this.references.cytobandInputAwesompleteCurrentCytoband;
            if($('#mainContentControl').hasClass('active')){
                this.wheelManager.markCytoband(cytobandToMark);
            }
            this.resetCytobandSelector();
        });

        $('#startCorrelationVolcanoAnalysisGene').off("click").on("click",()=>{
            let geneToCorrelate=this.references.geneInputAwesompleteCurrentGene;
            let currentVolcano=this.determineCurrentVolcano();
            if(currentVolcano!==null){
                currentVolcano.launchCorrelationAnalysis(geneToCorrelate);
            }
            this.resetGeneSelector();
        });
        $('#clearMarkedGenes').off("click").on("click",()=>{
            if($('#mainContentControl').hasClass('active')){
                this.wheelManager.clearMarkedGenes();
            }else{
                let currentVolcano=this.determineCurrentVolcano();
                if(currentVolcano!==null){
                    currentVolcano.clearMarkedGenes();
                }
            }
        });
        $('#clearMarkedCytobands').off("click").on("click",()=>{
            if($('#mainContentControl').hasClass('active')){
                this.wheelManager.clearMarkedCytobands();
            }
        });
        $('#markCytobandAllGenes').off("click").on("click",()=>{
            let cytobandToMark=this.references.cytobandInputAwesompleteCurrentCytoband;
            if($('#mainContentControl').hasClass('active')){
                this.wheelManager.markAllGenesOnCytoband(cytobandToMark);
            }else{
                let currentVolcano=this.determineCurrentVolcano();
                if(currentVolcano!==null){
                    currentVolcano.markAllGenesOnCytoband(cytobandToMark);
                }
            }
            this.resetCytobandSelector();
        });
        $('#hideCytobandAllGenes').off("click").on("click",()=>{
            let cytobandToHide=this.references.cytobandInputAwesompleteCurrentCytoband;
            if($('#mainContentControl').hasClass('active')){

            }else{
                let currentVolcano=this.determineCurrentVolcano();
                if(currentVolcano!==null){
                    currentVolcano.hideAllGenesOnCytoband(cytobandToHide);
                }
            }
            this.resetCytobandSelector();
        });

        $('#markAllGenesOnCytobandsCarryingGene').off("click").on("click",()=>{
            let geneToMark=this.references.geneInputAwesompleteCurrentGene;
            if($('#mainContentControl').hasClass('active')){
                this.wheelManager.markAllGenesOnCytobandsContainingGene(geneToMark);
            }else{
                let currentVolcano=this.determineCurrentVolcano();
                if(currentVolcano!==null){
                    currentVolcano.markAllGenesOnCytobandsContainingGene(geneToMark);
                }
            }
            this.resetGeneSelector();
        });
        $('#markCytobandsCarryingGene').off("click").on("click",()=>{
            let geneToMark=this.references.geneInputAwesompleteCurrentGene;
            if($('#mainContentControl').hasClass('active')){
                this.wheelManager.markCytobandsCarryingGene(geneToMark);
            }
            this.resetGeneSelector();
        });
        $('#hideAllGenesOnCytobandsCarryingGene').off("click").on("click",()=>{
            let geneToMark=this.references.geneInputAwesompleteCurrentGene;
            let currentVolcano=this.determineCurrentVolcano();
            if(currentVolcano!==null){
                currentVolcano.hideAllGenesOnCytobandsContainingGene(geneToMark);
            }
            this.resetGeneSelector();
        });
        $('#addGeneExpressionToMetadata').off("click").on("click",()=>{
            let geneToFetch=this.references.geneInputAwesompleteCurrentGene;
            $('#geneSelector').val('FETCHING');
            this.cohortMetadata.addGeneExpressionToMetadata(geneToFetch);
        });
        $('#addAntibodyExpressionToMetadata').off("click").on("click",()=>{
            let rppaToFetch=this.references.rppaInputAwesompleteCurrentRppa;
            $('#antibodySelector').val('FETCHING');
            this.cohortMetadata.addRppaExpressionToMetadata(rppaToFetch);
        });
        $('#addChromosomeArmVariantsToMetadata').off("click").on("click",()=>{
            let chromosomeArmToFetch=this.references.chromosomeArmInputAwesompleteCurrentChromosomeArm;
            this.cohortMetadata.addChromosomeArmVariantsToMetadata(chromosomeArmToFetch);
        });
        $('#addCytobandVariantsToMetadata').off("click").on("click",()=>{
            let cytobandToFetch=this.references.cytobandInputAwesompleteCurrentCytoband;
            this.cohortMetadata.addCytobandVariantsToMetadata(cytobandToFetch);
        });
        $('#addGeneVariantsToMetadata').off("click").on("click",()=>{
            let geneToFetch=this.references.geneInputAwesompleteCurrentGene;
            $('#geneSelector').val('FETCHING');
            this.cohortMetadata.addGeneVariantsToMetadata(geneToFetch);
        });
        $('#gotoGeneVariants').off("click").on("click",()=>{
            let targetGeneId=this.references.geneInputAwesompleteCurrentGene;
            if(!$('#mainContentControl').hasClass('active')){
                transitionToVariantScreen(this.commonSettings);
            }
            let allowedMutTypes=new Set();
            for(let i=3;i>=0;i--){
                if(this.wheelManager.wheelGeneMutTypes[i].size>0){
                    allowedMutTypes=this.wheelManager.wheelGeneMutTypes[i];
                }
            }
            this.references.emitGeneClick(targetGeneId,allowedMutTypes);
        });
        $('#gotoCytoband').off("click").on("click",()=>{
            let targetCytobandIndex=this.references.cytobandInputAwesompleteCurrentCytoband;
            if(!$('#mainContentControl').hasClass('active')){
                transitionToVariantScreen(this.commonSettings);
            }
            this.references.emitCytobandClick(targetCytobandIndex);
        });
    }
    resetGeneSelector(){
        [
            "allGeneSelectorControls"
        ].forEach((x)=>{
            $(`#${x}`).css("display","none");
        });
        this.references.geneInputAwesompleteCurrentGene=-1;
        $('#geneSelector').val('');
    }
    resetChromosomeArmSelector(){
        [
            "allChromosomeArmSelectorControls"
        ].forEach((x)=>{
            $(`#${x}`).css("display","none");
        });
        this.references.chromosomeArmInputAwesompleteCurrentChromosomeArm=-1;
        $('#chromosomeArmSelector').val('');
    }
    resetCytobandSelector(){
        [
            "allCytobandSelectorControls"
        ].forEach((x)=>{
            $(`#${x}`).css("display","none");
        });
        this.references.cytobandInputAwesompleteCurrentCytoband=-1;
        $('#cytobandSelector').val('');
    }
    resetRppaSelector(){
        [
            "allAntibodySelectorControls"
        ].forEach((x)=>{
            $(`#${x}`).css("display","none");
        });
        this.references.rppaInputAwesompleteCurrentRppa=-1;
        $('#antibodySelector').val('');
    }
    enableGeneSelectorFeatures(){
        [
            "allGeneSelectorControls"
        ].forEach((x)=>{
            $(`#${x}`).css("display","inline");
        });
        if(this.cohortMetadata.geneExpressionAvailable>0){
            $('#addGeneExpressionToMetadata').css("display","inline");
        }
    }
    enableCytobandSelectorFeatures(){
        [
            "allCytobandSelectorControls"
        ].forEach((x)=>{
            $(`#${x}`).css("display","inline");
        })
    }
    enableChromosomeArmSelectorFeatures(){
        [
            "allChromosomeArmSelectorControls"
        ].forEach((x)=>{
            $(`#${x}`).css("display","inline");
        })
    }
    enableRppaSelectorFeatures(){
        [
            "allAntibodySelectorControls"
        ].forEach((x)=>{
            $(`#${x}`).css("display","inline");
        })
    }
    registerVolcanoCommonControls(){
        $('#volcanoDetailedView').off('click').on('click',()=>{
            let singleGeneExpressionHandle=this.determineCurrentVolcano().singleGeneExpression;
            if(singleGeneExpressionHandle){
                singleGeneExpressionHandle.convertToFullMode();
            }
            else{
                let singleRppaExpressionHandle=this.determineCurrentVolcano().singleRppaExpression;
                if(singleRppaExpressionHandle){
                    singleRppaExpressionHandle.convertToFullMode();
                }
            }
        });
        $('#volcanoClearGene').off("click").on("click",()=>{
            this.determineCurrentVolcano().removeLastMarkedGene();
        });
        $('#volcanoHideGene').off("click").on("click",()=>{
            this.determineCurrentVolcano().hideLastMarkedGene();
        });
        $('#volcanoPubmedGene').off("click").on("click",()=>{
            this.determineCurrentVolcano().pubmedCurrentGene();
        });
        $('#volcanoSetAsTopP').off("click").on("click",()=>{
            this.determineCurrentVolcano().setCurrentGeneAsTopY();
        });
        $('#volcanoSetAsTopFoldChange').off("click").on("click",()=>{
            this.determineCurrentVolcano().setCurrentGeneAsTopX();
        });
        $('#volcanoAddGeneExpressionToMetadata').off("click").on("click",()=>{
            this.determineCurrentVolcano().addCurrentGeneExpressionToMetadata();
        });
        $('#volcanoAddGeneVariantsToMetadata').off("click").on("click",()=>{
            this.determineCurrentVolcano().addCurrentGeneVariantsToMetadata();
        });
        $('#volcanoGoToGene').off("click").on("click",()=>{
            let currentVolcano=this.determineCurrentVolcano();
            let targetVolcanoItemIndex=currentVolcano.displaySettings.lastVolcanoItemIndex;
            if(targetVolcanoItemIndex!==-1){
                let targetGeneId=currentVolcano.data[currentVolcano.volcanoIndexToDataIndex.get(targetVolcanoItemIndex)].getGeneIndices()[0];
                if(!$('#mainContentControl').hasClass('active')){
                    transitionToVariantScreen(this.commonSettings);
                }
                let allowedMutTypes=new Set();
                for(let i=3;i>=0;i--){
                    if(this.wheelManager.wheelGeneMutTypes[i].size>0){
                        allowedMutTypes=this.wheelManager.wheelGeneMutTypes[i];
                    }
                }
                this.references.emitGeneClick(targetGeneId,allowedMutTypes);
            }
        });
    }
    determineCurrentVolcano(){
        if($('#variantGeneExpressionVolcanoContentPaneControl').hasClass('active')){
            return this.variantGeneExpressionVolcano;
        }
        if($('#subcohortGeneExpressionVolcanoContentPaneControl').hasClass('active')){
            return this.subcohortGeneExpressionVolcano;
        }
        if($('#subcohortMutexVolcanoContentPaneControl').hasClass('active')){
            return this.subcohortMutexVolcano;
        }
        if($('#variantRppaExpressionVolcanoContentPaneControl').hasClass('active')){
            return this.variantRppaExpressionVolcano;
        }
        if($('#subcohortRppaExpressionVolcanoContentPaneControl').hasClass('active')){
            return this.subcohortRppaExpressionVolcano;
        }
        if($('#correlationGeneExpressionVolcanoContentPaneControl').hasClass('active')){
            return this.correlationGeneExpressionVolcano;
        }
        return null;
    }
}
