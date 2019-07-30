import {discreteColour, range, saveSvg, switchElements} from "../Utils";
import {
    path  as d3Xpath,
    scaleLinear as d3XscaleLinear,
    axisBottom as d3XaxisBottom,
    axisLeft as d3XaxisLeft,
    select as d3Xselect,
    line as d3Xline} from 'd3';

export class SurvivalPlotManager {
    constructor(commonSettings,references,cohortMetadata,selectionManager,fontManager){
        this.commonSettings=commonSettings;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.selectionManager=selectionManager;
        this.fontManager=fontManager;
        this.survivalSVG = null;
        this.targetWidth=0;
        this.xScale = null;
        this.yScale = null;
        $('#survivalContentPane')
            .off('hide.bs.tab')
            .on('hide.bs.tab',()=>{
                switchElements(
                    [
                        "survivalControls",
                        "svgDownloader"
                    ],
                    [
                        "tsvExportPanel",
                    ]);
            })
            .off('hidden.bs.tab')
            .on('hidden.bs.tab',()=>{
                switchElements(
                    [
                        "survivalControls",
                        "svgDownloader"
                    ],
                    [
                        "tsvExportPanel",
                    ]);
            })
            .off('shown.bs.tab')
            .on('shown.bs.tab', ()=> {
                $('.nav-tabs a[href="#controlsPane"]').tab("show");
                switchElements(
                    [
                        "tsvExportPanel",
                    ],
                    [
                        "survivalControls",
                        "svgDownloader"
                    ]);
                this.addSelections();
                this.fontManager.setAvailableFontSettings("survival");
                // $('#helpInfo').html(tutorials.Tutorials.expressionScreenTutorial());
            });
        this.cohortSurvivalMax=365*5;
        this.undefinedValues=new Set([undefined,NaN,"NA","N.A","N.A.",""]);
        for(let i=0;i<this.cohortMetadata.metadata.length;++i){
            let survival=this.cohortMetadata.metadata[i].OS;
            let censoredSurvival=this.cohortMetadata.metadata[i].censoredOS;
            if(!this.undefinedValues.has(survival)){
                if(survival> this.cohortSurvivalMax){
                    this.cohortSurvivalMax = survival;
                }
            }
            if(!this.undefinedValues.has(censoredSurvival)){
                if(censoredSurvival> this.cohortSurvivalMax){
                    this.cohortSurvivalMax = censoredSurvival;
                }
            }
        }
        this.includedSelections=[];
        this.selectionSurvivals=[];
        this.selectionCensoredSurvivals=[];
        this.discreteColours=[];
    }
    addSelections(){
        let survivalSelectionCheckboxesHandle=$('#survivalSelectionCheckboxes');
        survivalSelectionCheckboxesHandle.empty();
        this.selectionManager.registeredSubcohortNames.forEach((subcohortName,subcohortIndex,map)=>{
            survivalSelectionCheckboxesHandle.append(`
                <label class="custom-control custom-checkbox">
                    <input id="includeSelectionInSurvival${subcohortIndex}" type="checkbox" class="custom-control-input">
                    <span class="custom-control-indicator"></span>
                    <span class="custom-control-description">${subcohortName}</span>
                </label><br>
            `);
        });
        $('#survivalSelectionsSubmit').off('click').on('click',()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            this.includedSelections.length=0;
            this.selectionManager.registeredSubcohorts.forEach((donorIndices,subcohortIndex,map)=>{
                if($(`#includeSelectionInSurvival${subcohortIndex}`).is(':checked')){
                    this.includedSelections.push(subcohortIndex);
                }
            });
            this.resetKaplanMeier();
            if(this.includedSelections.length!==0){
                this.plotKaplanMeier();
            }
            this.commonSettings.releaseLock();
        });
    }
    addTitle(){
        let titleChunks=[`${this.cohortMetadata.cohortName}:`];
        for(let i=0;i<this.includedSelections.length;++i){
            titleChunks.push(
                `<a fill="${this.discreteColours[i]}" style="text-decoration:none">
                    ${this.selectionManager.registeredSubcohortNames.get(this.includedSelections[i])}
                    (${this.selectionSurvivals[i].length}/${this.selectionManager.registeredSubcohorts.get(this.includedSelections[i]).size})
                </a>`
            );
        }
        let title=titleChunks.join(" ");
        let helperPath=d3Xpath();
        helperPath.moveTo(0, -5);
        helperPath.lineTo(this.targetWidth,-5);
        this.survivalSVG.append("path")
            .attr("id", "survivalTitleFrame")
            .attr("d", helperPath);

        let titleFont=this.fontManager.fontTree.get("survivalFontTargetSelector").get("title").generateFontCssText();
        this.survivalSVG.append("text")
            .append("textPath")
            .attr("class","markerTextCohort")
            .attr("xlink:href", "#survivalTitleFrame")
            .attr("id","volcanoTitle")
            .style("text-anchor", "start")
            .attr("startOffset", "0%")
            .style("display","inline")
            .style("font",titleFont)
            .html(title);
    }
    addHelpers(){
        this.survivalSVG.append("line")
            .style("stroke", "black")
            .style("stroke-dasharray", ("3, 3"))
            .attr("x1", this.xScale(365*5))
            .attr("y1", this.yScale(0))
            .attr("x2", this.xScale(365*5))
            .attr("y2", this.yScale(1));
        this.survivalSVG.append("line")
            .style("stroke", "black")
            .style("stroke-dasharray", ("3, 3"))
            .attr("x1", this.xScale(0))
            .attr("y1", this.yScale(0.5))
            .attr("x2", this.xScale(this.cohortSurvivalMax))
            .attr("y2", this.yScale(0.5));
    }
    addAxis(concatXYvalues){
        let xAxisLabelFont=this.fontManager.fontTree.get("survivalFontTargetSelector").get("xAxisLabels").generateFontCssText();
        let yAxisLabelFont=this.fontManager.fontTree.get("survivalFontTargetSelector").get("yAxisLabels").generateFontCssText();
        let xAxisTitleFont=this.fontManager.fontTree.get("survivalFontTargetSelector").get("xAxisTitle").generateFontCssText();
        this.survivalSVG.append("text")
            .attr("class","axis")
            .attr("transform",
                "translate(" + (this.targetWidth/2) + ","+ this.targetWidth*1.05+")")
            .style("text-anchor", "middle")
            .style("font",xAxisTitleFont)
            .text("Overall Survival (Days)");
        this.survivalSVG.datum(concatXYvalues).append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0,"+this.targetWidth+")")
            .call(d3XaxisBottom(this.xScale))
            .style("font",xAxisLabelFont);

        this.survivalSVG.datum(concatXYvalues).append("g")
            .attr("class", "axis axis--y")
            .call(d3XaxisLeft(this.yScale))
            .style("font",yAxisLabelFont);
    }
    resetKaplanMeier(){
        if(this.survivalSVG !== null){
            this.survivalSVG.remove();
            this.survivalSVG = null;
        }
        this.selectionSurvivals.length=0;
        this.selectionCensoredSurvivals.length=0;
        $('#survivalContent').empty();
    }
    plotKaplanMeier(){
        for(let i=0;i<this.includedSelections.length;++i){
            this.selectionSurvivals.push([]);
            this.selectionCensoredSurvivals.push([]);
        }
        for(let i=0;i<this.cohortMetadata.metadata.length;++i){
            const survival=this.cohortMetadata.metadata[i].OS;
            const censoredSurvival=this.cohortMetadata.metadata[i].censoredOS;
            if(!this.undefinedValues.has(survival)&&!isNaN(survival)){
                let donorIndex=this.cohortMetadata.metadata[i].index;
                for(let j=0;j<this.includedSelections.length;++j){
                    if(this.selectionManager.registeredSubcohorts.get(this.includedSelections[j]).has(donorIndex)){
                        this.selectionSurvivals[j].push(survival);
                    }
                }
            }else{
                if(!this.undefinedValues.has(censoredSurvival)&&!isNaN(censoredSurvival)){
                    let donorIndex=this.cohortMetadata.metadata[i].index;
                    for(let j=0;j<this.includedSelections.length;++j){
                        if(this.selectionManager.registeredSubcohorts.get(this.includedSelections[j]).has(donorIndex)){
                            this.selectionCensoredSurvivals[j].push(censoredSurvival);
                        }
                    }
                }
            }
        }
        for(let i=0;i<this.selectionSurvivals.length;++i){
            this.selectionSurvivals[i].sort((a,b)=>{return a - b;});
        }
        for(let i=0;i<this.selectionCensoredSurvivals.length;++i){
            this.selectionCensoredSurvivals[i].sort((a,b)=>{return a - b;});
        }
        let currentWidth = $(`#mainSide`).width();
        let viewBox=`${-currentWidth*0.15} ${-currentWidth*0.15} ${currentWidth*1.2} ${currentWidth*1.2}`;
        this.survivalSVG = d3Xselect("#survivalContent")
            .classed("svg-container", true)
            .append("svg")
            .classed("svg-content-responsive", true)
            .attr("viewBox", viewBox)
            .attr("id","survivalSVG")
            .attr("preserveAspectRatio", "xMinYMin slice")
            .attr("width", "95%")
            .attr("height", "95%");
        this.targetWidth = $(`#survivalSVG`).width()*0.99;
        this.xScale = d3XscaleLinear().domain([0, this.cohortSurvivalMax]).range([0, this.targetWidth]);
        this.yScale = d3XscaleLinear().domain([0, 1]).range([this.targetWidth, 0]);
        let concatXYvalues=[];
        this.discreteColours.length=0;
        this.discreteColours=discreteColour(this.includedSelections.length);
        this.addTitle();
        for(let i=0;i<this.includedSelections.length;++i){
            concatXYvalues=concatXYvalues.concat(this.addGroup(i));
        }
        this.addHelpers();
        this.addAxis(concatXYvalues);
    }
    addGroup(i){
        const selectionIndex=this.includedSelections[i];
        const selectionSurvivals=this.selectionSurvivals[i];
        const selectionCensoredSurvivals=this.selectionCensoredSurvivals[i].slice();
        const colour=this.discreteColours[i];
        const fullSelectionSize=this.selectionManager.registeredSubcohorts.get(selectionIndex).size;
        const stepSize = 1 / fullSelectionSize;
        const stepSizeCensoring = 0.005;
        const YaxisSteps = range(1-selectionSurvivals.length/fullSelectionSize,1.00001,stepSize).reverse();
        let finalXY = [[0,1]];
        let finalXYCensored = [];
        let currentLastCensoredIndex=0;
        let currentLastCensored=selectionCensoredSurvivals[currentLastCensoredIndex];
        while(currentLastCensored<selectionSurvivals[0] && currentLastCensoredIndex!==selectionCensoredSurvivals.length){
            finalXYCensored.push([
                [currentLastCensored,YaxisSteps[0]-stepSizeCensoring],
                [currentLastCensored,YaxisSteps[0]+stepSizeCensoring]
            ]);
            currentLastCensoredIndex+=1;
            currentLastCensored=selectionCensoredSurvivals[currentLastCensoredIndex];
        }
        for(let j = 0; j < selectionSurvivals.length; ++j){
            finalXY.push([selectionSurvivals[j],YaxisSteps[j]]);
            finalXY.push([selectionSurvivals[j],YaxisSteps[j+1]]);
            if(selectionCensoredSurvivals.length>0){
                if(j!==selectionSurvivals.length-1){
                    while(currentLastCensoredIndex!==selectionCensoredSurvivals.length && currentLastCensored<selectionSurvivals[j+1]){
                        finalXYCensored.push([
                            [currentLastCensored,YaxisSteps[j+1]-stepSizeCensoring],
                            [currentLastCensored,YaxisSteps[j+1]+stepSizeCensoring]
                        ]);
                        currentLastCensoredIndex+=1;
                        currentLastCensored=selectionCensoredSurvivals[currentLastCensoredIndex];
                    }
                }else{
                    while(currentLastCensoredIndex!==selectionCensoredSurvivals.length){
                        finalXYCensored.push([
                            [currentLastCensored,YaxisSteps[j+1]-stepSizeCensoring],
                            [currentLastCensored,YaxisSteps[j+1]+stepSizeCensoring]
                        ]);
                        currentLastCensoredIndex+=1;
                        currentLastCensored=selectionCensoredSurvivals[currentLastCensoredIndex];
                    }
                }
            }
        }
        finalXY.push([this.cohortSurvivalMax,YaxisSteps[selectionSurvivals.length]]);
        let line = d3Xline()
            .x((d)=>{return this.xScale(d[0]);})
            .y((d)=>{return this.yScale(d[1]);});
        this.survivalSVG.datum(finalXY)
            .append("path")
            .attr("class", "selectedLine")
            .style("fill", "none")
            .style("stroke", colour)
            .style("stroke-width", "2")
            .attr("d", line);
        finalXYCensored.forEach((censoringDataPoints)=>{
            this.survivalSVG.datum(censoringDataPoints)
                .append("path")
                .attr("class", "selectedLine")
                .style("fill", "none")
                .style("stroke", "Black")
                .style("stroke-width", "2")
                .attr("d", line);
        });
        return finalXY;
    }
    getTitleChunks(){
        let titleChunks=[`${this.cohortMetadata.cohortName}`];
        titleChunks.push(`Survival`);
        for(let i=0;i<this.includedSelections.length;++i){
            titleChunks.push(`${this.selectionManager.registeredSubcohortNames.get(this.includedSelections[i])}(${this.selectionSurvivals[i].length}of${this.selectionManager.registeredSubcohorts.get(this.includedSelections[i]).size})`);
        }
        return titleChunks;
    }
    saveSurvivalSvg(){
        let targetSvgId="survivalSVG";
        let titleChunks=this.getTitleChunks();
        let targetFileName=`${titleChunks.join("_")}.svg`;
        saveSvg(targetSvgId,targetFileName);
    }
    textExport(){

    }
}