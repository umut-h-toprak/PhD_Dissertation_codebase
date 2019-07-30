export class ComplexSelectionTreeNode {
    constructor(data,selectionManager) {
        this.allUsedSelections=[];
        if (data.hasOwnProperty("rules")) {
            this.leaves=[];
            this.donorIndices=new Set();
            this.condition=data["condition"];
            for(let i=0;i<data["rules"].length;++i){
                this.leaves.push(new ComplexSelectionTreeNode(data["rules"][i],selectionManager));
                this.allUsedSelections.push(this.leaves[i].allUsedSelections[0]);
            }
        }else{
            const inverted=data.operator!=="equal";
            const selectionIndex=data.value;
            this.allUsedSelections.push(selectionIndex);
            if(!inverted){
                this.donorIndices=selectionManager.registeredSubcohorts.get(selectionIndex);
            }else{
                this.donorIndices=new Set([...selectionManager.cohortFullDonors].filter(x => !selectionManager.registeredSubcohorts.get(selectionIndex).has(x)));
            }
        }
    }
    compress(){
        if (this.hasOwnProperty("leaves")) {
            for(let i=0;i<this.leaves.length;++i){
                if(this.leaves[i].hasOwnProperty("leaves")){
                    this.leaves[i].compress();
                }
            }
            if(this.condition==="AND"){
                for(let i=1;i<this.leaves.length;++i){
                    this.leaves[i].donorIndices= new Set([...this.leaves[i-1].donorIndices].filter(x => this.leaves[i].donorIndices.has(x)));
                }
            }else if(this.condition==="OR"){
                for(let i=1;i<this.leaves.length;++i){
                    this.leaves[i].donorIndices=new Set([...this.leaves[i].donorIndices, ...this.leaves[i-1].donorIndices]);
                }
            }
            this.donorIndices=this.leaves[this.leaves.length-1].donorIndices;
        }
    }
}