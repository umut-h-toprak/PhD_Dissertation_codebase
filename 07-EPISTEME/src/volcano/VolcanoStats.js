import {shuff} from "../Utils";
let LogGamma = require('gamma').log;
let math = require('mathjs/core').create();
math.import(require('mathjs/lib/type/fraction'));
math.import(require('mathjs/lib/function/statistics/quantileSeq'));


export function trimeanFc(expressions1,expressions2){
    let quantiles1=math.quantileSeq(expressions1,[0.25,0.5,0.75]);
    let quantiles2=math.quantileSeq(expressions2,[0.25,0.5,0.75]);
    let trimean1=(quantiles1[0]+2*quantiles1[1]+quantiles1[2])/4;
    let trimean2=(quantiles2[0]+2*quantiles2[1]+quantiles2[2])/4;
    return Math.log2(trimean1)-Math.log2(trimean2);
}
export function meanFc(expressions1,expressions2){
    const mean1 = expressions1.reduce((a, b) => a + b) / expressions1.length;
    const mean2 = expressions2.reduce((a, b) => a + b) / expressions2.length;
    return Math.log2(mean1)-Math.log2(mean2);
}

export function pearsonCorrelation(expressions1,expressions2,quantity){
    let exp1s = expressions1.sort(function(a,b){
        if (a.donorIndex < b.donorIndex) {
            return -1;
        }else if(a.donorIndex > b.donorIndex){
            return 1;
        }
        return -1;
    });
    let exp2s = expressions2.sort(function(a,b){
        if (a.donorIndex < b.donorIndex) {
            return -1;
        }else if(a.donorIndex > b.donorIndex){
            return 1;
        }
        return -1;
    });
    // if(quantity==="rank"){
    //     console.log(exp1s,exp2s)
    // }
    let shortestArrayLength = expressions1.length;
    let xy = [];
    let x2 = [];
    let y2 = [];

    for(let i=0; i<shortestArrayLength; i++) {
        xy.push(exp1s[i][quantity] * exp2s[i][quantity]);
        x2.push(exp1s[i][quantity]* exp1s[i][quantity]);
        y2.push(exp2s[i][quantity] * exp2s[i][quantity]);
    }

    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_x2 = 0;
    let sum_y2 = 0;

    for(let i=0; i< shortestArrayLength; i++) {
        sum_x += exp1s[i][quantity];
        sum_y += exp2s[i][quantity];
        sum_xy += xy[i];
        sum_x2 += x2[i];
        sum_y2 += y2[i];
    }

    const step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
    const step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
    const step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
    const step4 = Math.sqrt(step2 * step3);
    return Math.min(0.99,step1 / step4);
}
export function spearmanCorrelation(expressions1,expressions2,maxIter){
    let exp1s = [];
    for(let j=0;j<expressions1.length; ++j) {
        let tmpObj={
            expression:expressions1[j].expression,
            donorIndex:expressions1[j].donorIndex,
            rank:1,
            tiedBlock:false,
        };
        exp1s.push(tmpObj)
    }
    let exp2s = [];
    for(let j=0;j<expressions2.length; ++j) {
        let tmpObj={
            expression:expressions2[j].expression,
            donorIndex:expressions2[j].donorIndex,
            rank:1,
            tiedBlock:false,
        };
        exp2s.push(tmpObj);
    }
    exp1s = exp1s.sort(function(a,b){
        if (a.expression < b.expression) {
            return -1;
        }else if(a.expression > b.expression){
            return 1;
        }
        return -1;
    });
    exp2s = exp2s.sort(function(a,b){
        if (a.expression < b.expression) {
            return -1;
        }else if(a.expression > b.expression){
            return 1;
        }
        return -1;
    });


    let anyTies=false;
    for(let i = 0; i < exp1s.length; ++i) {
        exp1s[i].rank=i+1;
        if(i>0){
            if(exp1s[i-1].expression===exp1s[i].expression){
                exp1s[i].tiedBlock=true;
                anyTies=true;
            }
        }
        if(i<exp1s.length-1){
            if(exp1s[i+1].expression===exp1s[i].expression){
                exp1s[i].tiedBlock=true;
                anyTies=true;
            }
        }
    }
    for(let i = 0; i < exp2s.length; ++i) {
        exp2s[i].rank=i+1;
        if(i>0){
            if(exp2s[i-1].expression===exp2s[i].expression){
                exp2s[i].tiedBlock=true;
                anyTies=true;
            }
        }
        if(i<exp2s.length-1){
            if(exp2s[i+1].expression===exp2s[i].expression){
                exp2s[i].tiedBlock=true;
                anyTies=true;
            }
        }
    }
    let tiedBlocks1=[];
    let currentTiedBlock1=0;
    for(let i = 0; i < exp1s.length; ++i) {
        if(exp1s[i].tiedBlock){
            currentTiedBlock1+=1;
        }else{
            if(currentTiedBlock1!==0){
                tiedBlocks1.push(currentTiedBlock1);
                currentTiedBlock1=0;
            }
        }
    }
    let tiedBlocks2=[];
    let currentTiedBlock2=0;
    for(let i = 0; i < exp2s.length; ++i) {
        if(exp2s[i].tiedBlock){
            currentTiedBlock2 +=1;
        }else{
            if(currentTiedBlock2!==0){
                tiedBlocks2.push(currentTiedBlock2);
                currentTiedBlock2=0;
            }
        }
    }

    if(!anyTies){
        return pearsonCorrelation(exp1s,exp2s,"rank");
    }else{
        let largestTiedBlock=Math.max(Math.max(...tiedBlocks1),Math.max(...tiedBlocks2));
        let permutations=0;
        let permutatedResults=[];
        while(permutations<Math.min(maxIter,Math.max(1,largestTiedBlock*2))){
            shuff(exp1s);
            exp1s = exp1s.sort(function(a,b){
                if (a.expression < b.expression) {
                    return -1;
                }else if(a.expression > b.expression){
                    return 1;
                }
                return -1;
            });
            shuff(exp2s);
            exp2s = exp2s.sort(function(a,b){
                if (a.expression < b.expression) {
                    return -1;
                }else if(a.expression > b.expression){
                    return 1;
                }
                return -1;
            });
            for(let i=0;i<exp1s.length;++i){
                exp1s[i].rank=i+1;
            }
            for(let i=0;i<exp1s.length;++i){
                exp2s[i].rank=i+1;
            }

            permutatedResults.push(pearsonCorrelation(exp1s,exp2s,"rank"));
            permutations+=1;
        }
        permutatedResults = permutatedResults.sort(function(a,b){
            if (a**2 < b**2) {
                return -1;
            }else if(a**2 > b**2){
                return 1;
            }
            return -1;
        });
        return permutatedResults[permutatedResults.length-1];
    }
}

export function chiCdf(stat,maxIter){
    let A0=0;
    let B0=1;
    let A1=1;
    let B1=stat;
    let AOLD=0;
    let N2=0;
    let iter=0;
    let error=Number.MAX_VALUE;
    while (iter<maxIter) {
        error = Math.abs((A1-AOLD)/A1);
        if(error < 0.000001){
            break;
        }
        AOLD=A1;
        N2=N2+1;
        A0=A1+(N2-stat)*A0;
        B0=B1+(N2-stat)*B0;
        A1=stat*A0+N2*A1;
        B1=stat*B0+N2*B1;
        A0=A0/B1;
        B0=B0/B1;
        A1=A1/B1;
        B1=1;
        iter+=1
    }
    return Math.max(0,-(0.5*Math.log(stat)-stat-LogGamma(0.5)+Math.log(A1)));
}