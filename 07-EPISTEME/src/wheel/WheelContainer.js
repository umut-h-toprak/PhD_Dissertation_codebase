import {WheelRecurrence} from "./WheelRecurrence";
import {WheelCytoband} from "./WheelCytoband";
import {eqSet} from "../Utils";
import {GeneEntry} from "../references/GeneEntry";
import {TadEntry} from "../references/TadEntry";

export class WheelContainer {
    constructor(commonSettings,
                references,
                selectionManager,
                selectedSubcohortIndex,
                selectedDiffSubcohortIndex,
                wheelIndex,
                numDonors,
                fontManager){
        this.commonSettings=commonSettings;
        this.references=references;
        this.selectionManager=selectionManager;
        this.selectedSubcohortIndex=selectedSubcohortIndex;
        this.selectedDiffSubcohortIndex=selectedDiffSubcohortIndex;
        this.fontManager=fontManager;
        this.selectedDonors=this.selectionManager.registeredSubcohorts.get(this.selectedSubcohortIndex);
        this.diffDonors=new Set();
        if(this.selectedDiffSubcohortIndex!==-1){
            this.diffDonors=this.selectionManager.registeredSubcohorts.get(this.selectedDiffSubcohortIndex);
        }
        // this.singlePatientMode=this.selectedDonors.size===1;
        this.currentInnerRadius=0;
        this.currentWheelWidth=0;
        this.currentDataMode="off";
        this.currentTadOffset=0;
        this.wheel1=undefined;
        this.wheel2=undefined;
        this.wheelIndex=wheelIndex;
        this.currentPureMaxRecurrence=0;
        this.maxRecurrenceAdjustmentSliderId=`maxRecWheel${this.wheelIndex}`;
        this.numDonors=numDonors;
        this.allowedMutationTypes=new Set();
        this.data=null;
    }
    enableControls(){
        if(this.wheel1!==undefined){
            this.wheel1.enableControls();
        }
        if(this.wheel2!==undefined){
            this.wheel2.enableControls();
        }
        this.updateSlider();
    }
    plot(){
        if(this.currentDataMode!=="off"){
            if(this.wheel1!==undefined){
                this.wheel1.plot();
            }
            if(this.wheel2!==undefined){
                this.wheel2.plot();
            }
        }
    }
    reset(){
        if(this.wheel1!==undefined){
            this.wheel1.cleanup();
            this.wheel1=undefined;
        }
        if(this.wheel2!==undefined){
            this.wheel2.cleanup();
            this.wheel2=undefined;
        }
        this.data=null;
    }
    updateAngles(){
        if(this.wheel1!==undefined){
            this.wheel1.updatePaths();
        }
        if(this.wheel2!==undefined){
            this.wheel2.updatePaths();
        }
    }
    updateWheel(dataMode,innerRadius,wheelWidth,data,tadOffset,allowedMutationTypes,initMode){
        this.currentPureMaxRecurrence=0;
        let toChangeWheel=tadOffset!==this.currentTadOffset||this.currentInnerRadius!==innerRadius||this.currentDataMode!==dataMode||(dataMode==="gene"&& !eqSet(this.allowedMutationTypes,allowedMutationTypes));
        this.currentDataMode=dataMode;
        this.currentInnerRadius=innerRadius;
        this.currentWheelWidth=wheelWidth;
        this.currentTadOffset=tadOffset;
        if(toChangeWheel){
            if(this.currentDataMode!=="cyt"){
                if(this.currentDataMode==="gene"){
                    this.allowedMutationTypes=allowedMutationTypes;
                }
                let dataFields=this.generateDataFields(false,false);
                $(`#${this.maxRecurrenceAdjustmentSliderId}Label`).html("");
                data.forEach((x)=>{
                    let rec=this.calculateRecurrence(x,dataFields);
                    if(rec>this.currentPureMaxRecurrence){
                        this.currentPureMaxRecurrence=rec;
                    }
                });
                $(`#${this.maxRecurrenceAdjustmentSliderId}Group`).css("display","inline");
            }else{
                $(`#${this.maxRecurrenceAdjustmentSliderId}Group`).css("display","none");
            }
            this.setWheels(data,!initMode);
        }
    }
    updateSlider(){
        let thisRef=this;
        $(`#${this.maxRecurrenceAdjustmentSliderId}Label`).html(`Max Displayed<br/>${this.currentDataMode} Recurrence: ${this.currentPureMaxRecurrence}`);
        $(`#${this.maxRecurrenceAdjustmentSliderId}`)
            .slider('setAttribute','data-slider-max',thisRef.numDonors)
            .slider('setAttribute','max',thisRef.numDonors)
            .slider('setValue', parseInt(thisRef.currentPureMaxRecurrence))
            .off("change").on("change", function() {
            if(this.currentDataMode!=="cyt"){
                let newForcedMaxRecurrence=+$(this).val();
                $(`#${thisRef.maxRecurrenceAdjustmentSliderId}Label`).html(`Max Displayed<br/>${thisRef.currentDataMode} Recurrence: ${newForcedMaxRecurrence}`);

                if(thisRef.wheel1!==undefined){
                    thisRef.wheel1.updateForcedMaxRecurrence(newForcedMaxRecurrence);
                }
                if(thisRef.wheel2!==undefined){
                    thisRef.wheel2.updateForcedMaxRecurrence(newForcedMaxRecurrence);
                }
            }
        });
    }
    setWheels(data,thenPlot){
        if(this.wheel1!==undefined){
            this.wheel1.cleanup();
        }
        if(this.wheel2!==undefined){
            this.wheel2.cleanup();
        }
        this.wheel1=undefined;
        this.wheel2=undefined;
        if(this.currentDataMode!=="cnv" && this.currentDataMode!=="cnvloh"){
            if(this.currentDataMode!=="cyt"){
                this.wheel1=new WheelRecurrence(
                    this.commonSettings,
                    this.references,
                    this.selectionManager,
                    this.selectedSubcohortIndex,
                    this.selectedDiffSubcohortIndex,
                    this.currentInnerRadius,
                    this.currentWheelWidth,
                    data,
                    this.generateDataFields(false,false),
                    this.currentDataMode,
                    false,
                    false,
                    `${this.currentDataMode}_w${this.wheelIndex}`,
                    this.currentPureMaxRecurrence,
                    `maxRecWheel${this.wheelIndex}`,
                    this.allowedMutationTypes,
                    this.fontManager);
            }else{
                this.wheel1=new WheelCytoband(
                    this.commonSettings,
                    this.references,
                    this.currentInnerRadius,
                    this.currentWheelWidth,
                    data,
                    `${this.currentDataMode}_w${this.wheelIndex}`,
                    this.fontManager
                );
            }

        }else{
            this.wheel1=new WheelRecurrence(
                this.commonSettings,
                this.references,
                this.selectionManager,
                this.selectedSubcohortIndex,
                this.selectedDiffSubcohortIndex,
                this.currentInnerRadius,
                Math.round((this.currentWheelWidth-this.commonSettings.wheelGap)/2),
                data,
                this.generateDataFields(true,false),
                this.currentDataMode,
                true,
                true,
                `${this.currentDataMode}l_w${this.wheelIndex}`,
                this.currentPureMaxRecurrence,
                `maxRecWheel${this.wheelIndex}`,
                this.allowedMutationTypes,
                this.fontManager);
            this.wheel2= new WheelRecurrence(
                this.commonSettings,
                this.references,
                this.selectionManager,
                this.selectedSubcohortIndex,
                this.selectedDiffSubcohortIndex,
                this.currentInnerRadius+Math.round((this.currentWheelWidth-this.commonSettings.wheelGap)/2),
                Math.round((this.currentWheelWidth-this.commonSettings.wheelGap)/2)+this.commonSettings.wheelGap,
                data,
                this.generateDataFields(false,true),
                this.currentDataMode,
                true,
                false,
                `${this.currentDataMode}g_w${this.wheelIndex}`,
                this.currentPureMaxRecurrence,
                `maxRecWheel${this.wheelIndex}`,
                this.allowedMutationTypes,
                this.fontManager);
        }
        if(thenPlot){
            if(this.wheel1!==undefined){
                this.wheel1.plot();
            }
            if(this.wheel2!==undefined){
                this.wheel2.plot();
            }
        }
        this.enableControls();
    }
    calculateRecurrence(x,dataFields){
        let tmpSet=new Set();
        if(this.currentDataMode!=="gene"){
            dataFields.forEach((field)=>{
                x[field].forEach((y)=>{
                    tmpSet.add(y);
                });
            });
        }else{
            x[dataFields[0]].forEach((value,key,)=>{
                if(this.allowedMutationTypes.has(key)){
                    value.forEach((y)=>{
                        tmpSet.add(y);
                    });
                }
            });
        }
        let tmpSelSet=new Set([...tmpSet].filter(x => this.selectedDonors.has(x)));
        if(this.selectedDiffSubcohortIndex!==-1){
            let tmpSelSetDiff=new Set([...tmpSet].filter(x => this.diffDonors.has(x)));
            return Math.max(0,tmpSelSet.size-tmpSelSetDiff.size);
        }else{
            return tmpSelSet.size;
        }
    }
    generateDataFields(lossMode,gainMode){
        if(this.currentDataMode==="cnv"){
            if(lossMode&&!gainMode){
                return ["cnvLossDonorContributorIndices"];
            }
            if(gainMode&&!lossMode){
                return ["cnvGainDonorContributorIndices"];
            }
            return ["cnvGainDonorContributorIndices","cnvLossDonorContributorIndices"];
        }else if(this.currentDataMode==="cnvloh"){
            if(lossMode&&!gainMode){
                return ["cnvLossDonorContributorIndices","lohDonorContributorIndices"];
            }
            if(gainMode&&!lossMode){
                return ["cnvGainDonorContributorIndices"];
            }
            return ["cnvGainDonorContributorIndices","cnvLossDonorContributorIndices","lohDonorContributorIndices"];
        } else if(this.currentDataMode==="sv"){
            let tmpFields=[];
            for(let i=0;i<=this.currentTadOffset;++i){
                tmpFields.push(`svDonorContributorIndicesOffset${i}`);
            }
            return tmpFields
        } else if(this.currentDataMode==="loh") {
            return ["lohDonorContributorIndices"]
        } else if(this.currentDataMode==="cnnloh"){
            return ["cnnLohDonorContributorIndices"]
        } else if(this.currentDataMode==="ind"){
            let tmpFields=[];
            for(let i=0;i<=this.currentTadOffset;++i){
                tmpFields.push(`indelDonorContributorIndicesOffset${i}`);
            }
            return tmpFields
        } else if(this.currentDataMode==="gene"){
            return ["currentDonorContributions"];
        }else{
            return [];
        }
    }
    replotVerticalAxis(){
        if(this.wheel1!==undefined){
            this.wheel1.addVerticalAxis();
        }
        if(this.wheel2!==undefined){
            this.wheel2.addVerticalAxis();
        }
    }
    replotGeneLabels(){
        this.wheel1.plotGeneLabels();
    }
    markGene(geneToMark){
        this.wheel1.addGeneLabel(geneToMark);
    }
    clearMarkedGenes(){
        this.wheel1.clearMarkedGenes();
    }
    markCytoband(cytobandToMark){
        this.wheel1.addCytobandLabel(cytobandToMark);
    }
    clearMarkedCytobands(){
        this.wheel1.removeAllCytobandLabels();
    }
    textExport(cohortMetadata){
        let textBlocks=[];
        if(this.currentDataMode==="gene"){
            let expectedTypesArr=Array.from(this.allowedMutationTypes).sort();
            textBlocks.push(GeneEntry.generalHeaderExport(this.references,expectedTypesArr));
            for(let i=0;i<this.wheel1.data.length;++i){
                if(this.references.tads[this.wheel1.data[i].tadIndex].chromosomeIndex!==25){
                    let currentRec=this.wheel1.data[i].textExport(this.references,cohortMetadata,expectedTypesArr);
                    if(currentRec.length>0){
                        textBlocks.push(currentRec);
                    }
                }
            }
        }else if(this.currentDataMode==="cnv" || this.currentDataMode==="cnvloh" || this.currentDataMode==="cnnloh" || this.currentDataMode==="loh"){
            textBlocks.push(TadEntry.generalHeaderExportCnv());
            for(let i=0;i<this.wheel1.data.length;++i){
                if(this.references.tads[this.wheel1.data[i].tadIndex].chromosomeIndex!==25){
                    let currentRec=this.wheel1.data[i].textExportCnv(cohortMetadata,this.references);
                    if(currentRec.length>0){
                        textBlocks.push(currentRec);
                    }
                }
            }
        }else if(this.currentDataMode==="sv"){
            textBlocks.push(TadEntry.generalHeaderExportSv());
            for(let i=0;i<this.wheel1.data.length;++i){
                if(this.references.tads[this.wheel1.data[i].tadIndex].chromosomeIndex!==25){
                    let currentRec=this.wheel1.data[i].textExportSv(cohortMetadata,this.references,this.currentTadOffset);
                    if(currentRec.length>0){
                        textBlocks.push(currentRec);
                    }
                }
            }
        }else if(this.currentDataMode==="ind"){
            textBlocks.push(TadEntry.generalHeaderExportIndel());
            for(let i=0;i<this.wheel1.data.length;++i){
                if(this.references.tads[this.wheel1.data[i].tadIndex].chromosomeIndex!==25){
                    let currentRec=this.wheel1.data[i].textExportIndel(this.references,cohortMetadata);
                    if(currentRec.length>0){
                        textBlocks.push(currentRec);
                    }
                }
            }
        }else{
            return []
        }
        return textBlocks;
    }
}