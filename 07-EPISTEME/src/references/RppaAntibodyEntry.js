export class RppaAntibodyEntry {
    constructor(data){
        this.rppaId=parseInt(data.rppaId);
        this.rppaName=data.rppaName;
        this.geneIds=[];
        data.geneIds.split(',').forEach((geneId)=>{
            this.geneIds.push(parseInt(geneId));
        });
    }
}