export class SingleDonorVariantContribution{
    constructor(donorIndex,variantType,phenotypeExpression){
        this.donorIndex=donorIndex;
        this.variantType=variantType;
        this.compressedVariantTypes=[variantType];
        this.phenotypeExpression=phenotypeExpression;
        this.donorIndexOnPlot=null;
        this.targetCoOccupancy=null;
        this.orderInLoc=0;
        this.stroke=null;
        this.fill=null;
        this.cx=null;
        this.cy=null;
        this.outerRadius=null;
        this.startAngle=0;
        this.endAngle=2*Math.PI;
        this.uniqueLoc=-1;
    }
    hoverText(references,metadata){
        let variantDescs=this.compressedVariantTypes.filter((x)=>{return x<57;}).map((x)=>{return references.variantTypes[x].variantType;});
        return `${metadata.metadata[this.donorIndex].donor}${variantDescs.length>0?':':''} ${variantDescs.join(',')}`;
    }
    calculatePlottingParameters(variantTypeEntry,baseRadius,xScale,yScale){
        this.uniqueLoc=variantTypeEntry.uniqueLoc;
        this.fill=variantTypeEntry.colourId;
        this.stroke=this.fill;
        this.cx=xScale(this.donorIndexOnPlot);
        this.cy=yScale(this.phenotypeExpression);
        this.outerRadius=baseRadius;
        if(variantTypeEntry.locationInPhenotypePlots===0){

        }
        else if(variantTypeEntry.locationInPhenotypePlots===1){
            if(this.targetCoOccupancy===2){
                if(this.variantType===8||this.variantType===44||this.variantType===45||this.variantType===46||this.variantType===47){
                    this.endAngle=Math.PI;
                }else if(this.variantType===16||this.variantType===17||this.variantType===18||this.variantType===19){
                    this.startAngle=Math.PI;
                }
            }
        }
        else if(variantTypeEntry.locationInPhenotypePlots===2){
            if(this.targetCoOccupancy===1){
                this.outerRadius=baseRadius*0.5;
            }else if(this.targetCoOccupancy===2){
                this.outerRadius=baseRadius*(1-1/Math.sqrt(2));
                if(this.orderInLoc===0){
                    this.cy-=baseRadius*0.5*Math.sqrt(2);
                }else{
                    this.cy+=baseRadius*0.5*Math.sqrt(2);
                }
            }else if(this.targetCoOccupancy===3){
                this.outerRadius=baseRadius*(1-1/Math.sqrt(2));
                if(this.orderInLoc===0){
                    this.cy-=baseRadius*0.5*Math.sqrt(2);
                }else if(this.orderInLoc===1){
                    this.cx-=baseRadius*0.5;
                    this.cy+=baseRadius*0.5;
                }else{
                    this.cx+=baseRadius*0.5;
                    this.cy+=baseRadius*0.5;
                }
            }else if(this.targetCoOccupancy===4){
                this.outerRadius=baseRadius*(1-1/Math.sqrt(2));
                if(this.orderInLoc===0){
                    this.cx-=baseRadius*0.5;
                    this.cy-=baseRadius*0.5;
                }else if(this.orderInLoc===1){
                    this.cx+=baseRadius*0.5;
                    this.cy-=baseRadius*0.5;
                }else if(this.orderInLoc===2){
                    this.cx-=baseRadius*0.5;
                    this.cy+=baseRadius*0.5;
                }else{
                    this.cx+=baseRadius*0.5;
                    this.cy+=baseRadius*0.5;
                }
            }
        }
        else if(variantTypeEntry.locationInPhenotypePlots===3){
            //downstream/UTR3
            if(this.targetCoOccupancy===1){
                this.outerRadius=baseRadius*0.5;
                this.cx+=(baseRadius+this.outerRadius);
            }else if(this.targetCoOccupancy===2){
                this.outerRadius=baseRadius*0.25;
                this.cx+=(baseRadius+this.outerRadius);
                if(this.orderInLoc===0){
                    this.cy-=this.outerRadius;
                }
                else if(this.orderInLoc===1){
                    this.cy+=this.outerRadius;
                }
            }
        }
        else if(variantTypeEntry.locationInPhenotypePlots===4){
            //cnLoss/LOH
            this.outerRadius=baseRadius*0.5;
            this.cy+=(baseRadius+this.outerRadius);
            if(this.targetCoOccupancy===1){

            }else if(this.targetCoOccupancy===2){
                if(this.orderInLoc===0){

                }
                else if(this.orderInLoc===1){
                    this.outerRadius=baseRadius*0.5*0.5;
                }
            }
        }
        else if(variantTypeEntry.locationInPhenotypePlots===5){
            //upstream/UTR5
            if(this.targetCoOccupancy===1){
                this.outerRadius=baseRadius*0.5;
                this.cx-=(baseRadius+this.outerRadius);
            }else if(this.targetCoOccupancy===2){
                this.outerRadius=baseRadius*0.25;
                this.cx-=(baseRadius+this.outerRadius);
                if(this.orderInLoc===0){
                    this.cy-=this.outerRadius;
                }
                else if(this.orderInLoc===1){
                    this.cy+=this.outerRadius;
                }
            }
        }
        else if(variantTypeEntry.locationInPhenotypePlots===6){
            //cnGain
            this.outerRadius=baseRadius*0.5;
            this.cy-=(baseRadius+this.outerRadius);
        }
    }
}