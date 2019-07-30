export class FragileSiteEntry{
    constructor(data){
        this.fragileSiteIndex=parseInt(data.fragileSiteIndex);
        this.chromosomeIndex=parseInt(data.chromosomeIndex);
        this.startPos=parseInt(data.startPos);
        this.endPos=parseInt(data.endPos);
        this.fragileSiteNames=data.fragileSiteNames.split(',');
    }
    getGeneCardsLink(){
        let retLink="";
        for (let i = 0; i < this.fragileSiteNames.length; ++i) {
            retLink += `<a href="https://www.genecards.org/cgi-bin/carddisp.pl?gene=${this.fragileSiteNames[i]}#aliases_descriptions" target="_blank">${this.fragileSiteNames[i]}</a>`;
            if(i < this.fragileSiteNames.length-1){
                retLink += ", ";
            }
        }
        return retLink;
    }
}