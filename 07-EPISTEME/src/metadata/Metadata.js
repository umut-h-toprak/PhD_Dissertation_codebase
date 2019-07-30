import {MetadataEntry} from "./MetadataEntry";
import {switchElements} from "../Utils";
import {event as d3Xevent, select as d3Xselect} from "d3";
import {scaleLinear as d3XscaleLinear} from "d3-scale";
import {axisLeft as d3XaxisLeft} from "d3-axis";
import {ComplexSelectionTreeNode} from "./ComplexSelectionTreeNode";

export class Metadata {
    constructor(commonSettings,references,selectionManager,cohortName,textExportManager){
        this.commonSettings=commonSettings;
        this.references=references;
        this.selectionManager=selectionManager;
        this.cohortName=cohortName;
        this.textExportManager=textExportManager;
        this.metadata=[];
        this.maxIndex=0;
        this.possibleMetadataColumns=new Map();
        this.possibleMetadataColumnsReverse=new Map();
        this.metadataDataTypes=new Map();
        this.metadataDataPossibleValues=new Map();
        this.categoricalColumnsUsedForSubcohorting=new Set();
        this.donors=new Set();
        this.svAvailable=0;
        this.cnvAvailable=0;
        this.smallVarAvailable=0;
        this.geneExpressionAvailable=0;
        this.rppaExpressionAvailable=0;
        this.methylomeArrayAvailable=0;
        this.survivalAvailable=0;
        this.anyVariantAvailable=0;

        this.smallVarAvailableDonors=new Set();
        this.anyVariantAvailableDonors=new Set();
        this.geneExpressionAvailableDonors=new Set();
        this.rppaExpressionAvailableDonors=new Set();
        this.methylomeArrayAvailableDonors=new Set();
        this.survivalAvailableDonors=new Set();
    }
    addPossibleMetadataColumn(columnName){
        if(!this.possibleMetadataColumns.has(columnName)){
            this.possibleMetadataColumns.set(columnName,this.maxIndex);
            this.possibleMetadataColumnsReverse.set(this.maxIndex,columnName);
            const dataType=this.metadataDataTypes.get(columnName);
            if(dataType==="categorical"||dataType==="multicategorical"){
                this.updateCategoricalToSelectionControls();
            }
            this.maxIndex+=1;
            $('#flexiblePlotAddNewestMetadataColumn').click();
        }
    }
    getCohortTitle(){
        return `${this.cohortName}(${this.donors.size})`;
    }
    getCohortTitleExpressionMode(phenotype){
        if(phenotype.startsWith("Gene")){
            return `${this.cohortName}(${this.geneExpressionAvailable}/${this.donors.size})`;
        }else if(phenotype.startsWith("Rppa")){
            return `${this.cohortName}(${this.rppaExpressionAvailable}/${this.donors.size})`;
        }
    }
    getCohortTitleCorrelationMode(phenotype,currentSubcohortDonors,currentSubcohortName,anchorGeneId){
        let rawPhenotype=phenotype.replace("Expression","")==="Gene"?"RNA":"Rppa";
        let group1RealSize=0;
        let fullCohortRealSize=0;
        currentSubcohortDonors.forEach((donor)=>{
            if(this.metadata[donor][rawPhenotype]==="+"){
                group1RealSize+=1;
            }
        });
        this.donors.forEach((donor)=>{
            if(this.metadata[donor][rawPhenotype]==="+"){
                fullCohortRealSize+=1;
            }
        });
        if(this.donors.size!==currentSubcohortDonors.size){
            return `${this.cohortName}(${fullCohortRealSize}/${this.donors.size}) ${currentSubcohortName}:${group1RealSize}/${currentSubcohortDonors.size} Correlations vs ${this.references.genes.get(anchorGeneId).geneName}`;
        }else{
            return `${this.cohortName}(${fullCohortRealSize}/${this.donors.size}) Correlations vs ${this.references.genes.get(anchorGeneId).geneName}`;
        }

    }
    getCohortTitleSubcohortExpressionMode(phenotype,group1Donors,group2Donors,group1Name,group2Name){
        let rawPhenotype=phenotype.replace("Expression","")==="Gene"?"RNA":"Rppa";
        let group1RealSize=0;
        let group2RealSize=0;
        group1Donors.forEach((donor)=>{
           if(this.metadata[donor][rawPhenotype]==="+"){
               group1RealSize+=1;
           }
        });
        group2Donors.forEach((donor)=>{
           if(this.metadata[donor][rawPhenotype]==="+"){
               group2RealSize+=1;
           }
        });
        return `${this.cohortName}(${this.donors.size}) ${group1Name}: ${group1RealSize}/${group1Donors.size} vs ${group2Name}: ${group2RealSize}/${group2Donors.size}`;
    }
    getCohortTitleSubcohortMutexMode(group1Donors,group2Donors,group1Name,group2Name){
        return `${this.cohortName}(${this.donors.size}) ${group1Name}: ${group1Donors.size} vs ${group2Name}: ${group2Donors.size}`;
    }
    fetchCohortInformation(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromFile.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort:thisRef.cohortName,
                suffix:"cohortInformation",
            }),
            success: function(data){
                data.forEach((x)=>{
                    thisRef.diseaseNameAlternatives=x.diseaseNameAlternatives.split(',');
                    thisRef.cohortAllIndelsTable=x.cohortAllIndelsTable;
                    thisRef.cohortAllSnvsTable=x.cohortAllSnvsTable;
                    thisRef.cohortAllSvsTable=x.cohortAllSvsTable;
                    thisRef.cohortAllSvsMidSizeTable=x.cohortAllSvsMidSizeTable;
                    thisRef.geneRecurrenceTable=x.geneRecurrenceTable;
                    thisRef.tadRecurrenceCnvTable=x.tadRecurrenceCnvTable;
                    thisRef.tadRecurrenceSvTable=x.tadRecurrenceSvTable;
                    thisRef.tadRecurrenceIndelTable=x.tadRecurrenceIndelTable;
                    if (x.geneExpressionsTable!==undefined){
                        thisRef.geneExpressionQuantity=x.geneExpressionQuantity;
                        thisRef.geneExpressionsTable=x.geneExpressionsTable;
                        thisRef.variantGeneExpressionTable=x.geneExpressionSummaryTable;
                        thisRef.GeneExpressionCrossCorrelationsTable=x.geneExpressionCrossCorrelationsTable;
                        thisRef.variantGeneExpressionTtestTable=x.geneExpressionSummaryTtestTable;
                    }
                    if (x.rppaExpressionsTable!==undefined){
                        thisRef.rppaExpressionQuantity=x.rppaExpressionQuantity;
                        thisRef.rppaExpressionsTable=x.rppaExpressionsTable;
                        thisRef.variantRppaExpressionTable=x.rppaExpressionSummaryTable;
                        thisRef.variantRppaExpressionTtestTable=x.rppaExpressionSummaryTtestTable;
                    }


                });
                callback(null);
            },
            error: function (err) {
                console.error(err);
                callback(err);
            }
        });
    }
    fetchCohortMetadata(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromFile.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort:thisRef.cohortName,
                suffix:"cohortMetadata",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let tmpEntry=new MetadataEntry(x);
                    let anyVariant=false;
                    thisRef.metadata[tmpEntry.index]=tmpEntry;
                    $('#singleDonorSelector').append(`<option value=${tmpEntry.index}>${tmpEntry.donor}</option>`);
                    Object.entries(tmpEntry).forEach(([key, value]) =>{
                        thisRef.addPossibleMetadataColumn(key);
                    });
                    thisRef.donors.add(tmpEntry.index);
                    thisRef.selectionManager.cohortFullDonors.add(tmpEntry.index);
                    if(tmpEntry["CNV"]==='+'){
                        thisRef.cnvAvailable+=1;
                        anyVariant=true;
                    }
                    if(!thisRef.commonSettings.wesMode){
                        if(tmpEntry["SV"]==='+'){
                            thisRef.svAvailable+=1;
                            anyVariant=true;
                        }
                    }
                    if(tmpEntry["SNV"]==='+'){
                        thisRef.smallVarAvailable+=1;
                        thisRef.smallVarAvailableDonors.add(tmpEntry.index);
                        anyVariant=true;

                    }
                    if(tmpEntry["Indel"]==='+'){
                        thisRef.smallVarAvailable+=1;
                        thisRef.smallVarAvailableDonors.add(tmpEntry.index);
                        anyVariant=true;
                    }
                    if(tmpEntry["RNA"]==='+'){
                        thisRef.geneExpressionAvailable+=1;
                        thisRef.geneExpressionAvailableDonors.add(tmpEntry.index);
                    }
                    if(tmpEntry["Rppa"]==='+'){
                        thisRef.rppaExpressionAvailable+=1;
                        thisRef.rppaExpressionAvailableDonors.add(tmpEntry.index);
                    }
                    if(tmpEntry["MethylationArray"]==='+'){
                        thisRef.methylomeArrayAvailable+=1;
                        thisRef.methylomeArrayAvailableDonors.add(tmpEntry.index);
                    }
                    if(tmpEntry.survivalAvailable){
                        thisRef.survivalAvailable+=1;
                        thisRef.survivalAvailableDonors.add(tmpEntry.index);
                    }
                    if(anyVariant){
                        thisRef.anyVariantAvailable+=1;
                        thisRef.anyVariantAvailableDonors.add(tmpEntry.index);
                    }
                });
                thisRef.chooseColClasses();
                thisRef.enableControls();
                thisRef.updateCategoricalToSelectionControls();
                $('#cohortMetadataContentControl').css("display","inline");
                callback(null);
            },
            error: function (err) {
                console.error(err);
                callback(err);
            }
        });
    }
    enableControls(){
        let thisRef=this;
        let controlElements=[
            "metadataControls",
            "selectorControlsCollapseControl",
        ];
        $('#cohortMetadataContentPane')
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
                this.refreshMetadata();
                $('#miniSelectionBuilderArea').empty();
                $('#complexSelectionWarningSpace').empty();
                this.textExportManager.setAvailableExportSettings("metadata");
                //$('#helpInfo').html(tutorials.Tutorials.metadataTutorial());
            });
        $('#metadataMiniSelectionColumnSelector').off('change').on('change',function(){
            if (this.value !== "Select Column"){
                $('#miniSelectionBuilderArea').empty();
                let colType=thisRef.metadataDataTypes.get(this.value);
                if(colType==="categorical"){
                    thisRef.launchCategoricalMiniSelectionHelper(this.value);
                }else if(colType==="multicategorical"){
                    thisRef.launchMultiCategoricalMiniSelectionHelper(this.value);
                }else if(colType==="numeric"){
                    thisRef.launchNumericMiniSelectionHelper(this.value);
                }
            }
        });
    }
    setupComplexSelectionQueryBuilder(){
        $('#complexSelectionWarningSpace').empty().append('Caution: the "NOT-" mode include cases with missing data or NaNs');
        let thisRef=this;
        if(this.selectionManager.registeredSubcohortNames.size===2){
            return;
        }
        if(this.selectionManager.registeredSubcohortNames.size>3){
            $('#complexSelectionQueryBuilder').queryBuilder('destroy');
        }
        $('#complexSelectionCollapseControl').css('display','inline');
        let subcohortBuilderList={};
        this.selectionManager.registeredSubcohortNames.forEach((subcohortName,subcohortIndex,map)=>{
            subcohortBuilderList[subcohortIndex]=subcohortName
        });
        $('#complexSelectionQueryBuilder').empty().queryBuilder({
            filters: [
                {
                    id: 'subcohort',
                    label: 'Subcohort',
                    type: 'integer',
                    input: 'select',
                    values: subcohortBuilderList,
                    operators: ['equal']
                }
            ],
        });
        $('#complexSelectionName').off('change').on('change',function () {
            if(thisRef.selectionManager.registeredSubcohortNamesSet.has(this.value)){
                $('#complexSelectionQueryBuilderGet').css('display','none');
            }else{
                $('#complexSelectionQueryBuilderGet').css('display','inline');
            }
        });
        $('#complexSelectionQueryBuilderReset').off('click').on('click', ()=> {
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            $('#complexSelectionQueryBuilder').queryBuilder('reset');
            this.commonSettings.fastRelease();
        });
        $('#complexSelectionQueryBuilderGet').css('display','none').off('click').on('click', ()=> {
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            let selectionTree= new ComplexSelectionTreeNode($('#complexSelectionQueryBuilder').queryBuilder('getRules'),this.selectionManager);
            selectionTree.compress();
            let allUnknownCases=new Set();
            for(let i=0;i<selectionTree.allUsedSelections.length;++i){
                const selectionIndex=selectionTree.allUsedSelections[i];
                if(this.selectionManager.subcohortIndexToItsUnknown.has(selectionIndex)){
                    const unknownSelectionIndex=this.selectionManager.subcohortIndexToItsUnknown.get(selectionIndex);
                    this.selectionManager.registeredSubcohorts.get(unknownSelectionIndex).forEach((donorIndex)=>{
                        allUnknownCases.add(donorIndex);
                    });
                }
            }
            const subcohortNameHandle=$('#complexSelectionName');
            const newSubcohortName=subcohortNameHandle.val();
            subcohortNameHandle.empty();
            const res = this.finalizeSelection(
                new Set([...selectionTree.donorIndices].filter(x => !allUnknownCases.has(x))),
                allUnknownCases,
                newSubcohortName,
                "complexSelectionWarningSpace");
            this.commonSettings.releaseLock();
        });
    }
    updateSelectionToCategoricalControls(){
        $('#selectionToCategoricalCollapseControl').css('display','inline');
        $('#selectionToCategoricalCheckboxes').empty();
        this.selectionManager.registeredSubcohortNames.forEach((subcohortName,subcohortIndex,map)=>{
            if(!this.selectionManager.fullCohortSubcohortIndices.has(subcohortIndex)){
                $('#selectionToCategoricalCheckboxes').append(`
                    <label class="custom-control custom-checkbox active">
                        <input id="includeSelection${subcohortIndex}" type="checkbox" class="custom-control-input">
                        <span class="custom-control-indicator"></span>
                        <span class="custom-control-description">${subcohortName}</span>
                    </label><br>
                `);
            }
        });
        $('#selectionToCategoricalSubmit').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            let includedSelections=[];
            let includedSelectionNames=[];
            this.selectionManager.registeredSubcohortNames.forEach((subcohortName,subcohortIndex,map)=>{
                if($(`#includeSelection${subcohortIndex}`).is(':checked')){
                    includedSelections.push(subcohortIndex);
                    includedSelectionNames.push(subcohortName);
                }
            });
            this.createCategoricalVariableFromSelections(includedSelections,includedSelectionNames);
            this.refreshMetadata();
            this.commonSettings.releaseLock();
        });
    }
    updateCategoricalToSelectionControls(){
        $('#categoricalToSelectionCollapseControl').css('display','inline');
        let categoricalToSelectionCollapseHandle=$('#categoricalToSelectionCollapse');
        categoricalToSelectionCollapseHandle.empty();
        let columnNamesToUse=[];
        let columnIndicesToUse=[];
        this.possibleMetadataColumns.forEach((columnIndex,columnName,map)=>{
            // console.log(columnIndex,columnName)
            if(!columnName.startsWith("Selection_")){
                if(!this.categoricalColumnsUsedForSubcohorting.has(columnIndex)){
                    const dataType=this.metadataDataTypes.get(columnName);
                    if(dataType==="categorical"||dataType==="multicategorical"){
                        // console.log(columnIndex,columnName,dataType,"YES")
                        columnNamesToUse.push(columnName);
                        columnIndicesToUse.push(columnIndex);
                    }
                }
            }
        });
        const numColumns=columnNamesToUse.length;
        for(let i=0;i<numColumns;++i){
            const columnName=columnNamesToUse[i];
            const columnIndex=columnIndicesToUse[i];
            categoricalToSelectionCollapseHandle.append(`
                            <button id="categoricalToSelectionSubmit_${columnIndex}" type="button" class="btn btn-success">${columnName}</button>
                        `);
        }
        for(let i=0;i<numColumns;++i){
            const columnName=columnNamesToUse[i];
            const columnIndex=columnIndicesToUse[i];
            $(`#categoricalToSelectionSubmit_${columnIndex}`).off('click').on('click',()=>{
                this.commonSettings.lock();
                this.categoricalColumnsUsedForSubcohorting.add(columnIndex);
                this.createSelectionsFromMetadataColumn(columnName);
                this.refreshMetadata();
                this.commonSettings.releaseLock();
            });
        }
    }
    createSelectionsFromMetadataColumn(columnName){
        let unknownDonorIndices=this.getMissingDonors(columnName);
        let validIndices=[];
        for(let i=0;i<this.metadata.length;++i){
            if(!unknownDonorIndices.has(i)){
                validIndices.push(i);
            }
        }
        const possibleValuesForCategorical=this.metadataDataPossibleValues.get(columnName);
        possibleValuesForCategorical.forEach((categoricalValue)=>{
            const selectionName=`${columnName}_${categoricalValue}`;
            let selectedDonorIndices=new Set();
            for(let i=0;i<validIndices.length;++i){
                const donorIndex=validIndices[i];
                const multiVals=this.metadata[donorIndex][columnName].split(';');
                for(let j=0;j<multiVals.length;++j){
                    if(categoricalValue===multiVals[j]){
                        selectedDonorIndices.add(this.metadata[donorIndex].index);
                        break;
                    }
                }
            }
            if(this.finalizeSingleSelection(selectedDonorIndices, unknownDonorIndices, selectionName)){
                this.updateSelectionToCategoricalControls();
            }
        });
    }
    createCategoricalVariableFromSelections(includedSelections,includedSelectionNames){
        const selectionName=includedSelectionNames.join(';');
        for(let i=0;i<includedSelections.length;++i){
            this.selectionManager.metadataColumnsRelatedToSubcohorts.get(includedSelections[i]).push(selectionName);
        }
        this.metadataDataPossibleValues.set(`Selection_${selectionName}`,new Set());
        let anyMultiHit=false;
        for(let i=0;i<this.metadata.length;++i){
            let currentSelectionNames=[];
            for(let j=0;j<includedSelections.length;++j){
                if(this.selectionManager.registeredSubcohorts.get(includedSelections[j]).has(this.metadata[i].index)){
                    currentSelectionNames.push(includedSelectionNames[j])
                }
            }
            let currentSelectionName="other";
            if(currentSelectionNames.length>0){
                currentSelectionName=currentSelectionNames.join(';');
                if(currentSelectionNames>0){
                    anyMultiHit=true;
                }
            }
            this.metadata[i][`Selection_${selectionName}`]=currentSelectionName;
            this.metadataDataPossibleValues.get(`Selection_${selectionName}`).add(currentSelectionName);
        }
        if(!anyMultiHit){
            this.metadataDataTypes.set(`Selection_${selectionName}`,"categorical");
        }else{
            this.metadataDataTypes.set(`Selection_${selectionName}`,"multicategorical");
        }
        this.addPossibleMetadataColumn(`Selection_${selectionName}`);
        this.updateSelectionToCategoricalControls();
    }
    launchCategoricalMiniSelectionHelper(columnName){
        let thisRef=this;
        let categoricalSelectionsHtmlEntries=[];
        let possibleValueToId=new Map();
        let possibleValueId=0;
        this.metadataDataPossibleValues.get(columnName).forEach((possibleValue)=>{
            possibleValueToId.set(possibleValue,possibleValueId);
            categoricalSelectionsHtmlEntries.push(`<div class="input-group">
                            <label class="custom-control custom-checkbox">
                                <input id="metadataAllow${possibleValueId}" type="checkbox" class="custom-control-input">
                                <span class="custom-control-indicator"></span>
                                <span class="custom-control-description">${possibleValue}</span>
                            </label>
                        </div>`);
            possibleValueId+=1;
        });
        categoricalSelectionsHtmlEntries.push(`
                    <div class="row" id="metadataNumericSelectionModeSelectorGroup">
                        <div class="col-md-8">
                            <input type="text" class="form-control" id="metadataSelectionName" placeholder="Name Selection (enter to confirm)">
                        </div>
                        <div class="col-md-4">
                            <button id="metadataSubmitCategoricalChoices" type="button" class="btn btn-secondary btn" style="display: none;">Submit choices</button>
                        </div>
                    </div>`);
        $('#miniSelectionBuilderArea').append(categoricalSelectionsHtmlEntries.join(''));
        $('#metadataSelectionName').off('change').on('change',function(){
            if(thisRef.selectionManager.registeredSubcohortNamesSet.has(this.value)){
                $('#metadataSubmitCategoricalChoices').css('display','none');
            }else{
                $('#metadataSubmitCategoricalChoices').css('display','inline');
            }
        });
        $('#metadataSubmitCategoricalChoices').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            let selectionName=$('#metadataSelectionName').val();
            let allowedValues=new Set();
            this.metadataDataPossibleValues.get(columnName).forEach((possibleValue)=>{
                let possibleValueId=possibleValueToId.get(possibleValue);
                if($(`#metadataAllow${possibleValueId}`).is(':checked')){
                    allowedValues.add(possibleValue);
                }
            });
            const currentSubcohort=parseInt($("#miniSelectionBuilderSubgroupSelector").val());
            const validIndicesSet=this.selectionManager.registeredSubcohorts.get(currentSubcohort);
            let validIndices=[];
            let unknownDonorIndices=this.getMissingDonors(columnName);
            for(let i=0;i<this.metadata.length;++i){
                if(validIndicesSet.has(i)){
                    validIndices.push(i);
                }else{
                    unknownDonorIndices.add(this.metadata[i].index);
                }
            }
            let selectedDonorIndices=new Set();
            for(let q=0;q<validIndices.length;++q){
                let i= validIndices[q];
                if(allowedValues.has(this.metadata[i][columnName])){
                    selectedDonorIndices.add(this.metadata[i].index);
                }
            }
            this.finalizeSelection(selectedDonorIndices,unknownDonorIndices,selectionName,"miniSelectionBuilderArea");
            this.commonSettings.releaseLock();
        });
    }
    launchMultiCategoricalMiniSelectionHelper(columnName){
        let thisRef=this;
        let multiCategoricalSelectionsHtmlEntries=[];
        let possibleValueToId=new Map();
        let possibleValueId=0;
        this.metadataDataPossibleValues.get(columnName).forEach((possibleValue)=>{
                possibleValueToId.set(possibleValue,possibleValueId);
                multiCategoricalSelectionsHtmlEntries.push(`<div class="input-group">
                            <label class="custom-control custom-checkbox">
                                <input id="metadataAllow${possibleValueId}" type="checkbox" class="custom-control-input">
                                <span class="custom-control-indicator"></span>
                                <span class="custom-control-description">${possibleValue}</span>
                            </label>
                        </div>`);
                possibleValueId+=1;
        });
        multiCategoricalSelectionsHtmlEntries.push(`
                    <div class="row" id="metadataNumericSelectionModeSelectorGroup">
                        <div class="col-md-8">
                            <input type="text" class="form-control" id="metadataSelectionName" placeholder="Name Selection (enter to confirm)">
                        </div>
                        <div class="col-md-4">
                            <button id="metadataSubmitCategoricalChoices" type="button" class="btn btn-secondary btn" style="display: none;">Submit choices</button>
                        </div>
                    </div>`);
        $('#miniSelectionBuilderArea').append(multiCategoricalSelectionsHtmlEntries.join(''));
        $('#metadataSelectionName').off('change').on('change',function(){
            if(thisRef.selectionManager.registeredSubcohortNamesSet.has(this.value)){
                $('#metadataSubmitCategoricalChoices').css('display','none');
            }else{
                $('#metadataSubmitCategoricalChoices').css('display','inline');
            }
        });
        $('#metadataSubmitCategoricalChoices').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            let selectionName=$('#metadataSelectionName').val();
            let allowedValues=new Set();
            this.metadataDataPossibleValues.get(columnName).forEach((possibleValue)=>{
                let possibleValueId=possibleValueToId.get(possibleValue);
                if($(`#metadataAllow${possibleValueId}`).is(':checked')){
                    allowedValues.add(possibleValue);
                }
            });
            const currentSubcohort=parseInt($("#miniSelectionBuilderSubgroupSelector").val());
            const validIndicesSet=this.selectionManager.registeredSubcohorts.get(currentSubcohort);
            let validIndices=[];
            let unknownDonorIndices=this.getMissingDonors(columnName);
            for(let i=0;i<this.metadata.length;++i){
                if(validIndicesSet.has(i)){
                    validIndices.push(i);
                }else{
                    unknownDonorIndices.add(this.metadata[i].index);
                }
            }
            let selectedDonorIndices=new Set();
            for(let q=0;q<validIndices.length;++q){
                let i= validIndices[q];
                let multiVals=this.metadata[i][columnName].split(';');
                for(let j=0;j<multiVals.length;++j){
                    if(allowedValues.has(multiVals[j])){
                        selectedDonorIndices.add(this.metadata[i].index);
                        break;
                    }
                }
            }
            this.finalizeSelection(selectedDonorIndices,unknownDonorIndices,selectionName,"miniSelectionBuilderArea");
            this.commonSettings.releaseLock();
        });
    }
    launchNumericMiniSelectionHelper(columnName){
        let thisRef=this;
        let numericSelectionsHtmlEntries=[];
        numericSelectionsHtmlEntries.push(`
                <div class="row" id="metadataNumericSelectionModeSelectorGroup">
                    <div class="col-md-6">
                        <select class="form-control" title="metadataNumericSelectionModeSelection" id="metadataNumericSelectionModeSelector">
                            <option value="0"><</option>
                            <option value="1"><=</option>
                            <option value="2">=</option>
                            <option value="3">>=</option>
                            <option value="4">></option>
                            <option value="5">between</option>
                        </select>
                    </div>
                    <div class="col-md-6">        
                        <label class="custom-control custom-checkbox">
                                <input id="metadataAllowNans" type="checkbox" class="custom-control-input">
                                <span class="custom-control-indicator"></span>
                                <span class="custom-control-description">Allow NaNs/empty values</span>
                            </label>
                    </div>
                </div>`);
        numericSelectionsHtmlEntries.push(`
                    <div class="input-group" id="numericSelectionPossibleValuesSelectorGroup">
                        <select class="form-control" title="numericSelectionPossibleValuesSelection" id="numericSelectionPossibleValuesSelector">
                        </select>
                    </div>`);
        numericSelectionsHtmlEntries.push(`
                    <div class="input-group" id="numericSelectionPossibleValuesSecondarySelectorGroup" style="display: none;">
                        <select class="form-control" title="numericSelectionPossibleValuesSecondarySelection" id="numericSelectionPossibleValuesSecondarySelector">
                        </select>
                    </div>`);
        numericSelectionsHtmlEntries.push(`<div id="numericHelperPlotContainer" class="container-fluid"></div>`);
        numericSelectionsHtmlEntries.push(`
                    <div class="row" id="metadataNumericSelectionModeSelectorGroup">
                        <div class="col-md-8">
                            <input type="text" class="form-control" id="metadataSelectionName" placeholder="Name Selection (enter to confirm)">
                        </div>
                        <div class="col-md-4">
                            <button id="metadataSubmitNumericChoices" type="button" class="btn btn-secondary btn" style="display: none;">Submit choices</button>
                        </div>
                    </div>`);
        $('#miniSelectionBuilderArea').append(numericSelectionsHtmlEntries.join(''));

        let valueHelper=new Map();
        let observedValues=this.getObservedNumericValues(columnName,);
        for(let i=0;i<observedValues.length;++i){
            $('#numericSelectionPossibleValuesSelector').append(`<option value="${i}">${observedValues[i]}</option>`);
            $('#numericSelectionPossibleValuesSecondarySelector').append(`<option value="${i}">${observedValues[i]}</option>`);
            valueHelper.set(observedValues[i],i);
        }
        let currentValidValues=this.getCurrentValidValues(...Metadata.getCurrentNumericConfiguration(columnName,observedValues));
        let tmpPlotObjects = Metadata.getTmpPlotObjects(observedValues,currentValidValues);
        this.numericMiniSelectionHelperPlot(tmpPlotObjects,columnName,valueHelper);
        $('#numericSelectionPossibleValuesSelector').off("change").on("change",()=>{
            let observedValues=this.getObservedNumericValues(columnName);
            let currentValidValues=this.getCurrentValidValues(...Metadata.getCurrentNumericConfiguration(columnName,observedValues));
            let tmpPlotObjects = Metadata.getTmpPlotObjects(observedValues,currentValidValues);
            this.numericMiniSelectionHelperPlot(tmpPlotObjects,columnName,valueHelper);
        });
        $('#numericSelectionPossibleValuesSecondarySelector').off("change").on("change",()=>{
            let observedValues=this.getObservedNumericValues(columnName);
            let currentValidValues=this.getCurrentValidValues(...Metadata.getCurrentNumericConfiguration(columnName,observedValues));
            let tmpPlotObjects = Metadata.getTmpPlotObjects(observedValues,currentValidValues);
            this.numericMiniSelectionHelperPlot(tmpPlotObjects,columnName,valueHelper);
        });
        $('#metadataNumericSelectionModeSelector').off("change").on("change",function(){
            if(this.value!="5"){
                $('#numericSelectionPossibleValuesSecondarySelectorGroup').css('display','none');
            }else{
                $('#numericSelectionPossibleValuesSecondarySelectorGroup').css('display','inline');
            }
            let observedValues=thisRef.getObservedNumericValues(columnName);
            let currentValidValues=thisRef.getCurrentValidValues(...Metadata.getCurrentNumericConfiguration(columnName,observedValues));
            let tmpPlotObjects = Metadata.getTmpPlotObjects(observedValues,currentValidValues);
            thisRef.numericMiniSelectionHelperPlot(tmpPlotObjects,columnName,valueHelper);
        });
        $('#metadataSelectionName').off('change').on('change',function(){
            if(thisRef.selectionManager.registeredSubcohortNamesSet.has(this.value)){
                $('#metadataSubmitNumericChoices').css('display','none');
            }else{
                $('#metadataSubmitNumericChoices').css('display','inline');
            }
        });
        $('#metadataSubmitNumericChoices').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            let selectionName=$('#metadataSelectionName').val();
            let observedValues=this.getObservedNumericValues(columnName);
            let selectedDonorIndices=this.predictNumericalSelectionOutcome(...Metadata.getCurrentNumericConfiguration(columnName,observedValues));
            let unknownDonorIndices=this.getMissingDonors(columnName);
            if($('#metadataAllowNans').is(":checked")){
                selectedDonorIndices=selectedDonorIndices.concat(unknownDonorIndices);
                unknownDonorIndices.clear();
            }
            let selectedDonorIndicesSet=new Set(selectedDonorIndices);
            const currentSubcohort=parseInt($("#miniSelectionBuilderSubgroupSelector").val());
            const validIndicesSet=this.selectionManager.registeredSubcohorts.get(currentSubcohort);
            for(let i=0;i<this.metadata.length;++i){
                if(!validIndicesSet.has(i)){
                    unknownDonorIndices.add(this.metadata[i].index);
                    selectedDonorIndicesSet.delete(this.metadata[i].index)
                }
            }
            this.finalizeSelection(selectedDonorIndicesSet,unknownDonorIndices,selectionName,"miniSelectionBuilderArea");
            this.commonSettings.releaseLock();
        });
    }
    static getCurrentNumericConfiguration(columnName,observedValues){
        let numericSelectionMode=parseInt($('#metadataNumericSelectionModeSelector').val());
        let numericCutoffPoint=observedValues[parseInt($('#numericSelectionPossibleValuesSelector').val())];
        let numericCutoffPointSecondary=observedValues[parseInt($('#numericSelectionPossibleValuesSecondarySelector').val())];
        return [columnName,numericSelectionMode,numericCutoffPoint,numericCutoffPointSecondary];
    }
    static getTmpPlotObjects(observedValues,currentValidValues){
        let tmpPlotObjects=[];
        for(let i=0;i<observedValues.length;++i){
            tmpPlotObjects.push({
                x:i+1,
                y:observedValues[i],
                selected:currentValidValues.has(observedValues[i])
            })
        }
        return tmpPlotObjects;
    }
    getMissingDonors(columnName){
        let missingDonors=new Set();
        for(let i=0;i<this.metadata.length;++i){
            let currentValue=this.metadata[i][columnName];
            if(this.commonSettings.undefinedValues.has(currentValue)){
                missingDonors.add(this.metadata[i].index);
            }
        }
        return missingDonors;
    }
    getObservedNumericValues(columnName){
        let observedValuesPre=new Set();
        for(let i=0;i<this.metadata.length;++i){
            let currentValue=this.metadata[i][columnName];
            if(!this.commonSettings.undefinedValues.has(currentValue)){
                observedValuesPre.add(currentValue);
            }
        }
        let observedValues = Array.from(observedValuesPre);
        observedValues.sort(function(a, b) {
            if (a < b) {
                return -1;
            }
            if (a> b) {
                return 1;
            }
            return -1;
        });
        return observedValues;
    }
    getCurrentValidValues(columnName,numericSelectionMode,numericCutoffPoint,numericCutoffPointSecondary){
        let predictedSelectedIndices=new Set(this.predictNumericalSelectionOutcome(columnName,numericSelectionMode,numericCutoffPoint,numericCutoffPointSecondary));
        let validValues=new Set();
        for(let i=0;i<this.metadata.length;++i){
            let currentValue=this.metadata[i][columnName];
            if(!this.commonSettings.undefinedValues.has(currentValue)){
                if(predictedSelectedIndices.has(i)){
                    validValues.add(currentValue)
                }
            }
        }
        return validValues;
    }
    predictNumericalSelectionOutcome(columnName,numericSelectionMode,numericCutoffPoint,numericCutoffPointSecondary){
        let selectedDonorIndices=[];
        for(let i=0;i<this.metadata.length;++i){
            let currentValue=this.metadata[i][columnName];
            if(this.commonSettings.undefinedValues.has(currentValue)){
                if($('#metadataAllowNans').is(':checked')){
                    selectedDonorIndices.push(this.metadata[i].index);
                }
            }else{
                if(numericSelectionMode===0){
                    if(currentValue<numericCutoffPoint){
                        selectedDonorIndices.push(this.metadata[i].index);
                    }
                }
                else if(numericSelectionMode===1){
                    if(currentValue<=numericCutoffPoint){
                        selectedDonorIndices.push(this.metadata[i].index);
                    }
                }
                else if(numericSelectionMode===2){
                    if(currentValue===numericCutoffPoint){
                        selectedDonorIndices.push(this.metadata[i].index);
                    }
                }
                else if(numericSelectionMode===3){
                    if(currentValue>=numericCutoffPoint){
                        selectedDonorIndices.push(this.metadata[i].index);
                    }
                }
                else if(numericSelectionMode===4){
                    if(currentValue>numericCutoffPoint){
                        selectedDonorIndices.push(this.metadata[i].index);
                    }
                }
                else if(numericSelectionMode===5){
                    if(numericCutoffPoint<numericCutoffPointSecondary){
                        if(currentValue>=numericCutoffPoint && currentValue<=numericCutoffPointSecondary){
                            selectedDonorIndices.push(this.metadata[i].index);
                        }
                    }else{
                        if(currentValue>=numericCutoffPointSecondary && currentValue<=numericCutoffPoint){
                            selectedDonorIndices.push(this.metadata[i].index);
                        }
                    }
                }
            }
        }
        return selectedDonorIndices;
    }
    numericMiniSelectionHelperPlot(tmpPlotObjects,columnName,valueHelper){
        $('#numericHelperPlotContainer').empty();
        let currentWidth=$(`#rightSide`).width();
        let viewBox = `${-currentWidth*0.08} ${-currentWidth*0.03} ${currentWidth} ${currentWidth}`;
        let svg = d3Xselect('#numericHelperPlotContainer')
            .classed("svg-container", true)
            .append("svg")
            .classed("container-fluid", true)
            .classed("wrap", true)
            .classed("svg-content-responsive", true)
            .attr("viewBox", viewBox)
            .attr("id",'numericHelperPlot')
            // .attr("preserveAspectRatio", "xMaxYMin meet")
            .attr("preserveAspectRatio", "none")
            .attr("width", "100%")
            .attr("height", "100%");
        let circleGroup= svg.append("g");
        let plotSupportGroup= svg.append("g").attr("id","numericHelperPlotSupports");
        let targetWidth = $('#numericHelperPlot').width()*0.99;
        let xScale = d3XscaleLinear().domain([0, tmpPlotObjects.length]).range([0, targetWidth*0.95]);
        let maxY=0;
        tmpPlotObjects.forEach((obj)=>{
           if(obj.y>maxY){
               maxY=obj.y;
           }
        });
        let magFactor=1.25;
        if(tmpPlotObjects.length > 100){
            magFactor = 0.5;
        }else if(tmpPlotObjects.length>50){
            magFactor = 0.75;
        }
        let baseRadius = 7.25 * magFactor * 0.4;
        let yScale = d3XscaleLinear().domain([0, maxY*1.1]).range([targetWidth, targetWidth*0.05]);

        plotSupportGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", targetWidth)
            .attr("width", targetWidth)
            .style("stroke", "Black")
            .style("fill", "none")
            .style("stroke-width", 1);
        plotSupportGroup.append("g")
            .attr("class", "axis axis--y")
            .call(d3XaxisLeft(yScale).tickSize(4))
            .selectAll("text")
            .attr("y", 0)
            .attr("dy", ".1em")
            .style("font", "12px Verdana");
        circleGroup.selectAll(`.numericHelperCircles`)
            .data(tmpPlotObjects)
            .enter().append("circle")
            .attr("class", 'numericHelperCircles')
            .style('stroke', (d)=>{return d.selected ? "Red" : "Black";})
            .style('fill', (d)=>{return d.selected ? "Red" : "Black";})
            .attr("cx",(d)=>{return xScale(d.x);})
            .attr("cy",(d)=>{return yScale(d.y);})
            .attr("r",baseRadius);
        circleGroup.on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            let d = d3Xselect(d3Xevent.target).datum();
            $('#numericSelectionPossibleValuesSelector').val(valueHelper.get(d.y));
            $('#numericSelectionPossibleValuesSecondarySelector').val(valueHelper.get(d.y));
            let observedValues=this.getObservedNumericValues(columnName);
            let currentValidValues=this.getCurrentValidValues(...Metadata.getCurrentNumericConfiguration(columnName,observedValues));
            let tmpPlotObjects = Metadata.getTmpPlotObjects(observedValues,currentValidValues);
            this.numericMiniSelectionHelperPlot(tmpPlotObjects,columnName,valueHelper);
            this.commonSettings.releaseLock();
        });
    }
    createMultipleGroups(clusterDonorIndices,missingDonorIndices,sendShadingSignalLater,namePrefix,panelIndex){
        this.selectionManager.clusteringPrefixToSubcohortIndices.set(namePrefix,[]);
        const numNewGroups=clusterDonorIndices.length;
        let trueSubcohortIndices=[];
        for(let i=0;i<numNewGroups;++i) {
            const newSelectionName = `p_${panelIndex}_${namePrefix}_cluster${i + 1}`;
            const newDonorIndices = new Set(clusterDonorIndices[i]);
            const subcohortSuccess=this.finalizeSingleSelection(newDonorIndices, missingDonorIndices, newSelectionName);
            if(subcohortSuccess){
                let [selectedDonorNames,unknownDonorNames,selectedDonorNamesInverted,selectionNameUnknown,selectionNameInverted,allCreatedSubcohortIndices,currentSubcohortIndex]=subcohortSuccess;
                allCreatedSubcohortIndices.forEach((subcohortIndex)=>{
                    this.selectionManager.clusteringPrefixToSubcohortIndices.get(namePrefix).push(subcohortIndex);
                });
                trueSubcohortIndices.push(currentSubcohortIndex);
            }
        }
        this.setupComplexSelectionQueryBuilder();
        this.updateSelectionToCategoricalControls();
        this.refreshMetadata();
        this.commonSettings.fastLock();
        if(sendShadingSignalLater){
            trueSubcohortIndices.forEach((subcohortIndex)=>{
                this.references.currentCohort.flexiblePlotManager.subplotModules.get(panelIndex).shadeSubcohortSilent(subcohortIndex,1);
            });
            this.references.currentCohort.flexiblePlotManager.subplotModules.get(panelIndex).addSubcohortShades();
        }
        this.references.currentCohort.flexiblePlotManager.subplotModules.get(panelIndex).addPlotDataPoints();
        this.references.currentCohort.flexiblePlotManager.subplotModules.get(panelIndex).remarkDonors();
        this.commonSettings.fastRelease();
    }
    cleanupSubcohortRelatedColumns(subcohortIndex){
        this.references.currentCohort.flexiblePlotManager.removeSubcohortShade(subcohortIndex);
        this.selectionManager.metadataColumnsRelatedToSubcohorts.get(subcohortIndex).forEach((metadataColumn)=>{
            this.cleanupColumn(metadataColumn);
        });
    }
    cleanupColumn(metadataColumn){
        this.metadataDataPossibleValues.delete(metadataColumn);
        this.possibleMetadataColumns.delete(metadataColumn);
        this.metadataDataTypes.delete(metadataColumn);
        const cohortSize=this.metadata.length;
        for(let i=0;i<cohortSize;++i){
            delete this.metadata[i][metadataColumn];
        }
        this.references.currentCohort.flexiblePlotManager.removeMetadataColumn();
    }
    finalizeSingleSelection(selectedDonorIndices, unknownDonorIndices, selectionName){
        const selectionNameInverted=`NOT-${selectionName}`;
        const selectionNameUnknown=`UNKNOWN-${selectionName}`;
        const selectedDonorIndicesInverted=new Set([...this.donors].filter(x => !unknownDonorIndices.has(x) && !selectedDonorIndices.has(x)));
        let trueSubcohortIndex=-1;
        if(selectedDonorIndices.size>0 && selectedDonorIndices.size!==this.donors.size){
            const selectedDonorNames = Array.from(selectedDonorIndices).map((x)=>{return this.metadata[x].donor});
            const unknownDonorNames = Array.from(unknownDonorIndices).map((x)=>{return this.metadata[x].donor});
            const selectedDonorNamesInverted = Array.from(selectedDonorIndicesInverted).map((x)=>{return this.metadata[x].donor});
            let includedSelections=[];
            let includedSelectionNames=[];
            if(!this.selectionManager.registeredSubcohortNamesSet.has(selectionName)){
                $('#heatmapSubcohortMarkerGroup').css('display','inline');
                let positiveSubcohortIndex=-1;
                let unknownSubcohortIndex=-1;
                let invertedSubcohortIndex=-1;
                if(selectedDonorIndices.size>0){
                    const metadataColumn=`Selection_${selectionName}`;
                    for(let i=0;i<this.metadata.length;++i){
                        if(selectedDonorIndices.has(i)){
                            this.metadata[i][metadataColumn]="YES";
                        }else{
                            this.metadata[i][metadataColumn]="NO";
                        }
                    }
                    this.metadataDataPossibleValues.set(metadataColumn,new Set(["YES","NO"]));
                    this.metadataDataTypes.set(metadataColumn,"categorical");
                    this.addPossibleMetadataColumn(metadataColumn);
                    this.selectionManager.addNewSubcohort(selectedDonorIndices,selectionName,this.metadata.length);
                    positiveSubcohortIndex=this.selectionManager.currentMaxIndex;
                    trueSubcohortIndex=this.selectionManager.currentMaxIndex;
                    includedSelections.push(this.selectionManager.currentMaxIndex);
                    includedSelectionNames.push(selectionName);
                    this.selectionManager.metadataColumnsRelatedToSubcohorts.get(this.selectionManager.currentMaxIndex).push(metadataColumn);
                }
                if(unknownDonorIndices.size>0){
                    const metadataColumn=`Selection_${selectionNameUnknown}`;
                    for(let i=0;i<this.metadata.length;++i){
                        if(unknownDonorIndices.has(i)){
                            this.metadata[i][metadataColumn]="YES";
                        }else{
                            this.metadata[i][metadataColumn]="NO";
                        }
                    }
                    this.metadataDataPossibleValues.set(metadataColumn,new Set(["YES","NO"]));
                    this.metadataDataTypes.set(metadataColumn,"categorical");
                    this.addPossibleMetadataColumn(metadataColumn);
                    this.selectionManager.addNewSubcohort(unknownDonorIndices,selectionNameUnknown,this.metadata.length);
                    unknownSubcohortIndex=this.selectionManager.currentMaxIndex;
                    includedSelections.push(this.selectionManager.currentMaxIndex);
                    includedSelectionNames.push(selectionNameUnknown);
                    this.selectionManager.metadataColumnsRelatedToSubcohorts.get(this.selectionManager.currentMaxIndex).push(metadataColumn);
                }
                if(selectedDonorIndicesInverted.size>0){
                    const metadataColumn=`Selection_${selectionNameInverted}`;
                    for(let i=0;i<this.metadata.length;++i){
                        if(selectedDonorIndicesInverted.has(i)){
                            this.metadata[i][metadataColumn]="YES";
                        }else{
                            this.metadata[i][metadataColumn]="NO";
                        }
                    }
                    this.metadataDataPossibleValues.set(metadataColumn,new Set(["YES","NO"]));
                    this.metadataDataTypes.set(metadataColumn,"categorical");
                    this.addPossibleMetadataColumn(metadataColumn);
                    this.selectionManager.addNewSubcohort(selectedDonorIndicesInverted,selectionNameInverted,this.metadata.length);
                    invertedSubcohortIndex=this.selectionManager.currentMaxIndex;
                    includedSelections.push(this.selectionManager.currentMaxIndex);
                    includedSelectionNames.push(selectionNameInverted);
                    this.selectionManager.metadataColumnsRelatedToSubcohorts.get(this.selectionManager.currentMaxIndex).push(metadataColumn);
                }
                if(this.selectionManager.registeredSubcohorts.size>2){
                    if(this.geneExpressionAvailable>1){
                        $('#subcohortGeneExpressionVolcanoContentPaneControl').css('display','inline');
                    }
                    if(this.rppaExpressionAvailable>1){
                        $('#subcohortRppaExpressionVolcanoContentPaneControl').css('display','inline');
                    }
                    $('#subcohortMutexVolcanoContentPaneControl').css('display','inline');
                }
                if(positiveSubcohortIndex!==-1){
                    if(unknownSubcohortIndex!==-1){
                        this.selectionManager.subcohortIndexToItsUnknown.set(positiveSubcohortIndex,unknownSubcohortIndex);
                    }
                    if(invertedSubcohortIndex!==-1){
                        this.selectionManager.subcohortIndexToItsNegative.set(positiveSubcohortIndex,invertedSubcohortIndex);
                    }
                }
                if(invertedSubcohortIndex!==-1){
                    if(unknownSubcohortIndex!==-1){
                        this.selectionManager.subcohortIndexToItsUnknown.set(invertedSubcohortIndex,unknownSubcohortIndex);
                    }
                    if(positiveSubcohortIndex!==-1){
                        this.selectionManager.subcohortIndexToItsNegative.set(invertedSubcohortIndex,positiveSubcohortIndex);
                    }
                }
                if(includedSelections.length>1){
                    this.createCategoricalVariableFromSelections(includedSelections,includedSelectionNames);
                }
                return [selectedDonorNames,unknownDonorNames,selectedDonorNamesInverted,selectionNameUnknown,selectionNameInverted,includedSelections,trueSubcohortIndex];
            }else{
                return -1;
            }
        }else{
            return -2;
        }
    }
    finalizeSelection(selectedDonorIndices, unknownDonorIndices, selectionName,informationTarget){
        const success=this.finalizeSingleSelection(selectedDonorIndices, unknownDonorIndices, selectionName);
        if(success===-2){
            const info=`<p>0 donors or entire cohort in the requested selection, no action taken</p>`;
            $(`#${informationTarget}`).empty().append(info);
            return [info];
        }else if(success===-1){
            const info=`<p>A subcohort with the same name exists, no action taken</p>`;
            $(`#${informationTarget}`).empty().append(info);
            return [info];
        }else{
            let [selectedDonorNames,unknownDonorNames,selectedDonorNamesInverted,selectionNameUnknown,selectionNameInverted,allSubcohortIndices,trueSubccohortIndex]=success;
            let line1=`<p>${selectionName} -> Selected ${selectedDonorIndices.size} donors: ${selectedDonorNames.join(',')}</p><br>`;
            let line2=`<p>${selectionNameUnknown} -> Selected ${unknownDonorIndices.size} donors: ${unknownDonorNames.join(',')}</p><br>`;
            let line3=`<p>${selectionNameInverted} -> Selected ${selectedDonorNamesInverted.length} donors: ${selectedDonorNamesInverted.join(',')}</p>`;
            this.setupComplexSelectionQueryBuilder();
            $(`#${informationTarget}`).empty()
                .append(line1)
                .append(line2)
                .append(line3);
            this.updateSelectionToCategoricalControls();
            this.refreshMetadata();
            return [line1,line2,line3];
        }
    }
    chooseColClasses(){
        let columnNameToDelete=new Set();
        let columnIndexToDelete=new Set();
        this.possibleMetadataColumns.forEach((columnIndex,columnName,map)=>{
            let dataType="categorical";
            let allNumeric=true;
            let allMissing=true;
            let encounteredValues=new Set();
            for(let i=0; i<this.metadata.length; ++i){
                if(!(this.commonSettings.undefinedValues.has(this.metadata[i][columnName]))){
                    encounteredValues.add(this.metadata[i][columnName]);
                    if(!$.isNumeric(this.metadata[i][columnName])){
                        allNumeric=false;
                        if (typeof this.metadata[i][columnName] === 'string' || this.metadata[i][columnName] instanceof String){
                            let multicategoricalTesting = this.metadata[i][columnName].split(';');
                            if(multicategoricalTesting.length>0){
                                let nonEmpty=0;
                                for(let j=0; j<multicategoricalTesting.length; ++j){
                                    if(multicategoricalTesting[j]!==""){
                                        nonEmpty+=1;
                                    }
                                }
                                if(nonEmpty>1){
                                    dataType="multicategorical";
                                }
                            }
                        }
                    }
                    allMissing=false;
                }
            }
            if(allMissing){
                for(let j=0; j<this.metadata.length; ++j){
                    delete this.metadata[j][columnName];
                }
                columnNameToDelete.add(columnName);
                columnIndexToDelete.add(columnIndex);
            }else{
                if(allNumeric && encounteredValues!=new Set(["0","1"])){
                    dataType="numeric";
                    for(let j=0; j<this.metadata.length; ++j){
                        this.metadata[j][columnName]=+this.metadata[j][columnName];
                    }
                }else{
                    for(let j=0; j<this.metadata.length; ++j){
                        if(this.metadata[j][columnName].toString()==="NaN"){
                            this.metadata[j][columnName]="NA";
                        }
                    }
                }
                this.metadataDataTypes.set(columnName,dataType);
                this.metadataDataPossibleValues.set(columnName,new Set([]));
                for(let j=0; j<this.metadata.length; ++j){
                    this.metadataDataPossibleValues.get(columnName).add(this.metadata[j][columnName]);
                }
            }
        });
        columnIndexToDelete.forEach((columnId)=>{
            this.possibleMetadataColumnsReverse.delete(columnId);
        });
        columnNameToDelete.forEach((columnName)=>{
            this.possibleMetadataColumns.delete(columnName);
        });
        for(let j=0; j<this.metadata.length; ++j){
            this.metadata[j]["index"]=parseInt(this.metadata[j]["index"]);
        }
    }
    prepareLabelText(donorIndex,chosenColumns){
        let chosenColumnEntries=[this.metadata[donorIndex].donor];
        chosenColumns.forEach((c)=>{
            chosenColumnEntries.push(`${c}: ${this.metadata[donorIndex][c]}`);
        });
        return chosenColumnEntries.join(', ');
    }
    prepareHoverText(donorIndex,chosenColumns){
        let chosenColumnEntries=[this.metadata[donorIndex].donor];
        chosenColumns.forEach((c)=>{
            chosenColumnEntries.push(`${c}: ${this.metadata[donorIndex][c]}`);
        });
        return chosenColumnEntries.join('\n');
    }
    refreshMetadata(){
        this.drawMetadataGrid();
        let metadataMiniSelectionColumnSelector=$('#metadataMiniSelectionColumnSelector');
        metadataMiniSelectionColumnSelector.empty();
        metadataMiniSelectionColumnSelector.append(`<option value="${-1}">Select Column</option>`);
        this.possibleMetadataColumns.forEach((index,column,map)=>{
            metadataMiniSelectionColumnSelector.append(`<option value="${column}">${column}</option>`);
        });
    }
    drawMetadataGrid(){
        let currentWidth=$("#mainContent").css("width");
        let gridHeader=[];
        this.possibleMetadataColumns.forEach((i,x,map)=>{
            gridHeader.push({
                field:x,
                title:x,
                sortable:true,
                type:this.metadataDataTypes.get(x)==="categorical"?"text":"numeric",
            });
        });
        $('#cohortMetadataTable').bootstrapTable('destroy').bootstrapTable({
            width: +currentWidth.replace("px",""),
            height: (+currentWidth.replace("px",""))*20,
            data:this.metadata,
            columns:gridHeader,
            showColumns:true,
            fixedColumns: true,
            fixedNumber: 1,
            search:true,
            showExport:true,
        }).bootstrapTable('refresh');
    }
    presetWheelSelectors(){
        $('#wheelSelector1').empty();
        $('#wheelSelector2').empty();
        $('#wheelSelector3').empty();
        $('#wheelSelector4').empty();
        let optionList=[];
        if(this.commonSettings.wesMode){
            $('#geneMutTypesWheel1').css("display","none");
            $('#tadOffsetWheel1Group').css("display","none");
        }
        if(this.svAvailable>0){
            optionList.push('<option value="sv">SV recurrence</option>');
        }
        if(this.cnvAvailable>0){
            optionList.push('<option value="cnv">CNV recurrence</option>');
            if(!this.commonSettings.wesMode){
                optionList.push('<option value="loh">LOH recurrence</option>');
                optionList.push('<option value="cnnloh">copy-neutral LOH recurrence</option>');
                optionList.push('<option value="cnvloh">CNV+LOH(as Loss) recurrence</option>',);
            }
        }
        optionList.push('<option value="cyt">Cytobands</option>');
        if(this.svAvailable>0 || this.smallVarAvailable>0){
            if(!this.commonSettings.wesMode){
                optionList.push('<option value="ind">Indel recurrence</option>');
            }
            optionList.push('<option value="gene">GeneMut recurrence</option>');
        }
        optionList.push('<option value="off">Off</option>');

        optionList.forEach((opt)=>{
            $('#wheelSelector1').append(opt);
            $('#wheelSelector2').append(opt);
            $('#wheelSelector3').append(opt);
            $('#wheelSelector4').append(opt);
        });
        $('#wheelSelector1').val("off");
        $('#wheelSelector2').val("off");
        $('#wheelSelector3').val("cyt");
        $('#geneMutTypesWheel3').css("display","none");
        $('#tadOffsetWheel3Group').css("display","none");
        $('#wheelSelector4').val("off");
        if(this.svAvailable>0){
            $('#wheelSelector1').val("sv");
            $('#geneMutTypesWheel1').css("display","none")
        }
        if(this.cnvAvailable>0){
            $('#wheelSelector2').val("cnv");
            $('#geneMutTypesWheel2').css("display","none");
            $('#tadOffsetWheel2Group').css("display","none");
        }
        if(this.smallVarAvailable>0){
            $('#wheelSelector4').val("gene");
            $('#tadOffsetWheel4Group').css("display","none")
        }
    }
    addGeneExpressionToMetadata(geneToFetch){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortName,
                suffix: "geneExpressions",
                columnsToSelect: "*",
                keyColumn: "gene",
                keysToSearchRaw: geneToFetch,
            }),
            error: function(err){
                console.error(err);
            },
            success: function(rawData){
                let data=rawData[0];
                if(data===undefined){
                    thisRef.resetGeneSelector();
                    return;
                }
                let fieldName=`${thisRef.references.genes.get(geneToFetch).geneName}_expression`;
                thisRef.metadataDataPossibleValues.set(fieldName,new Set());
                Object.keys(data).forEach(function(key,index) {
                    if(key!=="gene" && key!=="varianceRank"){
                        let donorIndex=parseInt(key);
                        let expression=+data[key];
                        thisRef.metadata[donorIndex][fieldName]=expression;
                        thisRef.metadataDataPossibleValues.get(fieldName).add(expression);
                    }
                });
                thisRef.metadataDataTypes.set(fieldName,"numeric");
                thisRef.addPossibleMetadataColumn(fieldName);
                thisRef.refreshMetadata();
                thisRef.resetGeneSelector();
            }
        });
    }
    addRppaExpressionToMetadata(rppaToFetch){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortName,
                suffix: "rppaExpressions",
                columnsToSelect: "*",
                keyColumn: "rppa",
                keysToSearchRaw: rppaToFetch,
            }),
            error: function(err){
                console.error(err);
            },
            success: function(rawData){
                if(rawData.length>0){
                    const data=rawData[0];
                    const fieldName=`${thisRef.references.rppaAntibodies[rppaToFetch].rppaName}_expression`;
                    thisRef.metadataDataPossibleValues.set(fieldName,new Set());
                    Object.keys(data).forEach(function(key,index) {
                        if(key!=="rppa" && key!=="varianceRank"){
                            const donorIndex=parseInt(key);
                            const expression=+data[key];
                            thisRef.metadata[donorIndex][fieldName]=expression;
                            thisRef.metadataDataPossibleValues.get(fieldName).add(expression);
                        }
                    });
                    thisRef.metadataDataTypes.set(fieldName,"numeric");
                    thisRef.addPossibleMetadataColumn(fieldName);
                    thisRef.refreshMetadata();
                }
                thisRef.resetRppaSelector();
            }
        });
    }
    addChromosomeArmVariantsToMetadata(chromosomeArmToFetch){
        if(chromosomeArmToFetch>0){
            let variantExistence=new Map();
            let chromosomeArm = this.references.chromosomeArms[chromosomeArmToFetch];
            [
                ["cnvLoss","CN loss"],
                ["cnvGain","CN gain"],
                ["loh","LOH"],
                ["cnnLoh","CNN LOH"]
            ].forEach(([rawType,longType])=>{
                let donors=chromosomeArm[rawType+"DonorContributorIndices"];
                donors.forEach((donor)=>{
                    if(!variantExistence.has(donor)){
                        variantExistence.set(donor,[]);
                    }
                    variantExistence.get(donor).push(longType);
                });
            });
            if(variantExistence.size===0){
                console.error(chromosomeArm);
                return;
            }
            let fieldName=chromosomeArm.chromosomeArmName+"_variants";
            this.metadataDataPossibleValues.set(fieldName,new Set());
            let visitedDonorIndices=new Set();
            variantExistence.forEach((variantSummary,donorIndex,x)=>{
                this.metadata[donorIndex][fieldName]=variantSummary.join(';');
                variantSummary.forEach((variant)=>{
                    this.metadataDataPossibleValues.get(fieldName).add(variant);
                });
                visitedDonorIndices.add(donorIndex);
            });
            this.donors.forEach((donorIndex)=>{
                if(!visitedDonorIndices.has(donorIndex)){
                    this.metadata[donorIndex][fieldName]='NONE';
                    this.metadataDataPossibleValues.get(fieldName).add('NONE');
                }
            });
            this.metadataDataTypes.set(fieldName,"multicategorical");
            this.addPossibleMetadataColumn(fieldName);
        }
        this.refreshMetadata();
        this.resetChromosomeArmSelector();
    }
    addCytobandVariantsToMetadata(cytobandToFetch){
        if(cytobandToFetch>0){
            let variantExistence=new Map();
            let cytoband = this.references.cytobands[cytobandToFetch];
            [
                ["vdjSv","VDJ SV"],
                ["sv","SV"],
                ["cnvLoss","CN loss"],
                ["cnvGain","CN gain"],
                ["loh","LOH"],
                ["cnnLoh","CNN LOH"]
            ].forEach(([rawType,longType])=>{
                let donors=cytoband[rawType+"DonorContributorIndices"];
                donors.forEach((donor)=>{
                    if(!variantExistence.has(donor)){
                        variantExistence.set(donor,[]);
                    }
                    variantExistence.get(donor).push(longType);
                });
            });
            if(variantExistence.size===0){
                return;
            }
            let fieldName=cytoband.cytobandName+"_variants";
            this.metadataDataPossibleValues.set(fieldName,new Set());
            let visitedDonorIndices=new Set();
            variantExistence.forEach((variantSummary,donorIndex,x)=>{
                this.metadata[donorIndex][fieldName]=variantSummary.join(';');
                variantSummary.forEach((variant)=>{
                    this.metadataDataPossibleValues.get(fieldName).add(variant);
                });
                visitedDonorIndices.add(donorIndex);
            });
            this.donors.forEach((donorIndex)=>{
                if(!visitedDonorIndices.has(donorIndex)){
                    this.metadata[donorIndex][fieldName]='NONE';
                    this.metadataDataPossibleValues.get(fieldName).add('NONE');
                }
            });
            this.metadataDataTypes.set(fieldName,"multicategorical");
            this.addPossibleMetadataColumn(fieldName);
        }
        this.refreshMetadata();
        this.resetCytobandSelector();
    }
    addGeneVariantsToMetadata(geneToFetch){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortName,
                suffix: "geneRecurrence",
                columnsToSelect: "*",
                keyColumn: "gene",
                keysToSearchRaw: geneToFetch,
            }),
            error: function(err){
                console.error(err);
            },
            success: function(rawData){
                let variantExistence=new Map();
                let data=rawData[0];
                let fieldName=`${thisRef.references.genes.get(geneToFetch).geneName}_variants`;
                thisRef.metadataDataPossibleValues.set(fieldName,new Set());
                Object.keys(data).forEach(function(key,index) {
                    if(key!=="Gene"){
                        let variantTypeIndex=parseInt(key);
                        if(data[key]!==""){
                            let donors=data[key].split(',').map((d)=>{return parseInt(d);});
                            donors.forEach((donor)=>{
                                if(!variantExistence.has(donor)){
                                    variantExistence.set(donor,[]);
                                }
                                variantExistence.get(donor).push(variantTypeIndex);
                            });
                        }
                    }
                });
                let visitedDonorIndices=new Set();
                variantExistence.forEach((variantIndices,donorIndex,x)=>{
                    let variantSummary = variantIndices.map((x)=>{return thisRef.references.variantTypes[x].variantType});
                    thisRef.metadata[donorIndex][fieldName]=variantSummary.join(';');
                    variantSummary.forEach((variant)=>{
                        thisRef.metadataDataPossibleValues.get(fieldName).add(variant);
                    });
                    visitedDonorIndices.add(donorIndex);
                });
                thisRef.donors.forEach((donorIndex)=>{
                   if(!visitedDonorIndices.has(donorIndex)){
                       thisRef.metadata[donorIndex][fieldName]='NONE';
                       thisRef.metadataDataPossibleValues.get(fieldName).add('NONE');
                   }
                });
                thisRef.metadataDataTypes.set(fieldName,"multicategorical");
                thisRef.addPossibleMetadataColumn(fieldName);
                thisRef.refreshMetadata();
                thisRef.resetGeneSelector();
            }
        });
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
    resetGeneSelector(){
        [
            "allGeneSelectorControls"
        ].forEach((x)=>{
            $(`#${x}`).css("display","none");
        });
        this.references.geneInputAwesompleteCurrentGene=-1;
        $('#geneSelector').val('');
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
    generalHeaderExport(){
        let headerChunks=[
            "Donor"
        ];
        this.possibleMetadataColumns.forEach((i,column,map)=>{
           if(column!=="donor"){
               headerChunks.push(column);
           }
        });
        return headerChunks;
    }
    textExport(){
        let outputChunks=[this.generalHeaderExport()];
        this.metadata.forEach((x)=>{
            let currentRow=x.textExport(this.possibleMetadataColumns);
            outputChunks.push(currentRow);
        });
        return outputChunks;
    }
}