import {select as d3Xselect,path  as d3Xpath,event as d3Xevent} from 'd3';
import {polarToCartesian} from "../Utils";

export class VariantViz {
    constructor(focusedMode){
        this.focusedMode=focusedMode;
        this.references=null;
        this.cohortMetadata=null;
        this.selectionManager=null;
        this.fontManager=null;
        this.selectedSubcohortIndex=null;
        this.svg=null;
        this.data=[];
        this.elementGroup=null;
        this.elementTracerGroup=null;
        this.svMode=false;
        this.elementClassPrefix="";
        this.selectedDonors=new Set();
        this.currentIndex=-1;
        this.constructed=false;
        this.blacklistedIndices=new Set();
        this.anyVdjTra=false;
        this.lockDisplay=false;
        this.vdjCountMapper=new Map();
    }
    init(commonSettings,references,cohortMetadata,selectionManager,fontManager,selectedSubcohortIndex,data,elementClassPrefix){
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.fontManager=fontManager;
        this.selectedSubcohortIndex=selectedSubcohortIndex;
        this.selectedDonors=this.selectionManager.registeredSubcohorts.get(this.selectedSubcohortIndex);
        this.svg=commonSettings.mainSvg;
        this.data=data;
        this.indexMapper=new Map();
        if(this.focusedMode){
            for(let i=0;i<data.length;++i){
                this.indexMapper.set(this.data[i].getIndex(),i);
            }
        }
        this.elementGroup=this.svg.append("g");
        this.labelGroup=this.svg.append("g");
        this.elementTracerGroup=this.svg.append("g");
        this.svMode=elementClassPrefix!=="smallVariant";
        this.vdjSvMode=elementClassPrefix==="vdjSv";
        if(this.vdjSvMode){
            if(this.data.length>0){
                this.anyVdjTra=true;
                $('#vdjTraModeGroup').css('display','inline');
            }
        }
        this.vdjCountMapper.clear();
        this.elementClassPrefix=elementClassPrefix;
        this.constructed=true;
        this.estimateInitialEvent();
    }
    estimateInitialEvent(){
        if(this.data.length>0){
            let foundMatch=false;
            for(let i=0; i<this.data.length;++i){
                if(!this.blacklistedIndices.has(i)&&this.selectedDonors.has(this.data[i].donorIndex)){
                    this.currentIndex=i;
                    foundMatch=true;
                    break;
                }
            }
            if(!foundMatch){
                this.destroy();
            }
        }
    }
    destroy(){
        if(!this.constructed){
            return;
        }
        $(`#${this.elementClassPrefix}Counter`).html("NONE FOUND");
        $(`#${this.elementClassPrefix}Description`).html("");
        this.constructed=false;
        this.lockDisplay=false;
        this.currentIndex=-1;
        // this.data.length=0;
        this.elementGroup.selectAll('*').remove();
        this.labelGroup.selectAll('*').remove();
        this.elementTracerGroup.selectAll('*').remove();
    }
    enableControls(){
        if(!this.constructed){
            return;
        }
        this.elementGroup.on("click", ()=> {
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            let target=d3Xselect(d3Xevent.target).datum();
            let targetIndex=0;
            try {
                targetIndex = target.getIndex();
            }catch(err){
                console.error(err);
                this.commonSettings.fastRelease();
                return;
            }
            let realIndex=targetIndex;
            if(this.focusedMode && this.indexMapper.has(targetIndex)){
                realIndex=this.indexMapper.get(targetIndex);
            }
            this.goToEntry(realIndex);
            this.commonSettings.fastRelease();
        });
        $(`#${this.elementClassPrefix}Blacklist`).off('click').on('click',()=>{
            this.blacklistEvent(this.currentIndex);
            $('.nav-tabs a[href="#controlsPane"]').tab("show");
        });
        $(`#${this.elementClassPrefix}SweepLeft`).off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            let i=0;
            let foundMatch=false;
            while(i<this.data.length){
                this.sweepLeft();
                if(!this.blacklistedIndices.has(this.currentIndex)&&this.selectedDonors.has(this.data[this.currentIndex].donorIndex)){
                    foundMatch=true;
                    break;
                }
                ++i;
            }
            if(foundMatch){
                this.goToEntry(this.currentIndex);
            }
            this.commonSettings.fastRelease();
        });
        $(`#${this.elementClassPrefix}SweepRight`).off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            let i=0;
            let foundMatch=false;
            while(i<this.data.length){
                this.sweepRight();
                if(!this.blacklistedIndices.has(this.currentIndex)&&this.selectedDonors.has(this.data[this.currentIndex].donorIndex)){
                    foundMatch=true;
                    break;
                }
                ++i;
            }
            if(foundMatch){
                this.goToEntry(this.currentIndex);
            }
            this.commonSettings.fastRelease();
        });
        $(`#${this.elementClassPrefix}DescriptionPaneControl`).off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            if(this.currentIndex!==-1){
                this.goToEntry(this.currentIndex);
            }
            this.commonSettings.releaseLock();
        });
        if(this.vdjSvMode){
            this.plotVdjMarkers();
        }
    }
    cleanup(){
        if(!this.constructed){
            return;
        }
        this.elementGroup.selectAll("*").remove();
        this.labelGroup.selectAll("*").remove();
    }
    sweepLeft(){
        if(this.currentIndex!==0){
            this.currentIndex-=1;
        }else{
            this.currentIndex=this.data.length-1;
        }
    }
    sweepRight(){
        if(this.currentIndex!==this.data.length-1){
            this.currentIndex+=1;
        }else{
            this.currentIndex=0;
        }
    }
    goToEntry(index){
        let descContainer=$(`#${this.elementClassPrefix}Description`);
        descContainer.empty();
        this.currentIndex=index;
        let annotation=this.data[this.currentIndex].annotate(this.references,this.cohortMetadata);
        this.addTracer(this.data[this.currentIndex]);
        $(`#${this.elementClassPrefix}DescriptionPaneControl`).css("display","inline");
        descContainer.html(annotation);
        $(`#${this.elementClassPrefix}Counter`).html(`${this.currentIndex+1}/${this.data.length}`);
        $(`.nav-tabs a[href="#${this.elementClassPrefix}DescriptionPane"]`).tab("show");
    }
    plot(){
        if(!this.constructed){
            return;
        }
        this.cleanup();
        if(this.vdjSvMode){
            if(this.anyVdjTra){
                this.elementGroup.selectAll("*")
                    .data(this.data)
                    .enter().append("path")
                    .attr("id",(d)=>{return `${this.elementClassPrefix}_${d.getIndex()}`;})
                    .attr("class",(d)=>{
                        if(d.vdjGrade>0){
                            return "variant9"
                        }
                        return `variant${this.references.variantVizTypes[d.eventTypeVizIndex].variantVizTypeIndex}`;
                    });
                this.updateOpacity(0);
                this.updateVisibility();
                this.updatePaths();
            }
        }else{
            if(!this.svMode){
                this.elementGroup.selectAll("*")
                    .data(this.data)
                    .enter().append("path")
                    .attr("class",(d)=>{return `variant${this.references.variantVizTypes[d.eventTypeVizIndex].variantVizTypeIndex}`;});
            }else{
                this.elementGroup.selectAll("*")
                    .data(this.data)
                    .enter().append("path")
                    .attr("class",(d)=>{return `variant${this.references.variantVizTypes[d.eventTypeVizIndex].variantVizTypeIndex}`;});
            }
            this.updateOpacity(0);
            this.updateVisibility();
            this.updatePaths();
        }
    }
    plotVdjMarkers(){
        if(!this.constructed){
            return;
        }
        const cytobandAndGeneLabelFont = this.fontManager.fontTree.get("variantViewFontTargetSelector").get("cytobandAndGeneLabels").generateFontCssText();
        this.labelGroup.selectAll("*").remove();
        for(let i=0; i<this.data.length;++i){
            const d=this.data[i];
            if(this.blacklistedIndices.has(d.getIndex())){
                continue;
            }
            if(!this.selectedDonors.has(d.donorIndex)){
                continue;
            }
            if(d.vdjTargets.length===0){
                continue;
            }
            const currentGrade=d.vdjGrade;
            d.vdjTargets.forEach((x)=>{
                if(!this.vdjCountMapper.has(x)){
                    this.vdjCountMapper.set(x,new Map());
                }
                if(this.vdjCountMapper.get(x).has(d.donorIndex)){
                    const currentBestGrade=this.vdjCountMapper.get(x).get(d.donorIndex);
                    if(currentGrade<currentBestGrade){
                        this.vdjCountMapper.get(x).set(d.donorIndex,currentGrade);
                    }
                }else{
                    this.vdjCountMapper.get(x).set(d.donorIndex,currentGrade);
                }
            });
        }
        for(let i=0; i<this.data.length;++i){
            const combinedTarget=this.data[i].getVdjLabel(this.references,null);
            // const combinedTargetWithCounts=this.data[i].getVdjLabel(this.references,this.vdjCountMapper,this.commonSettings.maxVdjGrade);
            const vdjLabelId=`vdjSvLabel_${this.data[i].getIndex()}`;
            const vdjGrade=this.data[i].vdjGrade;
            const vdjLabelIdPre=`vdjSvLabelPre_${this.data[i].getIndex()}`;
            this.labelGroup.append("text")
                .attr("id", vdjLabelIdPre)
                .style("display","none")
                .append("textPath")
                .attr("class","vdjSvLabel")
                .attr("xlink:href", `#${this.elementClassPrefix}_${this.data[i].getIndex()}`)
                .attr("vdjTarget",combinedTarget)
                .attr("vdjGrade",vdjGrade)
                .attr("class","vdjSvLabel")
                .attr("id", vdjLabelId)
                .style("display","none")
                .style("font",cytobandAndGeneLabelFont)
                // .text(combinedTargetWithCounts)
                .on("click",()=>{
                    this.data[i].vdjTargets.forEach((x)=>{
                        this.references.genes.get(x).launchDefaultDb();
                    });
                })
                .on("contextmenu", ()=> {
                    d3Xevent.preventDefault();
                    this.blacklistEvent(this.data[i].getIndex());
                });
        }
    }
    switchVdjMode(){
        if(!this.constructed || this.lockDisplay){
            return;
        }
        if(!this.anyVdjTra){
            if($('#vdjTraMode').is(':checked')){
                this.elementGroup.selectAll("*").style("display","none");
            }else{
                this.updateVisibility();
            }
        }else{
            if($('#vdjTraMode').is(':checked')){
                this.replotVdjLabels();
            }else{
                this.updateVisibility();
                this.labelGroup.selectAll("*")
                    .style("display","none");
            }
        }
    }
    replotVdjLabels(){
        this.labelGroup.selectAll("*")
            .style("display","none");
        let thisRef=this;
        let encounteredVdjTargets = new Set();
        this.elementGroup.selectAll("*")
            .style("display", function() {
                let d = d3Xselect(this).datum();
                if(thisRef.blacklistedIndices.has(d.getIndex())){
                    return "none";
                }
                if(!thisRef.selectedDonors.has(d.donorIndex)){
                    return "none";
                }
                if(d.vdjGrade>thisRef.commonSettings.maxVdjGrade){
                    return "none";
                }
                const currentId=$(this).attr("id");
                const id=currentId.replace(thisRef.elementClassPrefix,"vdjSvLabel");
                const idPre=currentId.replace(thisRef.elementClassPrefix,"vdjSvLabelPre");
                const targetHandle=$(`#${id}`);
                const targetHandlePre=$(`#${idPre}`);
                const newLabel=d.getVdjLabel(thisRef.references,thisRef.vdjCountMapper,thisRef.commonSettings.maxVdjGrade);
                targetHandle.text(newLabel);
                const vdjTarget=targetHandle.attr("vdjTarget");
                if(!encounteredVdjTargets.has(vdjTarget)){
                    targetHandle.css("display","inline");
                    targetHandlePre.css("display","inline");
                    encounteredVdjTargets.add(vdjTarget);
                }else{
                    targetHandle.css("display","none");
                    targetHandlePre.css("display","none");
                }
                return "inline";
            });
    }
    blacklistEvent(index){
        if(!this.constructed){
            return;
        }
        $(`#vdjSvLabel_${index}`).remove();
        this.tracerCleanup();
        this.blacklistedIndices.add(index);
        this.estimateInitialEvent();
        this.updateVisibility();
        if(this.anyVdjTra){
            if($('#vdjTraMode').is(':checked')){
                this.switchVdjMode();
            }
        }
    }
    updateOpacity(){
        if(!this.constructed){
            return;
        }
        let thisRef=this;
        if(this.svMode){
            this.elementGroup.selectAll("*")
                .style("opacity",function(){
                    let variant = d3Xselect(this).datum();
                    let opacity = 1;
                    if(!thisRef.focusedMode&&thisRef.commonSettings.hyperzoomMode<2 && variant.eventTypeVizIndex<6){
                        opacity=variant.clonality / thisRef.commonSettings.transparencyScaling;
                    }
                    return opacity;
                });
        }else{
            this.elementGroup.selectAll("*")
                .style("opacity",1);
        }
    }
    updatePaths(){
        if(!this.constructed){
            return;
        }
        this.elementTracerGroup.selectAll("*").remove();
        let thisRef=this;
        this.elementGroup.selectAll("*")
            .attr("d",function(){
                const variant = d3Xselect(this).datum();
                let eventHeight=0.15;
                if(thisRef.svMode){
                    eventHeight=variant.getEventHeight();
                }
                let path = d3Xpath();
                if(variant.eventTypeIndex!==7){
                    const startAngle = thisRef.references.genomicTheta(variant.startChrIndex, variant.startPos);
                    const endAngle = thisRef.references.genomicTheta(variant.endChrIndex, variant.endPos);
                    const [startCartesianX, startCartesianY] = polarToCartesian(thisRef.commonSettings.svRadius, startAngle);
                    const [endCartesianX, endCartesianY] = polarToCartesian(thisRef.commonSettings.svRadius, endAngle);
                    const [controlX, controlY] = polarToCartesian((1 - eventHeight) * thisRef.commonSettings.svRadius, 0.5 * (startAngle + endAngle));
                    path.moveTo(startCartesianX, startCartesianY);
                    path.quadraticCurveTo(controlX, controlY, endCartesianX, endCartesianY);
                }else{
                    const endAngle = thisRef.references.genomicTheta(variant.startChrIndex, variant.startPos);
                    const startAngle = thisRef.references.genomicTheta(variant.endChrIndex, variant.endPos);
                    const [startCartesianX, startCartesianY] = polarToCartesian(thisRef.commonSettings.svRadius, startAngle);
                    const [endCartesianX, endCartesianY] = polarToCartesian(thisRef.commonSettings.svRadius, endAngle);
                    const [controlX, controlY] = polarToCartesian((1 - eventHeight) * thisRef.commonSettings.svRadius, 0.5 * (startAngle + endAngle));
                    path.moveTo(startCartesianX, startCartesianY);
                    path.quadraticCurveTo(controlX, controlY, endCartesianX, endCartesianY);
                }
                return path;
            });
    }
    updateVisibility(){
        if(!this.constructed){
            return;
        }
        let thisRef=this;
        const vdjMode=$('#vdjTraMode').is(':checked');
        if(this.svMode){
            let toForceDraw = new Set();
            this.elementGroup.selectAll("*")
                .style("display", function() {
                    let d = d3Xselect(this).datum();
                    if(thisRef.blacklistedIndices.has(d.getIndex())){
                        return "none";
                    }
                    if(!thisRef.selectedDonors.has(d.donorIndex)){
                        return "none";
                    }
                    if(d.eventTypeVizIndex===6 || d.eventTypeVizIndex===7){
                        if(d.vdjGrade<=thisRef.commonSettings.maxVdjGrade){
                            // if(d.vdjGrade>0){
                            //     toForceDraw.add(d.parentVdjIndex);
                            // }
                            return "inline";
                        }else{
                            if(vdjMode){
                                return "none";
                            }
                        }
                    }else{
                        if(vdjMode){
                            return "none";
                        }
                    }
                    if(!thisRef.focusedMode && d.maxRecurrence < thisRef.commonSettings.minRecurrence){
                        return "none";
                    }else{
                        return "inline";
                    }
                });
            // while (toForceDraw.size>0){
            //     let toForceDrawNew=new Set();
            //     this.elementGroup.selectAll("*")
            //         .style("display", function() {
            //             let d = d3Xselect(this).datum();
            //             if(toForceDraw.has(d.svIndex)){
            //                 if(d.vdjGrade>0){
            //                     toForceDrawNew.add(d.parentVdjIndex);
            //                 }
            //                 return "inline";
            //             }
            //         });
            //     toForceDraw=toForceDrawNew;
            // }
        }else{
            this.elementGroup.selectAll("*").style("display", "inline");
        }
    }
    targetedIndexedDisplay(indicesToDisplay){
        if(!this.constructed){
            return;
        }
        this.elementGroup.selectAll("*")
            .style("display", function() {
                let d = d3Xselect(this).datum();
                if(!indicesToDisplay.has(d.getIndex())){
                    return "none";
                }
                return "inline";
            });
        if(this.vdjSvMode){
            this.labelGroup.selectAll("*").style("display","none");
            indicesToDisplay.forEach((x)=>{
                $(`#vdjSvLabel_${x}`).css("display","inline");
                $(`#vdjSvLabelPre_${x}`).css("display","inline");
            });
        }
    }
    tracerCleanup(){
        if(!this.constructed){
            return;
        }
        this.elementTracerGroup.selectAll("*").remove();
    }
    addTracer(variantItem){
        if(!this.constructed){
            return;
        }
        this.references.tracerMultiCleanup();
        let eventHeight=0.15;
        if(this.svMode || this.vdjSvMode){
            eventHeight=variantItem.getEventHeight();
        }
        const startAngle = this.references.genomicTheta(variantItem.startChrIndex, variantItem.startPos);
        const endAngle = this.references.genomicTheta(variantItem.endChrIndex, variantItem.endPos);
        const [startCartesianX, startCartesianY] = polarToCartesian(this.commonSettings.svRadius, startAngle);
        const [endCartesianX, endCartesianY] = polarToCartesian(this.commonSettings.svRadius, endAngle);
        const [controlX, controlY] = polarToCartesian((1 - eventHeight) * this.commonSettings.svRadius, 0.5 * (startAngle + endAngle));
        let path = d3Xpath();
        path.moveTo(startCartesianX, startCartesianY);
        path.quadraticCurveTo(controlX, controlY, endCartesianX, endCartesianY);
        this.elementTracerGroup
            .append("path")
            .attr("class", "dummyEvents")
            .attr('id','dummyEvent')
            .attr('d',path)
            .style('display','none');
        const pathEl = $('#dummyEvent')[0];
        let eventMarkers = [];
        for(let x of [0,0.2,0.4,0.6,0.8,1]){
            let point = pathEl.getPointAtLength(pathEl.getTotalLength()*x);
            eventMarkers.push([point.x,point.y])
        }
        this.elementTracerGroup.selectAll(".markerCircle")
            .data(eventMarkers)
            .enter().append("circle")
            .attr("class", "markerCircle")
            .attr('cx',(d)=>{return d[0];})
            .attr('cy',(d)=>{return d[1];})
            .attr('r', this.commonSettings.eventMarkerRadius)
            .on("contextmenu",()=>{
                d3Xevent.preventDefault();
                this.elementTracerGroup.selectAll("*").remove();
            });
    }
    hideAll(){
        if(!this.constructed){
            return;
        }
        this.lockDisplay=true;
        this.elementGroup.selectAll("*").style("display", "none");
        this.labelGroup.selectAll("*").remove();
        this.tracerCleanup();
    }
    textExport(){
        let outputChunks=[];
        for(let i=0;i<this.data.length;++i){
            outputChunks.push(this.data[i].textExport(this.references,this.cohortMetadata));
        }
        return outputChunks;
    }
}