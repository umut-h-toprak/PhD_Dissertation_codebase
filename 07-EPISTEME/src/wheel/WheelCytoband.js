import {
    path  as d3Xpath,
    arc as d3Xarc,
    drag as d3Xdrag,
    event as d3Xevent,
    select as d3Xselect
} from 'd3';
import {cartesianToPolar, getAngles, polarToCartesian} from "../Utils";

export class WheelCytoband {
    constructor(commonSettings,
                references,
                innerRadius,
                wheelWidth,
                data,
                elementClassPrefix,
                fontManager){
        this.commonSettings=commonSettings;
        this.references=references;
        this.fontManager=fontManager;
        this.wheelWidth=wheelWidth;
        this.defaultInnerRadius=innerRadius;
        this.cytobandWidth=0;
        this.fragileSiteOuterRadius=0;
        this.fragileSiteInnerRadius=0;
        this.geneInnerRadius=0;
        this.geneOuterRadius=0;
        this.svg=this.commonSettings.mainSvg;
        this.data=data;
        this.elementGroup=this.svg.append("g");
        this.elementGroupAux=this.svg.append("g");
        this.elementGroupMarkerHelpersGenes=this.svg.append("g");
        this.elementGroupMarkerHelpersCytobands=this.svg.append("g");
        this.elementGroupMarkersGenes=this.svg.append("g");
        this.elementGroupMarkersCytobands=this.svg.append("g");
        this.elementClassPrefix=elementClassPrefix;
        this.elementIndexPrefix=`${elementClassPrefix}_Index`;
    }
    enableControls(){
        this.elementGroup.on("click", ()=> {
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            try {
                this.references.emitCytobandClick(d3Xselect(d3Xevent.target).datum().getIndex());
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
            this.commonSettings.fastLock();
            let cytobandIndex=d3Xselect(d3Xevent.target).datum().cytobandIndex;
            this.addCytobandLabel(cytobandIndex);
            this.commonSettings.fastRelease();
        });
        this.elementGroupMarkersGenes.on("click", ()=> {
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            this.references.genes.get(parseInt(d3Xselect(d3Xevent.target).attr('geneInd'))).launchDefaultDb();
            // this.references.genes.get(d3Xselect(d3Xevent.target).datum()).launchDefaultDb();
            this.commonSettings.fastRelease();
        });
        this.elementGroupMarkersCytobands.on("click", ()=> {
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            this.references.cytobands[parseInt(d3Xselect(d3Xevent.target).attr('cytInd'))].launchDefaultDb();
            // this.references.cytobands[d3Xselect(d3Xevent.target).datum()].launchDefaultDb();
            this.commonSettings.fastRelease();
        });
        this.elementGroupMarkersGenes.on("contextmenu", ()=> {
            d3Xevent.preventDefault();
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            this.removeGeneLabel(parseInt(d3Xselect(d3Xevent.target).attr('geneInd')));
            this.commonSettings.releaseLock();
        });
        this.elementGroupMarkersCytobands.on("contextmenu", ()=> {
            d3Xevent.preventDefault();
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            this.removeCytobandLabel(parseInt(d3Xselect(d3Xevent.target).attr('cytInd')));
            this.commonSettings.fastRelease();
        });
    }
    setNormalRadii(){
        this.cytobandWidth=this.wheelWidth;
        this.cytobandInnerRadius=this.defaultInnerRadius;
        this.cytobandOuterRadius=this.cytobandInnerRadius+this.wheelWidth-this.commonSettings.wheelGap;
        this.fragileSiteOuterRadius=this.cytobandInnerRadius-this.commonSettings.wheelGap*0.25;
        this.fragileSiteInnerRadius=this.fragileSiteOuterRadius-this.commonSettings.wheelGap*0.5;
        this.geneInnerRadius=this.cytobandOuterRadius+this.commonSettings.wheelGap*0.25;
        this.geneOuterRadius=this.geneInnerRadius+this.commonSettings.wheelGap*0.5;
    }
    setHyperzoomRadii(){
        this.cytobandWidth=this.wheelWidth*0.5;
        this.cytobandInnerRadius=this.defaultInnerRadius-this.commonSettings.wheelGap;
        this.cytobandOuterRadius=this.cytobandInnerRadius+this.cytobandWidth;
        this.fragileSiteOuterRadius=0;
        this.fragileSiteInnerRadius=0;
        this.geneInnerRadius=this.cytobandOuterRadius+this.cytobandWidth*0.25;
        this.geneOuterRadius=this.geneInnerRadius+this.cytobandWidth*0.5;
    }
    cleanup(){
        [
            `chr${this.elementClassPrefix}`,
            `gene${this.elementClassPrefix}`,
            `fra${this.elementClassPrefix}`,
            this.elementClassPrefix,
        ].forEach((x)=>{
            this.svg.selectAll(`.${x}`).remove();
        });
    }
    auxCleanup(){
        [
            `chr${this.elementClassPrefix}`,
            `gene${this.elementClassPrefix}`,
            `fra${this.elementClassPrefix}`,
        ].forEach((x)=>{
            this.svg.selectAll(`.${x}`).remove();
        });
    }
    plot(){
        this.cleanup();
        this.elementGroup.selectAll(`.${this.elementClassPrefix}`)
            .data(this.data)
            .enter().append("path")
            .attr("class",(d)=>{return `cytBlck${this.references.cytobands[d.cytobandIndex].colourIndex}`;})
            .classed(this.elementClassPrefix,true)
            .attr("id",(d)=>{return `${this.elementIndexPrefix}_${d.cytobandIndex}`;})
            .append("svg:title")
            .text((d)=>{
                return d.cytobandName;
            });
        this.updatePaths();
    }
    updatePaths(){
        this.auxCleanup();
        this.assessHyperzoom();
        if(this.commonSettings.isAnyMarked()){
            this.realignSvgAddMarkers();
            setTimeout(()=>{this.plotGeneLabels()},0);
            setTimeout(()=>{this.plotCytobandLabels()},0);
        }else{
            this.realignSvgRemoveMarkers();
        }
        if(this.commonSettings.hyperzoomMode<2){
            setTimeout(()=>{this.addFragileSites()},0);
        }else{
            setTimeout(()=>{this.addSelectedGenes()},0);
        }
        setTimeout(()=>{this.addChromosomeFrames()},0);
        let thisRef=this;
        setTimeout(()=>{
            this.elementGroup.selectAll(`.${this.elementClassPrefix}`)
                .attr("d",function(){
                    let item=d3Xselect(this).datum();
                    return d3Xarc()
                        .innerRadius(thisRef.cytobandInnerRadius)
                        .outerRadius(thisRef.cytobandOuterRadius)
                        .startAngle(thisRef.references.genomicTheta(item.chromosomeIndex, item.startPos))
                        .endAngle(thisRef.references.genomicTheta(item.chromosomeIndex, item.endPos))();
                });
        },0);
    }
    assessHyperzoom(){
        this.commonSettings.hyperzoomDisplayedGenes.clear();
        this.commonSettings.hyperzoomMarkedGenes.clear();
        this.commonSettings.hyperzoomMarkedCytobands.clear();
        this.commonSettings.hyperzoomMode=0;
        this.references.cytobands.forEach((c)=>{
            if(c.chromosomeIndex<24){
                if(c.coefficient>=256){
                    if(c.coefficient>=512){
                        this.commonSettings.hyperzoomMode=3;
                    }else{
                        if(this.commonSettings.hyperzoomMode===0){
                            this.commonSettings.hyperzoomMode=2;
                        }
                    }
                    c.getGeneIndices(this.references).forEach((i)=>{
                        if(this.references.genes.get(i).cancerGene){
                            this.commonSettings.hyperzoomDisplayedGenes.add(i);
                        }else{
                            let geneSuperType=this.references.geneTypes[this.references.genes.get(i).geneTypeIndex].geneSupertype;
                            if(geneSuperType==="Coding" || geneSuperType==="IgtrGene"){
                                this.commonSettings.hyperzoomDisplayedGenes.add(i);
                            }
                        }
                    })
                }
                let [startAngle,endAngle]=getAngles(c,this.references);
                if(c.coefficient/c.coefficientInit>=6&& endAngle-startAngle>0.02){
                    this.commonSettings.hyperzoomMarkedCytobands.add(c.cytobandIndex);
                    if(this.commonSettings.hyperzoomMode===0){
                        this.commonSettings.hyperzoomMode=1;
                    }
                }
            }
        });
        if(this.commonSettings.hyperzoomMode>0){
            this.setHyperzoomRadii();
            if(this.commonSettings.hyperzoomMode>=2){
                this.commonSettings.hyperzoomDisplayedGenes.forEach((x)=>{
                    this.commonSettings.hyperzoomMarkedGenes.add(x);
                });
            }
        }else{
            this.commonSettings.hyperzoomDisplayedGenes.clear();
            this.commonSettings.hyperzoomMarkedGenes.clear();
            this.commonSettings.hyperzoomMarkedCytobands.clear();
            this.setNormalRadii();
        }
    }
    addFragileSites(){
        let thisRef=this;
        this.elementGroupAux.selectAll(`.fra${this.elementClassPrefix}`)
            .data(this.references.fragileSites)
            .enter().append("path")
            .attr("class", `fra${this.elementClassPrefix}`)
            .attr(this.elementIndexPrefix, (d)=>{return `fra${d.fragileSiteIndex}`;})
            .style("fill", "Purple")
            .style("stroke", "None")
            .attr("d",(d)=>{
                return d3Xarc()
                    .innerRadius(d.fragileSiteInnerRadius)
                    .outerRadius(d.fragileSiteOuterRadius)
                    .startAngle(thisRef.references.genomicTheta(d.chromosomeIndex, d.startPos))
                    .endAngle(thisRef.references.genomicTheta(d.chromosomeIndex, d.endPos))();
        });
    }
    addSelectedGenes(){
        let currentGenes=[];
        this.commonSettings.hyperzoomDisplayedGenes.forEach((x)=>{
            currentGenes.push(x);
        });
        let thisRef=this;
        this.elementGroupAux.selectAll(`.gene${this.elementClassPrefix}`)
            .data(currentGenes)
            .enter().append("path")
            .classed(`gene${this.elementClassPrefix}`,true)
            .attr(this.elementIndexPrefix, (x)=>{return `gene${x}`;})
            .style("fill", "Green")
            .style("stroke", "Black")
            // .style("stroke-width", 0.1)
            .attr("d",function(){
                let item=thisRef.references.genes.get(d3Xselect(this).datum());
                return d3Xarc()
                    .innerRadius(thisRef.geneInnerRadius)
                    .outerRadius(thisRef.geneOuterRadius)
                    .startAngle(thisRef.references.genomicTheta(item.chromosomeIndex, item.startPos))
                    .endAngle(thisRef.references.genomicTheta(item.chromosomeIndex, item.endPos))();
            })
            .append("svg:title")
            .text((x)=>{
                return this.references.genes.get(x).geneName;
            });
    }
    plotGeneLabels(){
        this.elementGroupMarkerHelpersGenes.selectAll(".geneMarkerHelper").remove();
        this.elementGroupMarkersGenes.selectAll(".geneMarker").remove();
        if(this.commonSettings.markedGenes.size>0 || this.commonSettings.hyperzoomMarkedGenes.size>0 || this.commonSettings.volcanoMarkedGenes.size>0){
            $('#geneSelectorControlsForMarkedGenes').css('display','inline');
        }else{
            $('#geneSelectorControlsForMarkedGenes').css('display','none');
        }
        this.commonSettings.markedGenes.forEach((geneId)=>{
            this.plotSingleGeneLabel(geneId);
        });
        this.commonSettings.hyperzoomMarkedGenes.forEach((geneId)=>{
            this.plotSingleGeneLabel(geneId);
        });
    }
    plotSingleGeneLabel(geneId){
        let marker = $(`#geneMarker_${geneId}`);
        if(marker.length){
            marker.remove();
            $(`#geneMarkerHelper_${geneId}_dragbridge`).remove();
            $(`#geneMarkerHelper_${geneId}`).remove();
            this.commonSettings.markedGenes.delete(geneId);
            if(this.commonSettings.markedGenes.size===0){
                $('#geneSelectorControlsForMarkedGenes').css('display','none');
            }
            return false;
        }else{
            const cytobandAndGeneLabelFont = this.fontManager.fontTree.get("variantViewFontTargetSelector").get("cytobandAndGeneLabels").generateFontCssText();
            const anglePre = this.references.genomicTheta(1, 1);
            const angle = this.references.genes.get(geneId).getMidAngle(this.references);
            const [startCartesianX, startCartesianY] = polarToCartesian(this.commonSettings.chromosomeAxisRadius+5, anglePre);
            const [endCartesianX, endCartesianY] = polarToCartesian(this.commonSettings.chromosomeAxisRadius+5+100, anglePre);
            const fullDiag=Math.sqrt(Math.pow(endCartesianX-startCartesianX,2)+Math.pow(endCartesianY-startCartesianY,2));
            const [zeroX,zeroY]=polarToCartesian(0,angle);
            const leftHalf=((angle/Math.PI) % 2) > 1;
            this.elementGroupMarkerHelpersGenes.append("path")
                .attr("class", "geneMarkerHelper")
                .attr("id", `geneMarkerHelper_${geneId}pre`)
                .attr("d", ()=>{
                    let helperPath=d3Xpath();
                    if(leftHalf){
                        helperPath.moveTo(endCartesianX, endCartesianY);
                        helperPath.lineTo(startCartesianX, startCartesianY);
                    }else{
                        helperPath.moveTo(startCartesianX, startCartesianY);
                        helperPath.lineTo(endCartesianX, endCartesianY);
                    }
                    return helperPath;
                })
                .style("display", "none");
            this.elementGroupMarkersGenes.append("text")
                .style("dominant-baseline", "middle")
                .style("alignment-baseline", "middle")
                .attr("id", `geneMarker_${geneId}pre`)
                .append("textPath")
                .attr("class","geneMarkerText")
                .attr("class","geneMarker")
                .attr("geneInd", geneId)
                .attr("xlink:href", `#geneMarkerHelper_${geneId}pre`)
                .style("display","inline")
                .style("font",cytobandAndGeneLabelFont)
                .text(this.references.genes.get(geneId).geneName);

            const bboxPre=document.getElementById(`geneMarker_${geneId}pre`).getBBox();
            const diag=Math.sqrt(Math.pow(bboxPre.width,2)+Math.pow(bboxPre.height,2));
            const lengthFactor=diag/fullDiag;
            $(`#geneMarkerHelper_${geneId}pre`).remove();
            $(`#geneMarker_${geneId}pre`).remove();
            const [startCartesianX2, startCartesianY2] = polarToCartesian(this.commonSettings.chromosomeAxisRadius+5, angle);
            const [endCartesianX2, endCartesianY2] = polarToCartesian(this.commonSettings.chromosomeAxisRadius+5+100*lengthFactor, angle);

            this.elementGroupMarkerHelpersGenes.append("path")
                .attr("class", "geneMarkerHelper")
                .attr("id", `geneMarkerHelper_${geneId}`)
                .attr("d", ()=>{
                    let helperPath=d3Xpath();
                    if(leftHalf){
                        helperPath.moveTo(endCartesianX2, endCartesianY2);
                        helperPath.lineTo(startCartesianX2, startCartesianY2);
                    }else{
                        helperPath.moveTo(startCartesianX2, startCartesianY2);
                        helperPath.lineTo(endCartesianX2, endCartesianY2);
                    }
                    return helperPath;
                })
                .style("display", "none");
            this.elementGroupMarkersGenes.append("text")
                .style("dominant-baseline", "middle")
                .style("alignment-baseline", "middle")
                .append("textPath")
                .attr("class","geneMarkerText")
                .attr("class","geneMarker")
                .attr("id", `geneMarker_${geneId}`)
                .attr("geneInd", geneId)
                .attr("xlink:href", `#geneMarkerHelper_${geneId}`)
                .style("display","inline")
                .style("font",cytobandAndGeneLabelFont)
                .text(this.references.genes.get(geneId).geneName)
                .call(d3Xdrag()
                    .on("start", function(){
                        $(`#geneMarkerHelper_${geneId}_dragbridge`).remove();
                    })
                    .on("drag", ()=>{
                        const helperX = d3Xevent.x;
                        const helperY = d3Xevent.y;
                        const [newRadius,newAngle] = cartesianToPolar(zeroX,zeroY,helperX,helperY);
                        const [extendedX,extendedY] = polarToCartesian(newRadius-5+100*lengthFactor,newAngle);
                        let helperPath = d3Xpath();
                        const newLeftHalf=((newAngle/Math.PI) % 2) > 1;
                        if(newLeftHalf){
                            helperPath.moveTo(extendedX, extendedY);
                            helperPath.lineTo(helperX, helperY);
                        }else{
                            helperPath.moveTo(helperX, helperY);
                            helperPath.lineTo(extendedX, extendedY);
                        }
                        d3Xselect(`#geneMarkerHelper_${geneId}`)
                            .attr("d", helperPath);
                        const elq = $(`#geneMarkerHelper_${geneId}`);
                        elq.hide();
                        setTimeout(function(){
                            elq.show();
                        },10);
                    })
                    .on("end", ()=>{
                        const [xInit,yInit]=polarToCartesian(this.commonSettings.chromosomeAxisRadius,angle);
                        const xEnd = d3Xevent.x;
                        const yEnd = d3Xevent.y;
                        let helperPath=d3Xpath();
                        helperPath.moveTo(xInit,yInit);
                        helperPath.lineTo(xEnd,yEnd);
                        helperPath.closePath();
                        this.elementGroupMarkerHelpersGenes.append("path")
                            .attr("class", "geneMarkerHelper")
                            .attr("id", `geneMarkerHelper_${geneId}_dragbridge`)
                            .attr("d", helperPath)
                            .style("stroke","Black")
                            .style("display","inline");
                    }));
        }
    }
    addGeneLabel(geneId){
        if(!this.commonSettings.isAnyMarked()){
            this.realignSvgAddMarkers();
        }
        this.commonSettings.markedGenes.add(geneId);
        this.plotSingleGeneLabel(geneId);
    }
    clearMarkedGenes(){
        let genesToClear=[];
        this.commonSettings.markedGenes.forEach((geneId)=>{
            genesToClear.push(geneId);
        });
        this.commonSettings.hyperzoomMarkedGenes.forEach((geneId)=>{
            genesToClear.push(geneId);
        });
        genesToClear.forEach((geneId)=>{
            this.removeGeneLabel(geneId);
        });
    }
    removeGeneLabel(geneId){
        if(this.commonSettings.markedGenes.has(geneId)){
            this.commonSettings.markedGenes.delete(geneId);
        }
        if(this.commonSettings.hyperzoomMarkedGenes.has(geneId)){
            this.commonSettings.hyperzoomMarkedGenes.delete(geneId);
        }
        if(!this.commonSettings.isAnyMarked()){
            this.realignSvgRemoveMarkers();
        }
        if(this.commonSettings.markedGenes.size===0 && this.commonSettings.hyperzoomMarkedGenes.size===0){
            $('#geneSelectorControlsForMarkedGenes').css('display','none');
        }
        $(`#geneMarker_${geneId}`).remove();
        $(`#geneMarkerHelper_${geneId}`).remove();
        $(`#geneMarkerHelper_${geneId}_dragbridge`).remove();
    }
    removeCytobandLabel(cytobandId){
        if(this.commonSettings.markedCytobands.has(cytobandId)){
            this.commonSettings.markedCytobands.delete(cytobandId);
        }
        if(this.commonSettings.hyperzoomMarkedCytobands.has(cytobandId)){
            this.commonSettings.hyperzoomMarkedCytobands.delete(cytobandId);
        }
        if(!this.commonSettings.isAnyMarked()){
            this.realignSvgRemoveMarkers();
        }
        if(this.commonSettings.markedCytobands.size===0){
            $('#clearMarkedCytobands').css('display','none');
        }
        $(`#cytobandMarker_${cytobandId}`).remove();
        $(`#cytobandMarkerHelper_${cytobandId}`).remove();
        $(`#cytobandMarkerHelper_${cytobandId}_dragbridge`).remove();
    }
    removeAllGeneLabels(){
        this.commonSettings.markedGenes.clear();
        this.commonSettings.hyperzoomMarkedGenes.clear();
        this.elementGroupMarkerHelpersGenes.selectAll(".geneMarkerHelper").remove();
        this.elementGroupMarkersGenes.selectAll(".geneMarker").remove();
        if(!this.commonSettings.isAnyMarked()){
            this.realignSvgRemoveMarkers();
        }
        $('#geneSelectorControlsForMarkedGenes').css('display','none');
    }
    removeAllCytobandLabels(){
        this.commonSettings.markedCytobands.clear();
        this.commonSettings.hyperzoomMarkedCytobands.clear();
        this.elementGroupMarkerHelpersCytobands.selectAll(".cytobandMarkerHelper").remove();
        this.elementGroupMarkersCytobands.selectAll(".cytobandMarker").remove();
        if(!this.commonSettings.isAnyMarked()){
            this.realignSvgRemoveMarkers();
        }
        $('#clearMarkedCytobands').css('display','none');
    }
    addCytobandLabel(cytobandIndex){
        if(!this.commonSettings.isAnyMarked()) {
            this.realignSvgAddMarkers();
        }
        this.commonSettings.markedCytobands.add(cytobandIndex);
        this.plotSingleCytobandLabel(cytobandIndex);
    }
    plotSingleCytobandLabel(cytobandIndex){
        let marker = $(`#cytobandMarker_${cytobandIndex}`);
        if(marker.length){
            marker.remove();
            $(`#cytobandMarkerHelper_${cytobandIndex}_dragbridge`).remove();
            $(`#cytobandMarkerHelper_${cytobandIndex}`).remove();
            this.commonSettings.markedCytobands.delete(cytobandIndex);
            return false;
        }else{
            const cytobandAndGeneLabelFont = this.fontManager.fontTree.get("variantViewFontTargetSelector").get("cytobandAndGeneLabels").generateFontCssText();
            const anglePre = this.references.genomicTheta(1, 1);
            const angle = this.references.cytobands[cytobandIndex].getMidAngle(this.references);
            const [startCartesianX, startCartesianY] = polarToCartesian(this.commonSettings.chromosomeAxisRadius+5, anglePre);
            const [endCartesianX, endCartesianY] = polarToCartesian(this.commonSettings.chromosomeAxisRadius+5+100, anglePre);
            const fullDiag=Math.sqrt(Math.pow(endCartesianX-startCartesianX,2)+Math.pow(endCartesianY-startCartesianY,2));
            const [zeroX,zeroY]=polarToCartesian(0,angle);
            const leftHalf=((angle/Math.PI) % 2) > 1;

            this.elementGroupMarkerHelpersCytobands.append("path")
                .attr("class", "cytobandMarkerHelper")
                .attr("id", `cytobandMarkerHelper_${cytobandIndex}pre`)
                .attr("d", ()=>{
                    let helperPath=d3Xpath();
                    if(leftHalf){
                        helperPath.moveTo(endCartesianX, endCartesianY);
                        helperPath.lineTo(startCartesianX, startCartesianY);
                    }else{
                        helperPath.moveTo(startCartesianX, startCartesianY);
                        helperPath.lineTo(endCartesianX, endCartesianY);
                    }
                    return helperPath;
                })
                .style("display", "none");
            this.elementGroupMarkersCytobands.append("text")
                .style("dominant-baseline", "middle")
                .style("alignment-baseline", "middle")
                .attr("id", `cytobandMarker_${cytobandIndex}pre`)
                .append("textPath")
                .attr("cytInd", cytobandIndex)
                .attr("class","cytobandMarkerText")
                .attr("class","cytobandMarker")
                .style("dominant-baseline", "middle")
                .style("alignment-baseline", "middle")
                .attr("xlink:href", `#cytobandMarkerHelper_${cytobandIndex}pre`)
                .style("display","inline")
                .style("font",cytobandAndGeneLabelFont)
                .text(this.references.cytobands[cytobandIndex].cytobandName);

            const bboxPre=document.getElementById(`cytobandMarker_${cytobandIndex}pre`).getBBox();
            const diag=Math.sqrt(Math.pow(bboxPre.width,2)+Math.pow(bboxPre.height,2));
            const lengthFactor=diag/fullDiag;
            $(`#cytobandMarker_${cytobandIndex}pre`).remove();
            $(`#cytobandMarkerHelper_${cytobandIndex}pre`).remove();
            const [startCartesianX2, startCartesianY2] = polarToCartesian(this.commonSettings.chromosomeAxisRadius+5, angle);
            const [endCartesianX2, endCartesianY2] = polarToCartesian(this.commonSettings.chromosomeAxisRadius+5+100*lengthFactor, angle);
            this.elementGroupMarkerHelpersCytobands.append("path")
                .attr("class", "cytobandMarkerHelper")
                .attr("id", `cytobandMarkerHelper_${cytobandIndex}`)
                .attr("d", ()=>{
                    let helperPath=d3Xpath();
                    if(leftHalf){
                        helperPath.moveTo(endCartesianX2, endCartesianY2);
                        helperPath.lineTo(startCartesianX2, startCartesianY2);
                    }else{
                        helperPath.moveTo(startCartesianX2, startCartesianY2);
                        helperPath.lineTo(endCartesianX2, endCartesianY2);
                    }
                    return helperPath;
                })
                .style("display", "none");
            this.elementGroupMarkersCytobands.append("text")
                .style("dominant-baseline", "middle")
                .style("alignment-baseline", "middle")
                .append("textPath")
                .attr("id", `cytobandMarker_${cytobandIndex}`)
                .attr("cytInd", cytobandIndex)
                .attr("class","cytobandMarkerText")
                .attr("class","cytobandMarker")
                .style("dominant-baseline", "middle")
                .style("alignment-baseline", "middle")
                .attr("xlink:href", `#cytobandMarkerHelper_${cytobandIndex}`)
                .style("display","inline")
                .style("font",cytobandAndGeneLabelFont)
                .text(this.references.cytobands[cytobandIndex].cytobandName)
                .call(d3Xdrag()
                    .on("start", function(){
                        $(`#cytobandMarkerHelper_${cytobandIndex}_dragbridge`).remove()
                    })
                    .on("drag", ()=>{
                        const helperX = d3Xevent.x;
                        const helperY = d3Xevent.y;
                        const [newRadius,newAngle] = cartesianToPolar(zeroX,zeroY,helperX,helperY);
                        const [extendedX,extendedY] = polarToCartesian(newRadius-5+100*lengthFactor,newAngle);
                        const newLeftHalf=((newAngle/Math.PI) % 2) > 1;
                        const helperPath = d3Xpath();
                        if(newLeftHalf){
                            helperPath.moveTo(extendedX, extendedY);
                            helperPath.lineTo(helperX, helperY);
                        }else{
                            helperPath.moveTo(helperX, helperY);
                            helperPath.lineTo(extendedX, extendedY);
                        }
                        d3Xselect(`#cytobandMarkerHelper_${cytobandIndex}`)
                            .attr("d", helperPath);
                        let elq = $(`#cytobandMarkerHelper_${cytobandIndex}`);
                        elq.hide();
                        setTimeout(function(){
                            elq.show();
                        },10);
                    })
                    .on("end", ()=>{
                        const [xInit,yInit]=polarToCartesian(this.commonSettings.chromosomeAxisRadius,angle);
                        const xEnd = d3Xevent.x;
                        const yEnd = d3Xevent.y;
                        let helperPath=d3Xpath();
                        helperPath.moveTo(xInit,yInit);
                        helperPath.lineTo(xEnd,yEnd);
                        helperPath.closePath();
                        this.elementGroupMarkerHelpersCytobands.append("path")
                            .attr("class", `cytobandMarkerHelper`)
                            .attr("id", `cytobandMarkerHelper_${cytobandIndex}_dragbridge`)
                            .attr("d", helperPath)
                            .style("stroke","Black")
                            .style("display","inline");
                    }));
        }
    }
    plotCytobandLabels(){
        this.elementGroupMarkerHelpersCytobands.selectAll(".cytobandMarkerHelper").remove();
        this.elementGroupMarkersCytobands.selectAll(".cytobandMarker").remove();
        if(this.commonSettings.markedCytobands.size>0 || this.commonSettings.hyperzoomMarkedCytobands.size>0){
            $('#clearMarkedCytobands').css('display','inline');
            this.commonSettings.markedCytobands.forEach((cytobandIndex)=>{
                this.plotSingleCytobandLabel(cytobandIndex);
            });
            this.commonSettings.hyperzoomMarkedCytobands.forEach((cytobandIndex)=>{
                this.plotSingleCytobandLabel(cytobandIndex);
            });
        }
        else{
            $('#clearMarkedCytobands').css('display','none');
        }
    }
    realignSvgAddMarkers(){
        const titleFont=this.fontManager.fontTree.get("variantViewFontTargetSelector").get("title").generateFontCssText(0.8);
        this.svg.selectAll(".radialAxis1").style("display","none");
        this.svg.selectAll(".radialAxis2").style("display","none");
        this.svg.attr("viewBox", "-500 -500 1000 1000");
        $("#cohortNameSvg").css("font",titleFont);
        $("#cohortNameSvgLine2").css("font",titleFont);
    }
    realignSvgRemoveMarkers(){
        const titleFont=this.fontManager.fontTree.get("variantViewFontTargetSelector").get("title").generateFontCssText(0.8);
        this.elementGroupMarkerHelpersGenes.selectAll(".geneMarkerHelper").remove();
        this.elementGroupMarkersGenes.selectAll(".geneMarker").remove();
        this.elementGroupMarkerHelpersCytobands.selectAll(".cytobandMarkerHelper").remove();
        this.elementGroupMarkersCytobands.selectAll(".cytobandMarker").remove();
        this.svg.selectAll(".radialAxis1").style("display","inline");
        this.svg.selectAll(".radialAxis2").style("display","inline");
        this.svg.attr("viewBox", "-500 -460 1000 1000");
        $("#cohortNameSvg").css("font",titleFont);
        $("#cohortNameSvgLine2").css("font",titleFont);
    }

    addChromosomeFrames(){
        let thisRef=this;
        this.elementGroupAux.selectAll(`.chr${this.elementClassPrefix}`)
            .data(this.references.chromosomes)
            .enter().append("path")
            .attr("class", `chr${this.elementClassPrefix}`)
            .attr(this.elementIndexPrefix, (d)=>{return `chr${d.chromosomeIndex}`;})
            .style("fill", "None")
            .style("stroke", (d)=>{return (d.chromosomeIndex>0 && d.chromosomeIndex<28) ? "Black" :"None"})
            .attr("d",function(){
                let item=d3Xselect(this).datum();
                return d3Xarc()
                    .innerRadius(thisRef.cytobandInnerRadius)
                    .outerRadius(thisRef.cytobandOuterRadius)
                    .startAngle(thisRef.references.genomicTheta(item.chromosomeIndex, item.startPos))
                    .endAngle(thisRef.references.genomicTheta(item.chromosomeIndex, item.endPos))();
            });
    }
}