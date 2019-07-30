export class VariantVolcanoAnalysisHelper {
    constructor(commonSettings,references,cohortMetadata,selectionManager,volcanoPhenotype,validVariantTypes,testName){
        this.commonSettings=commonSettings;
        this.selectionManager=selectionManager;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.volcanoPhenotype=volcanoPhenotype;
        this.validVariantTypes=VariantVolcanoAnalysisHelper.generateComparisonCombinations(validVariantTypes);
        this.testName=testName;
        this.truePhenotype=this.volcanoPhenotype.replace('Expression','');
        this.truePhenotype=this.truePhenotype.replace(this.truePhenotype[0], this.truePhenotype[0].toLowerCase());

        this.currentBatchExpressions=new Map();
        this.currentBatchVariants=new Map();
        this.currentExpressions=new Map();
        this.currentVariants=new Map();
        this.currentExpressionsSelected=new Map();
        this.currentExpressionsInverted=new Map();
        this.currentSwitchedDonors=new Set();
        this.currentBestPval=1;
    }
    launchBatchAnalysis(batchIndex){
        this.reset();
    }
    launchSinglePhenotypeAnalysis(bioId,fromBatch){
        if(fromBatch){
            this.currentBestPval=1;
        }else{
            this.reset();
        }

    }
    reset(){
        this.currentBatchExpressions.clear();
        this.currentBatchVariants.clear();

        this.currentExpressions.clear();
        this.currentVariants.clear();

        this.currentExpressionsSelected.clear();
        this.currentExpressionsInverted.clear();
        this.currentSwitchedDonors.clear();
        this.currentBestPval=1;
    }
    getBatchExpressions(batchIndex){
        let keysToSearchRaw="*";
        if(batchIndex!==-1){
            let genes = this.references.geneBatchInfo.get(batchIndex);
            keysToSearchRaw=genes.join(',');
        }
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDbPOST.php`,
            type: 'POST',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: `${thisRef.truePhenotype}Expressions`,
                columnsToSelect: "*",
                keyColumn: thisRef.truePhenotype,
                keysToSearchRaw: keysToSearchRaw
            }),
            error: function(err){
                thisRef.commonSettings.releaseLock();
                console.error(err);
            },
            success: function(rawData){
                1
            }
        });
    }
    getSingleExpressions(){

    }
    getBatchVariants(batchIndex){

    }
    getSingleVariants(){

    }
    checkSwitchingValidity(){
        if(this.testName!=="Kw" && this.testName!=="Ks"){
            return false;
        }
        return false;
    }
    switchOneDonor() {

    }
    static generateComparisonCombinations(){

    }
}