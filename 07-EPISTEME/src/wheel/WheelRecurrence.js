import {scaleLinear as d3XscaleLinear, axisBottom as d3XaxisBottom, arc as d3Xarc,select as d3Xselect, event as d3Xevent} from 'd3';
import {discreteColour, range} from "../Utils";

export class WheelRecurrence {
    constructor(commonSettings,
                references,
                selectionManager,
                selectedSubcohortIndex,
                selectedDiffSubcohortIndex,
                innerRadius,
                wheelWidth,
                data,
                dataFields,
                dataMode,
                halfMode,
                inverseMode,
                elementClassPrefix,
                pureMaxRecurrenceInit,
                maxRecurrenceAdjustmentSliderId,
                allowedMutationTypes,
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
        this.innerRadius=innerRadius;
        this.wheelWidth=wheelWidth;
        this.halfMode=halfMode;
        if(!inverseMode){
            this.wheelWidth-=this.commonSettings.wheelGap;
        }
        this.outerRadius=this.innerRadius+this.wheelWidth;
        this.svg=commonSettings.mainSvg;
        this.data=data;
        this.dataFields=dataFields;
        this.dataMode=dataMode;
        this.elementGroup=this.svg.append("g");
        this.inverseMode=inverseMode;
        this.elementClassPrefix=elementClassPrefix;
        this.svg.selectAll(this.elementClassPrefix).remove();
        this.elementClassPrefixVerticalAxis1=`${this.elementClassPrefix}_va1`;
        this.elementClassPrefixVerticalAxis2=`${this.elementClassPrefix}_va2`;
        this.elementIndexPrefix=`${this.elementClassPrefix}_Index`;
        this.maxRecurrence=pureMaxRecurrenceInit;
        this.forcedMaxRecurrence=Math.max(2,this.maxRecurrence);
        this.allowedMutationTypes=allowedMutationTypes;
        this.singlePatientMode=this.selectedDonors.size===1;
    }
    enableControls(){
        this.elementGroup.on("click", ()=> {
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            try {
                let currentIndex=d3Xselect(d3Xevent.target).datum().getIndex();
                if(this.dataMode!=="gene"){
                    this.references.emitTadClick(currentIndex,this.dataFields);
                }else{
                    this.references.emitGeneClick(currentIndex,this.allowedMutationTypes);
                }
            }catch(err){
                console.error(err);
                this.commonSettings.fastRelease();
                return;
            }
            this.commonSettings.fastRelease();
        });
        this.elementGroup.on("contextmenu", ()=> {
            d3Xevent.preventDefault();
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            if(this.dataMode==="gene"){
                const currentIndex=d3Xselect(d3Xevent.target).datum().getIndex();
                this.references.emitGeneLabel(currentIndex);
            }
            this.commonSettings.releaseLock();
        });
    }
    cleanup(){
        [
            this.elementClassPrefix,
            `chr${this.elementClassPrefix}`,
            this.elementClassPrefixVerticalAxis1,
            this.elementClassPrefixVerticalAxis2,
        ].forEach((x)=>{
            this.svg.selectAll(`.${x}`).remove();
        });
    }
    plot(){
        this.cleanup();
        let thisRef=this;
        let filterTmp = (this.dataMode==="ind"||this.dataMode==="cnv"||this.dataMode==="cnvloh"||this.dataMode==="cnnloh")?
            (d)=> { return d.chromosomeIndex<24 }:
            (d)=> { return true; };
        let svgMouseover = (this.dataMode==="gene")?
            (d)=> { return d.geneName }:
            (d)=> { let cyts=[]; d.cytobandIndices.forEach((x)=>{cyts.push(thisRef.references.cytobands[x].cytobandName)});return cyts.join(','); };
        this.elementGroup.selectAll(`.${this.elementClassPrefix}`)
            .data(this.data)
            .enter().append("path")
            .filter(filterTmp)
            .attr("class",this.elementClassPrefix)
            .attr(this.elementIndexPrefix,(d)=>{return d.getIndex();})
            .style("stroke-width", 0.1)
            .append("svg:title")
            .text(svgMouseover);
        this.updatePaths();
    }

