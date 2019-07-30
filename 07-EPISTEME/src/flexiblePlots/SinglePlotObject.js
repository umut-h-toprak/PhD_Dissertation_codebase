export class SinglePlotObject {
    constructor(donorIndex,xPre,x,yPre,y,colourPre,colour,symbolPre,symbol,radiusPre,radius,stackedBarValuesPre,stackedBarValues,stackedBarValuesPrevious){
        this.donorIndex=donorIndex;
        this.xPre=xPre;
        this.x=x;
        this.yPre=yPre;
        this.y=y;
        this.colourPre=colourPre;
        this.colour=colour;
        this.symbolPre=symbolPre;
        this.symbol=symbol;
        this.radiusPre=radiusPre;
        this.radius=radius;
        this.stackedBarValuesPre=stackedBarValuesPre.slice();
        const stackedBarValuesPreLen=this.stackedBarValuesPre.length;
        this.stackedBarValuesPreCumulative=new Array(stackedBarValuesPreLen).fill(0);
        for(let i=0;i<stackedBarValuesPreLen;++i){
            for(let j=i;j<stackedBarValuesPreLen;++j){
                this.stackedBarValuesPreCumulative[i]+=this.stackedBarValuesPre[j].value;
            }
        }
    }
}