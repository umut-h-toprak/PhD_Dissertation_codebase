import {format as d3Xformat} from 'd3-format'
import { axisRadialOuter } from 'd3-radial-axis';
import {scaleLinear as d3XscaleLinear} from 'd3';
import {getAngles, range} from "../Utils";

export class HorizontalAxis {
    constructor(commonSettings, references, fontManager){
        this.commonSettings=commonSettings;
        this.references=references;
        this.fontManager=fontManager;
    }
    generate(){
        let anySufficient=false;
        let svg=this.commonSettings.mainSvg;
        let svgClasses = [
            ".radialAxis1",
            ".radialAxis2",
            ".radialAxis3",
            ".radialAxis4",
            ".chrLabel",
            ".chrArmLabel",
        ];
        for (let i = 0; i < svgClasses.length; ++i) {
            svg.selectAll(svgClasses[i]).remove();
        }
        let chromosomeLabelFontPre = this.fontManager.fontTree.get("variantViewFontTargetSelector").get("chromosomeLabels");
        let chromosomeLabelFont  = chromosomeLabelFontPre.generateFontCssText();
        let chromosomeLabelFontSize  = chromosomeLabelFontPre.fontSize;
        let dummyFormat = d3Xformat(".2s");
        let horizontalAxisLabelFont=this.fontManager.fontTree.get("variantViewFontTargetSelector").get("horizontalAxisLabels").generateFontCssText();
        this.references.chromosomes.forEach((d)=>{
            let validChr=0<d.chromosomeIndex&&d.chromosomeIndex<24;
            let validChrExt=0<d.chromosomeIndex&&d.chromosomeIndex<28;
            let [startAngle,endAngle]=getAngles(d,this.references);
            let chromosomeScaleTheta = d3XscaleLinear().domain([d.startPos, d.endPos]).range([startAngle,endAngle]);
            if(validChr && d.coefficient>=0.25){
                let chromosomeAxisTheta1 = axisRadialOuter(chromosomeScaleTheta, this.commonSettings.chromosomeAxisRadius).tickFormat(dummyFormat).tickValues(range(1, d.endPos, 20000000)).tickSize(4);
                let chromosomeAxisTheta2 = axisRadialOuter(chromosomeScaleTheta, this.commonSettings.chromosomeAxisRadius).tickFormat(dummyFormat).tickValues([d.endPos]).tickSize(4);
                svg.append("g").attr("class", "radialAxis1")
                    .call(chromosomeAxisTheta1.tickFormat(""));
                svg.append("g").attr("class", "radialAxis2")
                    .call(chromosomeAxisTheta2)
                    .style("font", horizontalAxisLabelFont);
            }
            let chromosomeAxisTheta3 = axisRadialOuter(chromosomeScaleTheta, this.commonSettings.chromosomeAxisRadius).tickFormat(dummyFormat).tickValues([(d.startPos+d.endPos)*0.5]).tickSize(0);
            let maxCoefficient=Number.MIN_VALUE;
            let minCoefficient=Number.MAX_VALUE;
            d.daughterCoefficients.forEach((coeff,chromosomeArmIndex,z)=>{
                if(coeff>maxCoefficient){
                    maxCoefficient=coeff;
                }
                if(coeff<minCoefficient){
                    minCoefficient=coeff;
                }
            });
            const sufficientMagnitude=validChrExt && d.coefficient>=0.25 && maxCoefficient<4 && (maxCoefficient/minCoefficient)<4;
            svg.append("g").attr("class", "radialAxis3")
                .call(chromosomeAxisTheta3)
                .style("font", chromosomeLabelFont)
                .style("font-size", (sufficientMagnitude)? chromosomeLabelFontSize+"px":"0px");
        });
        svg.selectAll(".radialAxis3")
            .data(this.references.chromosomes)
            .each(function(d){
                if(0<d.chromosomeIndex&&d.chromosomeIndex<28){
                    $($($(this).children()[1]).children()[1])
                        .attr("class","chrLabel")
                        .html(d.chromosomeName.replace("s37d5","").replace("MT","M").replace("NC_007605","EBV"));
                }else{
                    $(this).css("display","none");
                }
            });
        this.references.chromosomeArms.forEach((d)=>{
            let [startAngle,endAngle]=getAngles(d,this.references);
            let chromosomeScaleTheta = d3XscaleLinear().domain([d.startPos, d.endPos]).range([startAngle, endAngle]);
            let chromosomeAxisTheta4 = axisRadialOuter(chromosomeScaleTheta, this.commonSettings.chromosomeAxisRadius).tickFormat(dummyFormat).tickValues([(d.startPos+d.endPos)*0.5]).tickSize(0);
            let maxCoefficient=Number.MIN_VALUE;
            let minCoefficient=Number.MAX_VALUE;
            this.references.chromosomes[d.chromosomeIndex].daughterCoefficients.forEach((coeff,chromosomeArmIndex,z)=>{
                if(coeff>maxCoefficient){
                    maxCoefficient=coeff;
                }
                if(coeff<minCoefficient){
                    minCoefficient=coeff;
                }
            });
            // const sufficientMagnitude=d.coefficient>0.125 && (maxCoefficient>=4 || (maxCoefficient/minCoefficient)>=4);
            const sufficientMagnitude=maxCoefficient>=4 || (maxCoefficient/minCoefficient)>=4;
            if(sufficientMagnitude){
                anySufficient=true;
            }
            svg.append("g").attr("class", "radialAxis4")
                .call(chromosomeAxisTheta4)
                .style("font", chromosomeLabelFont)
                .style("font-size", (sufficientMagnitude)? chromosomeLabelFontSize+"px":"0px");

        });
        svg.selectAll(".radialAxis4")
            .data(this.references.chromosomeArms)
            .each(function(d){
                if(0<d.chromosomeIndex&&d.chromosomeIndex<25){
                    $($($(this).children()[1]).children()[1])
                        .attr("class","chrArmLabel")
                        .html(d.chromosomeArmName);
                }else{
                    $(this).css("display","none");
                }
            });
        // this.references.cytobands.forEach((d)=>{
        //     let angles=this.getAngles(d);
        //     let chromosomeScaleTheta = d3XscaleLinear().domain([d.startPos, d.endPos]).range([angles[0], angles[1]]);
        //     let chromosomeAxisTheta5 = axisRadialOuter(chromosomeScaleTheta, this.commonSettings.chromosomeAxisRadius).tickFormat(dummyFormat).tickValues([(d.startPos+d.endPos)*0.5]).tickSize(0);
        //     let sufficientMagnitude=d.coefficient/d.coefficientInit>=4 && angles[1]-angles[0]>0.02;
        //     if(sufficientMagnitude){
        //         anySufficient=true;
        //     }
        //     svg.append("g").attr("class", "radialAxis5")
        //         .call(chromosomeAxisTheta5)
        //         .style("font", chromosomeLabelFont)
        //         .style("font-size", (sufficientMagnitude)? chromosomeLabelFontSize*0.8+"px":"0px");
        //
        // });
        // svg.selectAll(".radialAxis5")
        //     .style("display","none")
        //     .data(this.references.cytobands)
        //     .each(function(d){
        //         if(0<d.chromosomeIndex&&d.chromosomeIndex<25){
        //             $($($(this).children()[1]).children()[1])
        //                 .attr("class","cytLabel")
        //                 .html(d.cytobandName);
        //         }else{
        //             $(this).css("display","none");
        //         }
        //     })
        //     .style("display","inline");
        if(this.commonSettings.markedGenes.size>0){
            svg.selectAll(".radialAxis1").style("display","none");
            svg.selectAll(".radialAxis2").style("display","none");
        }
    }
}