    updateForcedMaxRecurrence(newForcedMaxRecurrence){
        this.forcedMaxRecurrence=newForcedMaxRecurrence;
        this.updatePaths();
    }
    resetForcedMaxRecurrence(){
        this.updateForcedMaxRecurrence(this.maxRecurrence);
    }
    updatePaths(){
        let thisRef=this;
        this.addChromosomeFrames();
        this.addVerticalAxis();
        if(!this.inverseMode){
            setTimeout(()=>{
                let customScale = d3XscaleLinear().domain([0, 1]).range(discreteColour(2));
                let recurrenceRatios=new Map();
                this.elementGroup.selectAll(`.${this.elementClassPrefix}`)
                    .attr("d",function(){
                        let item=d3Xselect(this).datum();
                        let angles=thisRef.getAngles(item);
                        let rec=thisRef.calculateRecurrence(item);
                        let recurrenceRatio=rec / thisRef.forcedMaxRecurrence;
                        recurrenceRatios.set(item.getIndex(),recurrenceRatio);
                        let outerRadius=thisRef.innerRadius +  Math.min(1,recurrenceRatio)* thisRef.wheelWidth;
                        return d3Xarc()
                            .innerRadius(thisRef.innerRadius)
                            .outerRadius(outerRadius)
                            .startAngle(angles[0])
                            .endAngle(angles[1])();
                    })
                    .attr("stroke",function(){
                        let item=d3Xselect(this).datum();
                        if(thisRef.dataMode==="gene"){
                            if(thisRef.selectedDonors.size===1){
                                if(item.cancerGene){
                                    return "red";
                                }else{
                                    return "blue";
                                }
                            }
                        }
                        return customScale(recurrenceRatios.get(item.getIndex()));
                    })
                    .attr("fill",function(){
                        let item=d3Xselect(this).datum();
                        if(thisRef.dataMode==="gene"){
                            if(thisRef.selectedDonors.size===1){
                                if(item.cancerGene){
                                    return "red";
                                }else{
                                    return "blue";
                                }
                            }
                        }
                        return customScale(recurrenceRatios.get(item.getIndex()));
                    });
            },0);
        }else{
            setTimeout(()=>{
                let customScale = d3XscaleLinear().domain([0, 1]).range(discreteColour(2).reverse());
                let recurrenceRatios=new Map();
                this.elementGroup.selectAll(`.${this.elementClassPrefix}`)
                    .attr("d",function(){
                        let item=d3Xselect(this).datum();
                        let angles=thisRef.getAngles(item);
                        let rec=thisRef.calculateRecurrence(item);
                        let recurrenceRatio=rec / thisRef.forcedMaxRecurrence;
                        recurrenceRatios.set(item.getIndex(),recurrenceRatio);
                        let innerRadius = thisRef.outerRadius - Math.min(1,recurrenceRatio) * thisRef.wheelWidth;
                        return d3Xarc()
                            .innerRadius(innerRadius)
                            .outerRadius(thisRef.outerRadius)
                            .startAngle(angles[0])
                            .endAngle(angles[1])();
                    })
                    .attr("stroke",function(){
                        const item=d3Xselect(this).datum();
                        return customScale(recurrenceRatios.get(item.getIndex()));
                    })
                    .attr("fill",function(){
                        const item=d3Xselect(this).datum();
                        return customScale(recurrenceRatios.get(item.getIndex()));
                    });
            },0);
        }

    }
    addVerticalAxis(){
        [
            this.elementClassPrefixVerticalAxis1,
            this.elementClassPrefixVerticalAxis2,
        ].forEach((x)=>{
            this.svg.selectAll(`.${x}`).remove();
        });
        let validChromosomes=new Set();
        for(let i=1;i<29;++i){
            validChromosomes.add(i);
        }
        let innerRadius=this.inverseMode?this.outerRadius:this.innerRadius;
        let outerRadius=this.inverseMode?this.innerRadius:this.outerRadius;
        let verticalAxisLabelFont=this.fontManager.fontTree.get("variantViewFontTargetSelector").get("verticalAxisLabels").generateFontCssText();
        this.references.chromosomes.forEach((d)=>{
            if(validChromosomes.has(d.chromosomeIndex)){
                let startAngle = this.references.genomicTheta(d.chromosomeIndex, d.startPos);
                let chromosomeScaleR = d3XscaleLinear()
                    .domain([0, this.forcedMaxRecurrence])
                    .range([innerRadius,outerRadius]);
                let tickValues=[];
                if(!this.halfMode){
                    let maxTicks=5;
                    tickValues=range(0,
                        Math.max(3, this.forcedMaxRecurrence) + 1, Math.max(1, (Math.max(3, this.forcedMaxRecurrence) - 2) / 4))
                        .slice(1, maxTicks);
                }else{
                    tickValues=[Math.max(1,Math.round(this.forcedMaxRecurrence*0.33)), Math.max(3, this.forcedMaxRecurrence)];
                }
                let chromosomeAxisR1 = d3XaxisBottom(chromosomeScaleR)
                    .tickSize(2.5)
                    .tickArguments([3])
                    .tickValues(tickValues);
                let prevIndex = (d.chromosomeIndex !== 1) ? (d.chromosomeIndex-2) : 85;
                let prevEndAngle = 0;
                if (d.chromosomeIndex !== 1) {
                    prevEndAngle = this.references.genomicTheta(
                        this.references.chromosomes[prevIndex].chromosomeIndex,
                        this.references.chromosomes[prevIndex].endPos);
                }else{
                    prevEndAngle=((prevEndAngle / Math.PI) % 1)*Math.PI;
                }
                let theta = (startAngle - 0.5 * Math.PI) * (180 / (Math.PI));
                if (d.chromosomeIndex===28) {
                    this.svg.append("g").attr("class", this.elementClassPrefixVerticalAxis1)
                        .attr("transform", `rotate(${theta})`)
                        .call(chromosomeAxisR1.tickSize(0).tickPadding(1))
                        .style("font", verticalAxisLabelFont);
                } else {
                    this.svg.append("g")
                        .attr("class", this.elementClassPrefixVerticalAxis2)
                        .attr("transform", `rotate(${theta})`)
                        .call(chromosomeAxisR1.tickFormat(""));
                }
            }
        });
    }

