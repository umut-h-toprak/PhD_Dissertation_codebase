export class SelectionManager{
    constructor() {
        this.cohortFullDonors=new Set();
        this.registeredSubcohorts=new Map();
        this.subcohortIndexToItsUnknown=new Map();
        this.subcohortIndexToItsNegative=new Map();
        this.registeredSubcohortNames=new Map();
        this.registeredSubcohortNamesSet=new Map("",-1);
        this.clusteringPrefixToSubcohortIndices=new Map();
        this.metadataColumnsRelatedToSubcohorts=new Map();
        this.fullCohortSubcohortIndices=new Set();
        this.currentMaxIndex=-1;
        this.cohortName=null;
    }
    setCohortName(cohortName){
        this.cohortName=cohortName;
    }
    addNewSubcohort(selectedDonorIndices,selectionName,cohortFullLength){
        const newSubcohortIndex=this.currentMaxIndex+1;
        this.registeredSubcohortNames.set(newSubcohortIndex,selectionName);
        this.registeredSubcohortNamesSet.set(selectionName,newSubcohortIndex);
        this.registeredSubcohorts.set(newSubcohortIndex,new Set());
        this.metadataColumnsRelatedToSubcohorts.set(newSubcohortIndex,[]);
        selectedDonorIndices.forEach((donorIndex)=>{
            this.registeredSubcohorts.get(newSubcohortIndex).add(donorIndex)
        });
        const newSubcohortFullName=`${this.cohortName}_${selectionName} (${selectedDonorIndices.size}/${cohortFullLength})`;

        $('#subcohortDiffSelector').append(`<option value=${newSubcohortIndex}>DIFFERENCE FROM ${newSubcohortFullName}</option>`);
        [
            "#subcohortSelector",
            "#groupSelectorSinglePhenotypeSelector1",
            "#groupSelectorSinglePhenotypeSelector2",
            "#heatmapSubcohortMarkerSelector",
            "#miniSelectionBuilderSubgroupSelector",
            "#flexibleSubcohortMarkerSelector",
            "#subcohortSelectorFlexiblePlotGrid",
            "#subcohortSelectorFlexiblePlotGridDefault",
            "#flexibleSubcohortSelector",
            "#flexibleSubcohortSelectorManifold",
        ].forEach((selectorId)=>{
            $(selectorId).append(`<option value=${newSubcohortIndex}>${newSubcohortFullName}</option>`);
        });
        this.currentMaxIndex=newSubcohortIndex;
    }
    removeSubcohort(subcohortIndex,cohortMetadata){
        this.registeredSubcohorts.delete(subcohortIndex);
        const oldName=this.registeredSubcohortNames.get(subcohortIndex);
        this.registeredSubcohortNames.delete(subcohortIndex);
        this.registeredSubcohortNamesSet.delete(oldName);
        [
            "subcohortDiffSelector",
            "subcohortSelector",
            "groupSelectorSinglePhenotypeSelector1",
            "groupSelectorSinglePhenotypeSelector2",
            "heatmapSubcohortMarkerSelector",
            "miniSelectionBuilderSubgroupSelector",
            "subcohortSelectorFlexiblePlotGrid",
            "subcohortSelectorFlexiblePlotGridDefault",
            "flexibleSubcohortSelector",
            "flexibleSubcohortSelectorManifold",
        ].forEach((selectorName)=>{
            $(`#${selectorName} option[value='${subcohortIndex}']`).remove();
        });
        cohortMetadata.cleanupSubcohortRelatedColumns(subcohortIndex);
        this.metadataColumnsRelatedToSubcohorts.delete(subcohortIndex);
    }
    cleanupSubcohortCluster(clusteringPrefixName,cohortMetadata){
        let deletedSubcohorts=[];
        this.clusteringPrefixToSubcohortIndices.get(clusteringPrefixName).forEach((subcohortIndex)=>{
            this.removeSubcohort(subcohortIndex,cohortMetadata);
            deletedSubcohorts.push(subcohortIndex);
        });
        this.clusteringPrefixToSubcohortIndices.delete(clusteringPrefixName);
        return deletedSubcohorts;
    }
}