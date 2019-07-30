export class VariantRecurrenceEntryGene {
    constructor(data,expectedTypes){
        this.geneId=parseInt(data.Gene);
        this.contributions=new Map();
        expectedTypes.forEach((x)=>{
            let xst=x.toString();
            if(data[xst]!==""){
                let tmpDonors=[];
                data[xst].split(',').forEach((y)=>{
                    tmpDonors.push(parseInt(y));
                });
                this.contributions.set(x,tmpDonors);
            }
        });
        this.isValid=this.contributions.size>0;
    }
    getIndex(){
        return this.geneId;
    }
}