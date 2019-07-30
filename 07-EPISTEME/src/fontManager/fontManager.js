import {FontSettings} from './fontSettings'
export class FontManager {
    constructor(){
        this.currentCohort=null;

        this.currentScreenName="";
        this.currentTargetName="";

        this.fontTree=new Map([]);
        this.addNewFont("variantViewFontTargetSelector","title","Noto Sans",24,false,true);
        this.addNewFont("variantViewFontTargetSelector","chromosomeLabels","Noto Sans",14,false,true);
        this.addNewFont("variantViewFontTargetSelector","verticalAxisLabels","Noto Sans",8,false,false);
        this.addNewFont("variantViewFontTargetSelector","horizontalAxisLabels","Noto Sans",10,false,false);
        this.addNewFont("variantViewFontTargetSelector","cytobandAndGeneLabels","Noto Sans",12,false,false);

        this.addNewFont("singlePhenotypeExpressionFontTargetSelector","title","Noto Sans",20,false,true);
        this.addNewFont("singlePhenotypeExpressionFontTargetSelector","expressionQuantityLabels","Noto Sans",12,false,false);
        this.addNewFont("singlePhenotypeExpressionFontTargetSelector","expressionQuantityTitle","Noto Sans",14,false,false);
        this.addNewFont("singlePhenotypeExpressionFontTargetSelector","donorLabels","Noto Sans",10,false,false);

        this.addNewFont("survivalFontTargetSelector","title","Noto Sans",16,false,true);
        this.addNewFont("survivalFontTargetSelector","xAxisLabels","Noto Sans",12,false,false);
        this.addNewFont("survivalFontTargetSelector","xAxisTitle","Noto Sans",14,false,false);
        this.addNewFont("survivalFontTargetSelector","yAxisLabels","Noto Sans",12,false,false);

        this.addNewFont("flexiblePlotFontTargetSelector","donorLabels","Noto Sans",14,false,true);
        this.addNewFont("flexiblePlotFontTargetSelector","xAxisLabels","Noto Sans",12,false,false);
        this.addNewFont("flexiblePlotFontTargetSelector","xAxisTitle","Noto Sans",14,false,false);
        this.addNewFont("flexiblePlotFontTargetSelector","yAxisLabels","Noto Sans",12,false,false);
        this.addNewFont("flexiblePlotFontTargetSelector","yAxisTitle","Noto Sans",14,false,false);
        this.addNewFont("flexiblePlotFontTargetSelector","legendLabels","Noto Sans",12,false,false);

        this.addNewFont("heatmapFontTargetSelector","donorLabels","Noto Sans",14,false,true);
        this.addNewFont("heatmapFontTargetSelector","markedElementLabels","Noto Sans",10,false,true);


        this.addNewFont("volcanoFontTargetSelector","title","Noto Sans",16,false,true);
        this.addNewFont("volcanoFontTargetSelector","markedElementLabels","Noto Sans",10,false,false);
        this.addNewFont("volcanoFontTargetSelector","xAxisLabels","Noto Sans",10,false,false);
        this.addNewFont("volcanoFontTargetSelector","xAxisTitle","Noto Sans",14,false,false);
        this.addNewFont("volcanoFontTargetSelector","yAxisLabels","Noto Sans",10,false,false);
        this.addNewFont("volcanoFontTargetSelector","yAxisTitle","Noto Sans",14,false,false);
        this.enableControls();
    }
    registerCohort(cohortRef){
        this.currentCohort=cohortRef;
    }
    resetCohortContributions(){
        this.currentCohort=null;
    }
    addNewFont(screenSelectorId,targetName,defaultFont,defaultFontSize,defaultItalic,defaultBold){
        if(!this.fontTree.has(screenSelectorId)){
            this.fontTree.set(screenSelectorId,new Map([]));
        }
        this.fontTree.get(screenSelectorId).set(targetName,new FontSettings(defaultFont,defaultFontSize,defaultItalic,defaultBold));
    }
    enableControls(){
        let thisRef=this;
        $('#fontSelector').off('change').on('change',function(){
            let currentFontSettings=thisRef.fontTree.get(`${thisRef.currentScreenName}FontTargetSelector`).get(thisRef.currentTargetName);
            currentFontSettings.font=this.value;
            thisRef.triggerFontAdjustment();
        });
        $('#fontSizeSelector').off('change').on('change',function(){
            let currentFontSettings=thisRef.fontTree.get(`${thisRef.currentScreenName}FontTargetSelector`).get(thisRef.currentTargetName);
            currentFontSettings.fontSize=this.value;
            thisRef.triggerFontAdjustment();
        });
        $('#boldFontSettingButton').off('click').on('click',function(){
            let currentFontSettings=thisRef.fontTree.get(`${thisRef.currentScreenName}FontTargetSelector`).get(thisRef.currentTargetName);
            if(currentFontSettings.isBold){
                $(this).removeClass("active");
                currentFontSettings.isBold=false;
            }else{
                $(this).addClass("active");
                currentFontSettings.isBold=true;
            }
            thisRef.triggerFontAdjustment();
        });
        $('#italicFontSettingButton').off('click').on('click',function(){
            let currentFontSettings=thisRef.fontTree.get(`${thisRef.currentScreenName}FontTargetSelector`).get(thisRef.currentTargetName);
            if(currentFontSettings.isItalic){
                $(this).removeClass("active");
                currentFontSettings.isItalic=false;
            }else{
                $(this).addClass("active");
                currentFontSettings.isItalic=true;
            }
            thisRef.triggerFontAdjustment();
        });
    }
    triggerFontAdjustment(){
        if(this.currentScreenName==="variantView"){
            this.variantViewFontAdjustment(this.currentTargetName);
        }else if(this.currentScreenName==="singlePhenotypeExpression"){
            this.singlePhenotypeExpressionFontAdjustment();
        }else if(this.currentScreenName==="survival"){
            this.survivalFontAdjustment();
        }else if(this.currentScreenName==="flexiblePlot"){
            this.flexiblePlotFontAdjustment(this.currentTargetName);
        }else if(this.currentScreenName==="heatmap"){
            this.heatmapFontAdjustment(this.currentTargetName);
        }else if(this.currentScreenName==="volcano"){
            this.volcanoPlotFontAdjustment(this.currentTargetName);
        }
    }
    setAvailableFontSettings(screenName){
        let thisRef=this;
        this.currentScreenName=screenName;
        $('#variantViewFontTargetSelector').css('display','none');
        $('#singlePhenotypeExpressionFontTargetSelector').css('display','none');
        $('#survivalFontTargetSelector').css('display','none');
        $('#flexiblePlotFontTargetSelector').css('display','none');
        $('#heatmapFontTargetSelector').css('display','none');
        $('#volcanoFontTargetSelector').css('display','none');
        $('#commonFontControls').css('display','none');
        $(`#${this.currentScreenName}FontTargetSelector`)
            .css('display','inline')
            .off("change")
            .val("-1")
            .on("change",function () {
                if(this.value!=="-1"){
                    thisRef.currentTargetName=this.value;
                    let currentFont=thisRef.fontTree.get(`${thisRef.currentScreenName}FontTargetSelector`).get(thisRef.currentTargetName);
                    $('#fontSelector').val(currentFont.font);
                    $('#fontSizeSelector').val(currentFont.fontSize);
                    if(currentFont.isBold){
                        $('#boldFontSettingButton').addClass("active");
                    }else{
                        $('#boldFontSettingButton').removeClass("active");
                    }
                    if(currentFont.isItalic){
                        $('#italicFontSettingButton').addClass("active");
                    }else{
                        $('#italicFontSettingButton').removeClass("active");
                    }
                    $('#commonFontControls').css('display','inline');
                }
            });
    }
    variantViewFontAdjustment(target){
        if(this.currentCohort===null){
            return;
        }
        if(target==="title"){
            this.currentCohort.plotTitle(this.currentCohort.currentSubcohortIndex,this.currentCohort.selectedDiffSubcohortIndex);
        }else if(target==="chromosomeLabels"){
            this.currentCohort.wheelManager.horizontalAxisGenerator.generate();
        }else if(target==="verticalAxisLabels"){
            this.currentCohort.wheelManager.replotVerticalAxis();
        }else if(target==="horizontalAxisLabels"){
            this.currentCohort.wheelManager.horizontalAxisGenerator.generate();
        }else if(target==="cytobandAndGeneLabels"){
            this.currentCohort.wheelManager.replotGeneLabels();
            this.currentCohort.vizManager.adjustVdjMarkerFont();
        }
    }
    singlePhenotypeExpressionFontAdjustment(){
        if(this.currentCohort===null){
            return;
        }
        this.currentCohort.singlePhenotypePlotManager.resetPlots();
    }
    survivalFontAdjustment(){
        if(this.currentCohort===null){
            return;
        }
        this.currentCohort.survivalPlotManager.resetKaplanMeier();
        this.currentCohort.survivalPlotManager.plotKaplanMeier();
    }
    flexiblePlotFontAdjustment(target){
        if(this.currentCohort===null){
            return;
        }
        if(target==="donorLabels"){
            this.currentCohort.flexiblePlotManager.remarkDonors();
        }else if(target==="legendLabels"){
            this.currentCohort.flexiblePlotManager.addLegend();
        }else{
            this.currentCohort.flexiblePlotManager.adjustPlotSupporters();
        }
    }
    heatmapFontAdjustment(target){
        if(this.currentCohort===null){
            return;
        }
        if(target==="donorLabels"){
            this.currentCohort.heatmapManager.remarkDonors();
        }else{
            this.currentCohort.heatmapManager.remarkPhenotypes();
        }
    }
    volcanoPlotFontAdjustment(target){
        if(this.currentCohort===null){
            return;
        }
        let methodToCall="";
        if(target==="title"){
            methodToCall="plotTitle";
        }else if(target==="markedElementLabels"){
            methodToCall="replotAllMarked";
        }else if(target==="xAxisLabels"){
            methodToCall="plotAxis";
        }else if(target==="xAxisTitle"){
            methodToCall="plotAxis";
        }else if(target==="yAxisLabels"){
            methodToCall="plotAxis";
        }else if(target==="yAxisTitle"){
            methodToCall="plotAxis";
        }else{
            return;
        }
        if(this.currentCohort.variantGeneExpressionVolcano!==null){
            if(this.currentCohort.variantGeneExpressionVolcano.volcanoSVG!==null){
                this.currentCohort.variantGeneExpressionVolcano[methodToCall]();
            }
        }
        if(this.currentCohort.subcohortGeneExpressionVolcano!==null){
            if(this.currentCohort.subcohortGeneExpressionVolcano.volcanoSVG!==null){
                this.currentCohort.subcohortGeneExpressionVolcano[methodToCall]();
            }
        }
        if(this.currentCohort.correlationGeneExpressionVolcano!==null){
            if(this.currentCohort.correlationGeneExpressionVolcano.volcanoSVG!==null){
                this.currentCohort.correlationGeneExpressionVolcano[methodToCall]();
            }
        }
        if(this.currentCohort.subcohortMutexVolcano!==null){
            if(this.currentCohort.subcohortMutexVolcano.volcanoSVG!==null){
                this.currentCohort.subcohortMutexVolcano[methodToCall]();
            }
        }
        if(this.currentCohort.variantRppaExpressionVolcano!==null){
            if(this.currentCohort.variantRppaExpressionVolcano.volcanoSVG!==null){
                this.currentCohort.variantRppaExpressionVolcano[methodToCall]();
            }
        }
        if(this.currentCohort.subcohortRppaExpressionVolcano!==null){
            if(this.currentCohort.subcohortRppaExpressionVolcano.volcanoSVG!==null){
                this.currentCohort.subcohortRppaExpressionVolcano[methodToCall]();
            }
        }
    }
}