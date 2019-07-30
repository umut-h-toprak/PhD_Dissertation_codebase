export class TsvExportManager {
    constructor() {
        this.currentCohort=null;
        this.currentTargetName="-1";
    }
    registerCohort(cohortRef){
        this.currentCohort=cohortRef;
    }
    resetCohortContributions(){
        this.currentCohort=null;
    }

    triggerTextExport(){
        if(this.currentScreenName==="variantView"){
            this.variantViewTextExport();
        }else if(this.currentScreenName==="singlePhenotypeExpression"){
            this.singlePhenotypeExpressionTextExport();
        }else if(this.currentScreenName==="survival"){
            this.survivalTextExport();
        }else if(this.currentScreenName==="metadata"){
            this.metadataTextExport();
        }else if(this.currentScreenName==="flexiblePlot"){
            this.flexiblePlotTextExport();
        }else if(this.currentScreenName==="heatmap"){
            this.heatmapTextExport();
        }else if(this.currentScreenName==="volcano"){
            this.volcanoTextExport();
        }
    }
    setAvailableExportSettings(screenName){
        let thisRef=this;
        this.currentScreenName=screenName;
        $('#variantViewTsvExportControls').css('display','none');
        $('#singlePhenotypeExpressionTsvExportControls').css('display','none');
        $('#survivalTsvExportControls').css('display','none');
        $('#metadataTsvExportControls').css('display','none');
        $('#flexiblePlotTsvExportControls').css('display','none');
        $('#volcanoTsvExportControls').css('display','none');
        $('#commonTsvExportControls').css('display','none');
        $(`#${this.currentScreenName}TsvExportControls`).css('display','inline');
        $(`#${this.currentScreenName}TsvExportTargetSelector`)
            .off("change")
            .val("-1")
            .on("change",function () {
                thisRef.currentTargetName=this.value;
                if(this.value!=="-1"){
                    $('#commonTsvExportControls').css('display','inline');
                }else{
                    $('#commonTsvExportControls').css('display','none');
                }
            });
        $('#tsvExportSubmit').off('click').on('click',()=>{
            this.triggerTextExport();
        });
    }
    variantViewTextExport(){
        if(this.currentCohort===null){
            return;
        }
        if(this.currentTargetName==="wheel1Recurrence"){
            this.finalExport(this.currentCohort.wheelManager.textExport(0),`${this.currentCohort.cohortName}_wheel1.tsv`);
        }else if(this.currentTargetName==="wheel2Recurrence"){
            this.finalExport(this.currentCohort.wheelManager.textExport(1),`${this.currentCohort.cohortName}_wheel2.tsv`);
        }else if(this.currentTargetName==="wheel3Recurrence"){
            this.finalExport(this.currentCohort.wheelManager.textExport(2),`${this.currentCohort.cohortName}_wheel3.tsv`);
        }else if(this.currentTargetName==="wheel4Recurrence"){
            this.finalExport(this.currentCohort.wheelManager.textExport(3),`${this.currentCohort.cohortName}_wheel4.tsv`);
        }else if(this.currentTargetName==="visibleSv"){
            this.finalExport(this.currentCohort.vizManager.textExport("sv"),`${this.currentCohort.cohortName}_svs.tsv`);
        }else if(this.currentTargetName==="visibleSmallVar"){
            this.finalExport(this.currentCohort.vizManager.textExport("smallVar"),`${this.currentCohort.cohortName}_smallVars.tsv`);
        }
    }
    metadataTextExport(){
        if(this.currentCohort===null){
            return;
        }
        this.finalExport(this.currentCohort.cohortMetadata.textExport(),`${this.currentCohort.cohortName}_cohortMetadata.tsv`);
    }
    flexiblePlotTextExport(){
        if(this.currentCohort===null){
            return;
        }
        this.finalExport(this.currentCohort.flexiblePlotManager.textExport(),`${this.currentCohort.flexiblePlotManager.getTitleChunks().join('.')}.tsv`);
    }
    heatmapTextExport(){
        //TODO:not implemented
        // if(this.currentCohort===null){
        //     return;
        // }
        // this.finalExport(this.currentCohort.heatmapManager.textExport(),`${this.currentCohort.heatmapManager.getTitleChunks().join('.')}.tsv`);
    }
    volcanoTextExport(){
        if(this.currentCohort===null){
            return;
        }
        let currentVolcano=this.currentCohort.determineCurrentVolcano();
        if(currentVolcano!==null){
            this.finalExport(currentVolcano.textExport(),`${currentVolcano.volcanoTitle}.tsv`);
        }
    }
    singlePhenotypeExpressionTextExport(){
        //TODO:not implemented
        // if(this.currentCohort===null){
        //     return;
        // }
        // this.finalExport(this.currentCohort.singlePhenotypePlotManager.textExport(),`${this.currentCohort.singlePhenotypePlotManager.getTitleChunks().join('.')}.tsv`);
    }
    survivalTextExport(){
        //TODO:not implemented
        // if(this.currentCohort===null){
        //     return;
        // }
        // this.finalExport(this.currentCohort.survivalPlotManager.textExport(),`${this.currentCohort.survivalPlotManager.getTitleChunks().join('.')}.tsv`);
    }
    finalExport(data,targetFilename){
        data[0][0]="data:text/csv;charset=utf-8,"+data[0][0];
        let csvContent = data.map(x=>x.join('\t')).join("\n");
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", targetFilename);
        document.body.appendChild(link);
        setTimeout(()=>{$(`#${link.id}`)},120000);
        link.click();
    }
}