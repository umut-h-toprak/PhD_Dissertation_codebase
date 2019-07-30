import {density as kernelSmoothDensity, fun as kernelSmoothFunctions} from "kernel-smooth";
import {linspace} from "../Utils";

let math = require('mathjs/core').create();
math.import(require('mathjs/lib/type/fraction'));
math.import(require('mathjs/lib/function/statistics/quantileSeq'));
math.import(require('mathjs/lib/function/statistics/std'));

export function calculateKde(vals){
    //https://github.com/Planeshifter/kernel-smooth
    const bw=bandwidthSheatherJones(vals);
    const kdeFunc=kernelSmoothDensity(vals,kernelSmoothFunctions.gaussian,bw);
    let minVal=Number.MAX_VALUE;
    let maxVal=Number.MIN_VALUE;
    const N = vals.length;
    for(let i=0;i<N;++i){
        const val = vals[i];
        if(val<minVal){
            minVal=val;
        }
        if(val>maxVal){
            maxVal=val;
        }
    }
    const kdeRange=linspace(minVal,maxVal+0.0001,1000);
    const kdeFit = kdeFunc(kdeRange);
    let maxDensity=Number.MIN_VALUE;
    for(let i=0;i<1000;++i){
        const fitTmp=kdeFit[i];
        if(fitTmp>maxDensity){
            maxDensity=fitTmp;
        }
    }
    return [kdeRange,kdeFit,maxDensity];
}

function bandwidthSheatherJones(xs){
    // adapted from https://github.com/Neojume/pythonABC
    let h0 = bandwidthNorm(xs);
    let v0 = eq12SheatherJones(xs, h0);
    let hstep=0.9;
    if(v0 > 0){
        hstep = 1.1;
    }
    let h1 = h0 * hstep;
    let v1 = eq12SheatherJones(xs, h1);

    while(v1 * v0 > 0){
        h0 = h1;
        v0 = v1;
        h1 = h0 * hstep;
        v1 = eq12SheatherJones(xs, h1);
    }
    return h0 + (h1 - h0) * Math.abs(v0) / (Math.abs(v0) + Math.abs(v1))
}

function bandwidthNorm(xs) {
    const N=xs.length;
    const sd = math.std(xs);
    return sd * (4 / (3 * N)) ** (1 / 5.0);
}
function dnorm(xs){
    return normalPdf(xs, 0.0, 1.0);
}
function normalPdf(xs, mu, sigma){
    const N=xs.length;
    const loggedRes=normalLogpdf(xs, mu, sigma);
    let res=[];
    for(let i=0;i<N;++i){
        res.push(Math.exp(loggedRes[i]));
    }
    return res;
}

function normalLogpdf(xs, mu, sigma){
    const N=xs.length;
    let res=[];
    for(let i=0;i<N;++i){
        res.push(-0.5 * Math.log(2.0 * Math.PI) - Math.log(sigma) - 0.5 * Math.pow((xs[i] - mu) , 2) / (Math.pow(sigma ,2)));
    }
    return res;
}

function eq12SheatherJones(xs,h) {
    const N=xs.length;
    const phi6 = (xsIns)=>{
        const resTmp=dnorm(xsIns);
        const xsInLen=xsIns.length;
        let res=[];
        for(let i=0;i<xsInLen;++i){
            const x = xsIns[i];
            res.push((Math.pow(x, 6) - 15 * Math.pow(x, 4) + 45 * Math.pow(x, 2) - 15) * resTmp[i]);
        }
        return res;
    };
    const phi4 = (xsIns)=>{
        const resTmp=dnorm(xsIns);
        const xsInLen=xsIns.length;
        let res=[];
        for(let i=0;i<xsInLen;++i){
            const x = xsIns[i];
            res.push((Math.pow(x, 4) - 6 * Math.pow(x,2) + 3) * resTmp[i]);
        }
        return res;
    };

    const quantiles = math.quantileSeq(xs,[0.25,0.75]);
    const lam = quantiles[1]-quantiles[0];
    const a = 0.92 * lam * Math.pow(N ,(-1 / 7));
    const b = 0.912 * lam * Math.pow(N,(-1 / 9));
    let W=[];
    let WT=[];
    for(let i=0;i<N;++i){
        W.push(xs.slice())
    }
    for(let i=0;i<N;++i){
        WT.push(new Array(N).fill(0))
        for(let j=0;j<N;++j){
            WT[i][j]=W[j][i];
        }
    }
    for(let i=0;i<N;++i){
        for(let j=0;j<N;++j){
            W[i][j]-=WT[i][j];
        }
    }

    let tdb=0;
    for(let i=0;i<N;++i){
        let tmpRow=W[i].slice();
        for(let i=0;i<N;++i){
            tmpRow[i]/=b;
        }
        const tmpRes=phi6(tmpRow);
        tmpRes.forEach((x)=>{
            tdb+=x;
        });
    }
    tdb = -tdb / (N * (N - 1) * Math.pow(b, 7));
    let sda=0;
    for(let i=0;i<N;++i){
        let tmpRow=W[i].slice();
        for(let i=0;i<N;++i){
            tmpRow[i]/=a;
        }
        const tmpRes=phi4(tmpRow);
        tmpRes.forEach((x)=>{
            sda+=x;
        });
    }
    sda = sda / (N * (N - 1) * Math.pow(a, 5));
    const alpha2 = 1.357 * Math.pow(Math.abs(sda / tdb), (1 / 7.0)) * Math.pow(h , (5 / 7));
    let sdalpha2=0;
    for(let i=0;i<N;++i){
        let tmpRow=W[i].slice();
        for(let i=0;i<N;++i){
            tmpRow[i]/=alpha2;
        }
        const tmpRes=phi4(tmpRow);
        tmpRes.forEach((x)=>{
            sdalpha2+=x;
        });
    }
    sdalpha2 = sdalpha2 / (N * (N - 1) * Math.pow(alpha2 , 5));

    return Math.pow(normalPdf([0], 0, Math.sqrt(2))[0] / (N * Math.abs(sdalpha2)), 0.2) - h
}
