export class MetadataEntry {
    constructor(data){
        const undefinedValues=new Set([undefined,NaN,"NA","N.A",""]);
        let survivalAvailable=false;
        let survivalCensored=false;
        if(data.hasOwnProperty("publicationDonor")){
            data["privateDonor"]=data["donor"];
            data["donor"]=data["publicationDonor"];
        }
        if(!undefinedValues.has(data["OS.time"])){
            if(data.hasOwnProperty("_EVENT")){
                data["censoredOS"]=data["OS.time"];
                survivalAvailable=true;
                if(!undefinedValues.has(data["_EVENT"])){
                    if(data["_EVENT"]==="1"){
                        data["OS"]="1";
                    }else{
                        data["OS"]="0";
                    }
                }else{
                    data["OS"]="0";
                }
            }else{
                if(undefinedValues.has(data["OS"])){
                    if(!undefinedValues.has(data["censoredOS"])){
                        survivalAvailable=true;
                        data["OS"]="0";
                    }
                }else{
                    survivalAvailable=true;
                    data["OS"]="1";
                }
            }
        }
        if(data["OS"]==="1"){
            data["OS"]=data["censoredOS"];
            data["censoredOS"]="NA";
        }else{
            data["OS"]="NA";
            if(survivalAvailable){
                survivalCensored=true;
            }
        }
        // console.log(data["OS"],data["censoredOS"])
        // console.log(survivalAvailable,survivalCensored)
        let signatureTotals=1;
        Object.entries(data).forEach(([key, value]) =>{
            key=key.trim();
            if(undefinedValues.has(value)){
                value=NaN;
            }
            if($.isNumeric(value)){
                value=+value;
            }
            let fixedKey=key.replace(/_/g, ' ').replace(/\./g, ' ');
            this[fixedKey]=value;
            if(fixedKey.startsWith("COSMIC sig ")){
                signatureTotals-=value;
                if(fixedKey==="COSMIC sig 30"){
                    if(signatureTotals<1&&signatureTotals>0){
                        this["COSMIC sig unknown"]=signatureTotals;
                    }else{
                        this["COSMIC sig unknown"]=0;
                    }
                    let snvLoad=this["SNV load"];
                    if(!undefinedValues.has(snvLoad)){
                        for(let i=1;i<31;++i){
                            this[`COSMIC sig ${i} Muts`]=this["SNV load"]*this[`COSMIC sig ${i}`];
                        }
                        this["COSMIC sig unknown Muts"]=this["SNV load"]*this["COSMIC sig unknown"];
                    }else{
                        for(let i=1;i<31;++i){
                            this[`COSMIC sig ${i} Muts`]="";
                        }
                        this["COSMIC sig unknown Muts"]="";
                    }
                }
            }
        });
        this.survivalAvailable=survivalAvailable;
        this.survivalCensored=survivalCensored;
    }
    textExport(possibleMetadataColumns){
        let outputChunks=[
            this["donor"]
        ];
        possibleMetadataColumns.forEach((i,column,map)=>{
            if(column!=="donor"){
                outputChunks.push(this[column]);
            }
        });
        return outputChunks;
    }
}