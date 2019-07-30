export class ChromosomeEntry {
    constructor(data){
        this.chromosomeIndex=parseInt(data.chromosomeIndex);
        this.chromosomeName=data.chrName;
        this.chromosomeSize=parseInt(data.chrSize);
        this.gapSize=parseInt(data.gapSize);
        this.startPos=0;
        this.endPos=this.chromosomeSize;
        this.firstCytobandIndex=parseInt(data.firstCytobandIndex);
        this.lastCytobandIndex=parseInt(data.lastCytobandIndex);
        this.firstChromosomeArmIndex=parseInt(data.firstChromosomeArmIndex);
        this.lastChromosomeArmIndex=parseInt(data.lastChromosomeArmIndex);
        this.coefficientInit=+data.coefficientInit;
        this.daughterCoefficients=new Map();
        this.coefficient=this.coefficientInit;
        this.resetCoefficient();
    }
    getFullSize(){
        return this.chromosomeSize*this.coefficient+this.gapSize;
    }
    resetCoefficient(){
        this.coefficient=this.coefficientInit;
        this.daughterCoefficients.clear();
        this.daughterCoefficients.set(this.firstChromosomeArmIndex,this.coefficientInit);
        this.daughterCoefficients.set(this.lastChromosomeArmIndex,this.coefficientInit);
    }
}