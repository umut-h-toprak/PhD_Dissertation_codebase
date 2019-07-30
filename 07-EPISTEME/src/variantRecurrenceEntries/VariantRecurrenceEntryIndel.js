export class VariantRecurrenceEntryIndel {
    constructor(data){
        this.tadIndex=parseInt(data.tadIndex);
        this.offset0donors =[];
        if(data.offset0donors!==""){
            data.offset0donors.split(',').forEach((x)=>{
                this.offset0donors.push(parseInt(x));
            });
        }
        this.offset1donors=[];
        if(data.offset1donors!==""){
            data.offset1donors.split(',').forEach((x)=>{
                this.offset1donors.push(parseInt(x));
            });
        }
        this.offset2donors =[];
        if(data.offset2donors!==""){
            data.offset2donors.split(',').forEach((x)=>{
                this.offset2donors.push(parseInt(x));
            });
        }
        this.offset3donors =[];
        if(data.offset3donors!==""){
            data.offset3donors.split(',').forEach((x)=>{
                this.offset3donors.push(parseInt(x));
            });
        }
    }
}