    addChromosomeFrames(){
        [
            `chr${this.elementClassPrefix}`,
        ].forEach((x)=>{
            this.svg.selectAll(`.${x}`).remove();
        });
        if(this.dataMode==="off"){
            return;
        }
        let thisRef=this;
        this.elementGroup.selectAll(`.chr${this.elementClassPrefix}`)
            .data(this.references.chromosomes)
            .enter().append("path")
            .attr("class", `chr${this.elementClassPrefix}`)
            .attr(this.elementIndexPrefix, (d)=>{return `chr${d.chromosomeIndex}`;})
            .attr("d",function(){
                let item=d3Xselect(this).datum();
                let angles=thisRef.getAngles(item);
                return d3Xarc()
                    .innerRadius(thisRef.innerRadius)
                    .outerRadius(thisRef.outerRadius)
                    .startAngle(angles[0])
                    .endAngle(angles[1])();
            })
            .style("fill", "None")
            .style("stroke", (d)=>{return (d.chromosomeIndex===0 || d.chromosomeIndex>23) ? "None" :"Black"});
    }
    calculateRecurrence(x){
        let tmpSet=new Set();
        if(this.dataMode!=="gene"){
            this.dataFields.forEach((field)=>{
                x[field].forEach((y)=>{
                    tmpSet.add(y);
                });
            });
        }else{
            x[this.dataFields[0]].forEach((value,key,)=>{
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
    getAngles(x){
        let startAngle = this.references.genomicTheta(x.chromosomeIndex, x.startPos);
        let endAngle = this.references.genomicTheta(x.chromosomeIndex, x.endPos);
        if(this.dataMode==="gene"){
            if(endAngle-startAngle<0.01){
                let midPoint=(startAngle+endAngle)*0.5;
                let newStart=midPoint-0.005;
                let newEnd=midPoint+0.005;
                startAngle=newStart;
                endAngle=newEnd;
            }
        }
        return[startAngle,endAngle];
    }
}