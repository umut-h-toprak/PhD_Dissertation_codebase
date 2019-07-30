export class VariantRecurrenceEntryCnv {
    constructor(data){
        this.tadIndex=parseInt(data.tadIndex);
        this.lossDonors =[];
        if(data.lossDonors !== ""){
            data.lossDonors.split(',').forEach((x)=>{
                this.lossDonors.push(parseInt(x));
            });
        }
        this.gainDonors =[];
        if(data.gainDonors !== ""){
            data.gainDonors.split(',').forEach((x)=>{
                this.gainDonors.push(parseInt(x));
            });}

        this.lohDonors =[];
        if(data.lohDonors !== ""){
            data.lohDonors.split(',').forEach((x)=>{
                this.lohDonors.push(parseInt(x));
            });
        }
    }
}