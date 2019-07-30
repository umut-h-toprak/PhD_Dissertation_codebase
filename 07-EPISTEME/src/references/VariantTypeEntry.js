export class VariantTypeEntry {
    constructor(data){
        this.variantTypeIndex=data.variantTypeIndex;
        this.variantType=data.variantType;
        this.colourId=parseInt(data.colourId);
        this.locationInPhenotypePlots=parseInt(data.locationInPhenotypePlots);
        this.superGroupName=data.superGroupName;
        this.uniqueLoc=parseInt(data.uniqueLoc);
        this.variantVizTypeIndex=parseInt(data.variantVizTypeIndex);
    }
}