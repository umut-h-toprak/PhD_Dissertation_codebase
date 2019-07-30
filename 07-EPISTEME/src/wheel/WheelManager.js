import {WheelContainer} from "./WheelContainer";
import {queue as d3Xqueue} from "d3-queue";
import {eqSet, switchElements} from "../Utils";
import {HorizontalAxis} from "./HorizontalAxis";

export class WheelManager {
    constructor(commonSettings,references,cohortMetadata,selectionManager,selectedSubcohortIndex,selectedDiffSubcohortIndex,cohortData,fontManager){
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.selectedSubcohortIndex=selectedSubcohortIndex;
        this.selectedDiffSubcohortIndex=selectedDiffSubcohortIndex;
        this.cohortData=cohortData;
        this.fontManager=fontManager;
        $('#wheelControls').empty();
        for (let i=1;i<5;++i){
            this.addWheelHtml(i);
        }
        $('#wheelControls').append(`<button id="submitWheelChoices" type="button" class="btn btn-success">Submit Wheel Choices</button>`);
        this.cohortMetadata.presetWheelSelectors();

        this.wheelClasses=["off", "off", "off", "off"];
        this.wheels=[
            new WheelContainer(this.commonSettings, this.references, this.selectionManager, this.selectedSubcohortIndex,this.selectedDiffSubcohortIndex, 1, 0, this.fontManager),
            new WheelContainer(this.commonSettings, this.references, this.selectionManager, this.selectedSubcohortIndex,this.selectedDiffSubcohortIndex, 2, 0, this.fontManager),
            new WheelContainer(this.commonSettings, this.references, this.selectionManager, this.selectedSubcohortIndex,this.selectedDiffSubcohortIndex, 3, 0, this.fontManager),
            new WheelContainer(this.commonSettings, this.references, this.selectionManager, this.selectedSubcohortIndex,this.selectedDiffSubcohortIndex, 4, 0, this.fontManager)];
        for(let i=0;i<4;++i){
            this.wheels[i].numDonors=this.cohortMetadata.metadata.length;
        }
        this.currentGeneMutTypes=new Set();
        this.wheelGeneMutTypes=[new Set(), new Set(), new Set(), new Set()
        ];
        this.tadOffsets=[
            parseInt(document.getElementById('tadOffsetWheel1Selector').value),
            parseInt(document.getElementById('tadOffsetWheel2Selector').value),
            parseInt(document.getElementById('tadOffsetWheel3Selector').value),
            parseInt(document.getElementById('tadOffsetWheel4Selector').value)];
        this.controls();
        this.horizontalAxisGenerator=new HorizontalAxis(this.commonSettings,this.references,this.fontManager);

        $('#submitWheelChoices').off("click").on("click",()=>{
            this.resetWheelViz();
        });
    }
    resetWheelViz(){
        let qR = d3Xqueue();
        qR.defer((callback)=>{this.readGeneMutTypes(callback);});
        qR.awaitAll(()=>{
            let oldSvRadius=this.commonSettings.svRadius;
            this.readWheelChoices(false);
            let newSvRadius=this.commonSettings.svRadius;
            if(oldSvRadius!==newSvRadius){
                this.references.currentCohort.vizManager.plot();
            }
        });
    }
    markGene(geneIndex){
        for(let i=3;i>=0;--i){
            if(this.wheelClasses[i]==="cyt"){
                this.wheels[i].markGene(geneIndex);
                break;
            }
        }
    }
    replotGeneLabels(){
        for(let i=3;i>=0;--i){
            if(this.wheelClasses[i]==="cyt"){
                this.wheels[i].replotGeneLabels();
                break;
            }
        }
    }
    markCytobandsCarryingGene(geneIndex){
        this.references.genes.get(geneIndex).cytobandIndices.forEach((cytobandIndex)=>{
            this.markCytoband(cytobandIndex);
        });
    }
    markAllGenesOnCytoband(cytobandIndex){
        for(let i=3;i>=0;--i){
            if(this.wheelClasses[i]==="cyt"){
                this.references.cytobands[cytobandIndex].getGeneIndices(this.references).forEach((geneIndex)=>{
                    this.markGene(geneIndex);
                });
                break;
            }
        }
    }
    markAllGenesOnCytobandsContainingGene(geneIndex){
        let genesToMark=new Set();
        this.references.genes.get(geneIndex).cytobandIndices.forEach((cytobandIndex)=>{
            this.references.cytobands[cytobandIndex].getGeneIndices(this.references).forEach((geneIndex2)=>{
                genesToMark.add(geneIndex2);
            });
        });
        genesToMark.forEach((geneIndex2)=>{
            this.markGene(geneIndex2,-1,true);
        });
    }
    clearMarkedGenes(){
        for(let i=3;i>=0;--i){
            if(this.wheelClasses[i]==="cyt"){
                this.wheels[i].clearMarkedGenes();
                break;
            }
        }
    }
    replotVerticalAxis(){
        for(let i=0;i<4;++i){
            if(this.wheelClasses[i]!=="cyt"){
                this.wheels[i].replotVerticalAxis();
            }
        }
    }
    markCytoband(cytobandIndex){
        for(let i=3;i>=0;--i){
            if(this.wheelClasses[i]==="cyt"){
                this.wheels[i].markCytoband(cytobandIndex);
                break;
            }
        }
    }
    clearMarkedCytobands(){
        for(let i=3;i>=0;--i){
            if(this.wheelClasses[i]==="cyt"){
                this.wheels[i].clearMarkedCytobands();
                break;
            }
        }
    }
    addWheelHtml(wheelIndex){
        let wheelHtml=`<div id="wheel${wheelIndex}Controls">
                        <p>
                            <a class="btn btn-primary" data-toggle="collapse" href="#wheel${wheelIndex}Collapse" aria-expanded="false" aria-controls="wheel${wheelIndex}Collapse">
                                Wheel ${wheelIndex} Controls ${wheelIndex===1?"(innermost)":""} ${wheelIndex===4?"(outermost)":""}
                            </a>
                        </p>
                        <div class="collapse" id="wheel${wheelIndex}Collapse">
                            <div class="input-group" id="wheel${wheelIndex}selector">
                                <select class="form-control" title="wheel${wheelIndex}" id="wheelSelector${wheelIndex}">
                                </select>
                                <div class="input-group" id="tadOffsetWheel${wheelIndex}Group">
                                    <label for="tadOffsetWheel${wheelIndex}Selector" class="col-form-label">TadOffset:</label>
                                    <select class="form-control" title="wheel${wheelIndex}" id="tadOffsetWheel${wheelIndex}Selector">
                                        <option value="0">0</option>
                                        <option value="1" selected>1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                    </select>
                                </div>
                                <div class="input-group" id="geneMutTypesWheel${wheelIndex}">
                                    <br>
                                    <label class="custom-control custom-checkbox active">
                                        <input id="includeFunctionalWheel${wheelIndex}" type="checkbox" class="custom-control-input" checked>
                                        <span class="custom-control-indicator"></span>
                                        <span class="custom-control-description">Functional SmallVar</span>
                                    </label>
                                    <label class="custom-control custom-checkbox active">
                                        <input id="includeUTR5Wheel${wheelIndex}" type="checkbox" class="custom-control-input">
                                        <span class="custom-control-indicator"></span>
                                        <span class="custom-control-description">UTR5 SmallVar</span>
                                    </label>
                                    <label class="custom-control custom-checkbox active">
                                        <input id="includeUTR3Wheel${wheelIndex}" type="checkbox" class="custom-control-input">
                                        <span class="custom-control-indicator"></span>
                                        <span class="custom-control-description">UTR3 SmallVar</span>
                                    </label>
                                    ${!this.commonSettings.wesMode?`<label class="custom-control custom-checkbox active"><input id="includeUpstreamWheel${wheelIndex}" type="checkbox" class="custom-control-input"><span class="custom-control-indicator"></span><span class="custom-control-description">Upstream SmallVar</span></label>`:""}
                                    ${!this.commonSettings.wesMode?`<label class="custom-control custom-checkbox active"><input id="includeDownstreamWheel${wheelIndex}" type="checkbox" class="custom-control-input"><span class="custom-control-indicator"></span><span class="custom-control-description">Downstream SmallVar</span></label>`:""}
                                    ${!this.commonSettings.wesMode?`<label class="custom-control custom-checkbox active"><input id="includeDirectSvWheel${wheelIndex}" type="checkbox" class="custom-control-input"><span class="custom-control-indicator"></span><span class="custom-control-description">Direct SV</span></label>`:""}
                                    <label class="custom-control custom-checkbox active">
                                        <input id="includeAmpWheel${wheelIndex}" type="checkbox" class="custom-control-input">
                                        <span class="custom-control-indicator"></span>
                                        <span class="custom-control-description">Amplification</span>
                                    </label>
                                    <label class="custom-control custom-checkbox active">
                                        <input id="includeHomdelWheel${wheelIndex}" type="checkbox" class="custom-control-input">
                                        <span class="custom-control-indicator"></span>
                                        <span class="custom-control-description">HomDel</span>
                                    </label>
                                    <label class="custom-control custom-checkbox active">
                                        <input id="includeSynonymousWheel${wheelIndex}" type="checkbox" class="custom-control-input">
                                        <span class="custom-control-indicator"></span>
                                        <span class="custom-control-description">Synonymous SNV</span>
                                    </label>
                                    <label class="custom-control custom-checkbox active">
                                        <input id="includeDoubleHitAlt1Wheel${wheelIndex}" type="checkbox" class="custom-control-input">
                                        <span class="custom-control-indicator"></span>
                                        <span class="custom-control-description">
                                            DoubleHit (CNV/LOH+Functional SmallVar)
                                        </span>
                                    </label>
                                    ${!this.commonSettings.wesMode?`<label class="custom-control custom-checkbox active"><input id="includeDoubleHitAlt2Wheel${wheelIndex}" type="checkbox" class="custom-control-input"><span class="custom-control-indicator"></span><span class="custom-control-description">DoubleHit (CNV/LOH+Functional SmallVar/Direct SV)</span></label>`:""}
                                    ${!this.commonSettings.wesMode?`<label class="custom-control custom-checkbox active"><input id="includeDoubleHitAlt3Wheel${wheelIndex}" type="checkbox" class="custom-control-input"><span class="custom-control-indicator"></span><span class="custom-control-description">DoubleHit (SmallVar+Direct SV)</span></label>`:""}
                                    ${!this.commonSettings.wesMode?`<label class="custom-control custom-checkbox active"><input id="includeFusionCorrectWheel${wheelIndex}" type="checkbox" class="custom-control-input"><span class="custom-control-indicator"></span><span class="custom-control-description">GeneFusion (correct orientation)</span></label>`:""}
                                    ${!this.commonSettings.wesMode?`<label class="custom-control custom-checkbox active"><input id="includeFusionIncorrectWheel${wheelIndex}" type="checkbox" class="custom-control-input"><span class="custom-control-indicator"></span><span class="custom-control-description">GeneFusion (incorrect orientation)</span></label>`:""}
                                </div>
                            </div>
                        </div>`;
        $('#wheelControls').append(wheelHtml);
    }
    readGeneMutTypes(callback){
        let wheelClasses=[];
        for(let i=1;i<=4;++i){
            wheelClasses[i-1]=document.getElementById(`wheelSelector${i}`).value;
        }
        let allSelections=new Set(wheelClasses);
        if(!allSelections.has("cyt")){
            window.alert('At least one wheel has to be "cytobands"');
            return false;
        }
        let wheelMutTypes=[new Set(),new Set(),new Set(),new Set()];
        for(let i=1;i<=4;++i){
            if(wheelClasses[i-1]==="gene"){
                if($(`#includeFunctionalWheel${i}`).is(':checked')){
                    [12,13,32,33,34,35,36,37,38,39,40,41,42,43,24,25,26,29,30,31].forEach((m)=>{
                        wheelMutTypes[i-1].add(m);
                    });
                }
                if($(`#includeUTR5Wheel${i}`).is(':checked')){
                    [4,5,6,23].forEach((m)=>{
                        wheelMutTypes[i-1].add(m);
                    });
                }
                if($(`#includeUTR3Wheel${i}`).is(':checked')){
                    [1,2,3].forEach((m)=>{
                        wheelMutTypes[i-1].add(m);
                    });
                }
                if($(`#includeAmpWheel${i}`).is(':checked')){
                    wheelMutTypes[i-1].add(7);
                }
                if($(`#includeHomdelWheel${i}`).is(':checked')){
                    wheelMutTypes[i-1].add(15);
                }
                if($(`#includeSynonymousWheel${i}`).is(':checked')){
                    wheelMutTypes[i-1].add(48);
                }
                if($(`#includeDoubleHitAlt1Wheel${i}`).is(':checked')){
                    wheelMutTypes[i-1].add(57);
                }
                if(!this.commonSettings.wesMode){
                    if($(`#includeUpstreamWheel${i}`).is(':checked')){
                        [52,53,54].forEach((m)=>{
                            wheelMutTypes[i-1].add(m);
                        });
                    }
                    if($(`#includeDownstreamWheel${i}`).is(':checked')){
                        [9,10,11].forEach((m)=>{
                            wheelMutTypes[i-1].add(m);
                        });
                    }
                    if($(`#includeDirectSvWheel${i}`).is(':checked')){
                        wheelMutTypes[i-1].add(8);
                    }
                    if($(`#includeDoubleHitAlt2Wheel${i}`).is(':checked')){
                        wheelMutTypes[i-1].add(58);
                    }
                    if($(`#includeDoubleHitAlt3Wheel${i}`).is(':checked')){
                        wheelMutTypes[i-1].add(59);
                    }
                    if($(`#includeFusionCorrectWheel${i}`).is(':checked')){
                        wheelMutTypes[i-1].add(60);
                    }
                    if($(`#includeFusionIncorrectWheel${i}`).is(':checked')){
                        wheelMutTypes[i-1].add(61);
                    }
                }
            }
        }
        let tmpGeneMutTypes =new Set([
            ...wheelMutTypes[0],
            ...wheelMutTypes[1],
            ...wheelMutTypes[2],
            ...wheelMutTypes[3]]);
        this.wheelClasses=wheelClasses;
        this.wheelGeneMutTypes=wheelMutTypes;
        this.tadOffsets=[
            parseInt(document.getElementById('tadOffsetWheel1Selector').value),
            parseInt(document.getElementById('tadOffsetWheel2Selector').value),
            parseInt(document.getElementById('tadOffsetWheel3Selector').value),
            parseInt(document.getElementById('tadOffsetWheel4Selector').value)];
        let dataFetchingNeeded=false;
        if(tmpGeneMutTypes.size>0){
            if(!eqSet(tmpGeneMutTypes,this.commonSettings.currentGeneMutTypes)){
                this.commonSettings.currentGeneMutTypes=tmpGeneMutTypes;
                dataFetchingNeeded=true;
            }
        }
        if(dataFetchingNeeded){
            let q = d3Xqueue();
            q.defer((callback2)=>{this.cohortData.fetchCurrentGeneVariantData(callback2);});
            q.awaitAll(()=>{
                callback(null);
            });
        }else{
            callback(null);
        }
    }
    readWheelChoices(initMode){
        let trueClasses=0;
        for(let i=0;i<4;++i){
            if(this.wheelClasses[i]!=="cyt"&&this.wheelClasses[i]!=="off"){
                trueClasses+=1;
            }
        }
        let standardWheelWidths=[60,60,60,45];
        let cytobandWheelWidths=[25,25,15,15];
        let widthPerWheelClass={
            "sv":standardWheelWidths[trueClasses],
            "ind":standardWheelWidths[trueClasses],
            "cnv":standardWheelWidths[trueClasses],
            "loh":standardWheelWidths[trueClasses],
            "cnnloh":standardWheelWidths[trueClasses],
            "cnvloh":standardWheelWidths[trueClasses],
            "gene":standardWheelWidths[trueClasses],
            "cyt":cytobandWheelWidths[trueClasses],
            "off":5
        };

        let wheel4End=this.commonSettings.chromosomeAxisRadius;
        let wheel4Begin=wheel4End-widthPerWheelClass[this.wheelClasses[3]];
        let wheel3Begin=wheel4Begin-widthPerWheelClass[this.wheelClasses[2]];
        let wheel2Begin=wheel3Begin-widthPerWheelClass[this.wheelClasses[1]];
        let wheel1Begin=wheel2Begin-widthPerWheelClass[this.wheelClasses[0]];
        let newSvRadius=wheel1Begin-this.commonSettings.wheelGap;
        if(this.commonSettings.svRadius!==newSvRadius){
            this.commonSettings.svRadius=newSvRadius;
        }


        let wheelBegins=[wheel1Begin,wheel2Begin,wheel3Begin,wheel4Begin];
        let widths=[
            widthPerWheelClass[this.wheelClasses[0]],
            widthPerWheelClass[this.wheelClasses[1]],
            widthPerWheelClass[this.wheelClasses[2]],
            widthPerWheelClass[this.wheelClasses[3]],
        ];
        for(let i=0;i<4;++i){
            if(this.wheelClasses[i]!=="gene"){
                let data=(this.wheelClasses[i]==="cyt")?this.references.cytobands:this.references.tads;
                setTimeout(()=>{this.wheels[i].updateWheel(this.wheelClasses[i],wheelBegins[i],widths[i],data,this.tadOffsets[i],this.wheelGeneMutTypes[i],initMode);},0);
            }
        }
        if(this.commonSettings.currentGeneMutTypes.size>0 ) {
            for (let i = 0; i < 4; ++i) {
                if (this.wheelClasses[i] === "gene") {
                    setTimeout(() => {
                        this.wheels[i].updateWheel(this.wheelClasses[i], wheelBegins[i], widths[i], this.cohortData.currentGeneMutRecurrence, this.tadOffsets[i], this.wheelGeneMutTypes[i],initMode);
                    }, 0);
                }
            }
        }

        let variantViewTsvExportTargetSelectorHandle = $('#variantViewTsvExportTargetSelector');
        variantViewTsvExportTargetSelectorHandle.empty();
        variantViewTsvExportTargetSelectorHandle.append('<option value="-1">Select Export Target</option>');
        for(let i=0;i<4;++i){
            if(this.wheelClasses[i]!=="cyt"){
                variantViewTsvExportTargetSelectorHandle.append(`<option value="wheel${i+1}Recurrence">Wheel ${i+1} Recurrence (${this.wheelClasses[i]})</option>`);
            }
        }
        variantViewTsvExportTargetSelectorHandle.append('<option value="visibleSv">Visible Structural Variant Data</option>');
        variantViewTsvExportTargetSelectorHandle.append('<option value="visibleSmallvar">Visible Small Variant Data</option>');
        return true;
    }
    updateAngles(){
        setTimeout(()=>{this.horizontalAxisGenerator.generate()},0);
        for (let i = 0; i < 4; ++i) {
            setTimeout(()=>{this.wheels[i].updateAngles()},0);
        }
    }
    plot(){
        setTimeout(()=>{this.horizontalAxisGenerator.generate()},0);
        for (let i = 0; i < 4; ++i) {
            setTimeout(()=>{
                this.wheels[i].plot();
            },0);
        }
    }
    controls(){
        for(let i=1;i<=4;++i){
            $(`#wheelSelector${i}`).off("change").on("change",function(){
                if(this.value==="gene"){
                    switchElements([],[`geneMutTypesWheel${i}`]);
                }else{
                    $(`#includeFunctionalWheel${i}`).prop('checked', true);
                    $(`#includeDirectSvWheel${i}`).prop('checked', false);
                    $(`#includeDownstreamWheel${i}`).prop('checked', false);
                    $(`#includeSynonymousWheel${i}`).prop('checked', false);
                    $(`#includeUpstreamWheel${i}`).prop('checked', false);
                    $(`#includeUTR3Wheel${i}`).prop('checked', false);
                    $(`#includeUTR5Wheel${i}`).prop('checked', false);
                    $(`#includeAmpWheel${i}`).prop('checked', false);
                    $(`#includeHomdelWheel${i}`).prop('checked', false);
                    switchElements([`geneMutTypesWheel${i}`],[]);
                }
                if(this.value==="sv" || this.value==="ind"){
                    switchElements([],[`tadOffsetWheel${i}Group`]);
                }else{
                    switchElements([`tadOffsetWheel${i}Group`],[]);
                }
                if(this.value==="cyt"){
                    switchElements([`maxRecWheel${i}Group`],[]);
                }else{
                    switchElements([],[`maxRecWheel${i}Group`]);
                }
            });
        }
    }
    addGeneLabel(geneId){
        for(let i=0; i<4; ++i){
            if(this.wheelClasses[i]==="cyt"){
                this.wheels[i].wheel1.addGeneLabel(geneId,false);
                return;
            }
        }
    }
    textExport(wheelIndex){
        return this.wheels[wheelIndex].textExport(this.cohortMetadata);
    }
}