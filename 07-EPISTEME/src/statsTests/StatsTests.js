import {chiCdf} from "../volcano/VolcanoStats";
import {shuff} from "../Utils";
import {Nonparametric, StudentT, Vector,T} from "jerzy";
const ttest = require('ttest');
const mathfn = require('mathfn');

export class StatsTests{
    constructor(){

    }
    static KwTest(expressions1,expressions2,maxIter,maxIterChiCdf){
        let x = [];
        for(let j=0;j<expressions1.length; ++j) {
            let tmpObj={
                expression:expressions1[j],
                group:0,
                rank:1,
                tiedBlock:false,
            };
            x.push(tmpObj)
        }
        for(let j=0;j<expressions2.length; ++j) {
            let tmpObj={
                expression:expressions2[j],
                group:1,
                rank:1,
                tiedBlock:false,
            };
            x.push(tmpObj);
        }
        let N = x.length;
        x = x.sort(function(a,b){
            if (a.expression < b.expression) {
                return -1;
            }else if(a.expression > b.expression){
                return 1;
            }
            return -1;
        });
        let anyTies=false;
        let xTieCompensated=[];
        for(let i = 0; i < N; ++i) {
            x[i].rank=i+1;
            if(i>0){
                if(x[i-1].expression===x[i].expression){
                    x[i].tiedBlock=true;
                    anyTies=true;
                }
            }
            if(i<N-1){
                if(x[i+1].expression===x[i].expression){
                    x[i].tiedBlock=true;
                    anyTies=true;
                }
            }
            xTieCompensated.push(x[i]);
        }
        let tiedBlocks=[];
        let currentTiedBlock=0;
        for(let i = 0; i < N; ++i) {
            if(x[i].tiedBlock){
                currentTiedBlock+=1;
            }else{
                if(currentTiedBlock!==0){
                    tiedBlocks.push(currentTiedBlock);
                    currentTiedBlock=0;
                }
            }
        }
        let largestTiedBlock=Math.max(...tiedBlocks);
        if(anyTies){
            let permutations=0;
            let permutatedResults=[];
            while(permutations<Math.min(maxIter,Math.max(1,largestTiedBlock*2))){
                shuff(x);
                x = x.sort(function(a,b){
                    if (a.expression < b.expression) {
                        return -1;
                    }else if(a.expression > b.expression){
                        return 1;
                    }
                    return -1;
                });
                let xTieCompensated=[];
                for(let i = 0; i < N; ++i) {
                    x[i].rank=i+1;
                    xTieCompensated.push(x[i]);
                }
                let groupRankSums=[0,0];
                for(let i = 0; i < N; ++i) {
                    groupRankSums[xTieCompensated[i].group] += xTieCompensated[i].rank;
                }
                let tieSumTerm = 0;
                // for(let i = 0; i < diffPrepArrNonzeroIndices.length-1; ++i) {
                //     let tmpVal=diffPrepArrNonzeroIndices[i+1]-diffPrepArrNonzeroIndices[i];
                //     tieSumTerm+=(Math.pow(tmpVal,3)-tmpVal)/(Math.pow(N, 3) - N);
                // }
                let stat1=(Math.pow(groupRankSums[0],2)/expressions1.length+Math.pow(groupRankSums[1],2)/expressions2.length);
                let stat2 = (12 / (N * (N+1))) * stat1 - 3 * ( N + 1 );
                if(stat2!==0){
                    let stat3 = 0.5 * stat2 /(1 - tieSumTerm);
                    let tmpRes=chiCdf(stat3,maxIterChiCdf);
                    if(Math.pow(10,-tmpRes)>0.5){
                        return tmpRes
                    }
                    permutatedResults.push(tmpRes);
                }
                permutations+=1;
            }
            return Math.min(...permutatedResults);
        }
        else{
            let groupRankSums=[0,0];
            for(let i = 0; i < N; ++i) {
                groupRankSums[xTieCompensated[i].group] += xTieCompensated[i].rank;
            }
            let stat1=(Math.pow(groupRankSums[0],2)/expressions1.length+Math.pow(groupRankSums[1],2)/expressions2.length);
            let stat2 = (12 / (N * (N+1))) * stat1 - 3 * ( N + 1 );
            if(stat2===0){
                return 0;
            }else{
                let stat3 = 0.5 * stat2;
                return chiCdf(stat3,maxIterChiCdf);
            }
        }
    }
    static KsTest(x,y,maxIter,maxIterChiCdf) {
        let res = new Nonparametric.kolmogorovSmirnov(new Vector(x),new Vector(y));
        return -Math.log10(res.p);
    }

    static rbeta(x, a, b){
        const res1=mathfn.incBeta(x,a,b);
        const res2=mathfn.logBeta(a,b);
        return Math.exp(Math.log(res1)-res2);
    }
    static TTest(x,y,maxIter,maxIterChiCdf) {
        const resPre=ttest(x,y,{ varEqual: true});
        const tValue=Math.abs(resPre.testValue());
        const df=resPre.freedom();
        const betaRes=StatsTests.rbeta(df / (Math.pow(tValue, 2) + df), df / 2, 0.5);
        return -Math.log10(betaRes);
    }
    static randint(minVal,maxVal){
        return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    }
    static cdfSync(sampleSuccesses, draws, successPop, totalPop, lowerTail = true) {
        //https://github.com/zachmart/distriprob
        const k = sampleSuccesses;
        const n = draws;
        const K = successPop;
        const N = totalPop;
        const mean = n * (K / N);
        const easyCaseResult = StatsTests._cdfSyncEasyCases(k, n, K, N, lowerTail);
        if (easyCaseResult !== null){
            return easyCaseResult;
        }
        else {
            if (k <= mean) {
                const lnh0Eval = StatsTests.lnh0(n, K, N);
                return StatsTests._cdfSyncHardCase(lnh0Eval, k, draws, successPop, totalPop, lowerTail);
            }
            else {
                const lnhMaxEval = StatsTests.lnhMax(n, K, N);
                return StatsTests._cdfSyncHardCase(lnhMaxEval, k, draws, successPop, totalPop, lowerTail);
            }
        }
    }
    static _cdfSyncEasyCases(k, n, K, N, lowerTail) {
        //https://github.com/zachmart/distriprob
        if (N === 0 || K === 0 || n === 0) {
            if (k >= 0) {
                if (lowerTail) {
                    return 1;
                }
                else {
                    return 0;
                }
            }
            else {
                if (lowerTail) {
                    return 0;
                }
                else {
                    return 1;
                }
            }
        }
        else if (N === K) {
            if (k >= n) {
                if (lowerTail) {
                    return 1;
                }
                else {
                    return 0;
                }
            }
            else {
                if (lowerTail) {
                    return 0;
                }
                else {
                    return 1;
                }
            }
        }
        else if (N === n) {
            if (k >= K) {
                if (lowerTail) {
                    return 1;
                }
                else {
                    return 0;
                }
            }
            else {
                if (lowerTail) {
                    return 0;
                }
                else {
                    return 1;
                }
            }
        }
        else if (k >= K || k >= n) {
            if (lowerTail) {
                return 1;
            }
            else {
                return 0;
            }
        }
        else if (k < 0 || k < (n + K - N)) {
            if (lowerTail) {
                return 0;
            }
            else {
                return 1;
            }
        }
        else {
            return null;
        }
    }
    static _cdfSyncHardCase(lnhEval, k, n, K, N, lowerTail) {
        //https://github.com/zachmart/distriprob
        let sum = 0;
        let current = lnhEval;
        let mean = n * (K / N);
        if (k <= mean) {
            for (let i = 0; i <= k; i++) {
                sum += Math.exp(current);
                current = Math.log(((K - i) * (n - i)) / ((i + 1) * (N - K - n + i + 1))) + current;
            }
            if (lowerTail) {
                return sum;
            }
            else {
                return 1 - sum;
            }
        }
        else {
            for (let i = Math.min(n, K); i > k; i--) {
                sum += Math.exp(current);
                current = Math.log((i * (N - K - n + i)) / ((K - i + 1) * (n - i + 1))) + current;
            }
            if (lowerTail) {
                return 1 - sum;
            }
            else {
                return sum;
            }
        }
    }
    static lnh0(draws, successPop, totalPop) {
        //https://github.com/zachmart/distriprob
        const n = draws;
        const K = successPop;
        const N = totalPop;
        return StatsTests.lnFactorialFractionEval([N - K, N - n], [N, N - K - n]);
    }
    static lnhMax(draws, successPop, totalPop) {
        //https://github.com/zachmart/distriprob
        const n = draws;
        const K = successPop;
        const N = totalPop;
        const max = Math.min(n, K);
        return StatsTests.lnFactorialFractionEval([K, N - max], [N, K - max]);
    }
    static lnFactorialFractionEval(numFactArgs, denomFactArgs) {
        //https://github.com/zachmart/distriprob
        const numPrimeFactorization = StatsTests.factorialPrimes(numFactArgs);
        const denomPrimeFactorization = StatsTests.factorialPrimes(denomFactArgs);
        // cancel out prime factors common to both numerator and denominator
        for (let p in numPrimeFactorization) {
            if (p in denomPrimeFactorization) {
                if (numPrimeFactorization[p] === denomPrimeFactorization[p]) {
                    numPrimeFactorization[p] = 0;
                    denomPrimeFactorization[p] = 0;
                }
                else if (numPrimeFactorization[p] >= denomPrimeFactorization[p]) {
                    numPrimeFactorization[p] -= denomPrimeFactorization[p];
                    denomPrimeFactorization[p] = 0;
                }
                else {
                    denomPrimeFactorization[p] -= numPrimeFactorization[p];
                    numPrimeFactorization[p] = 0;
                }
            }
        }
        let lnResult = 0;
        for (let p in numPrimeFactorization) {
            for (let i = 1; i <= numPrimeFactorization[p]; i++) {
                lnResult += Math.log(+p);
            }
        }
        for (let p in denomPrimeFactorization) {
            for (let i = 1; i <= denomPrimeFactorization[p]; i++) {
                lnResult -= Math.log(+p);
            }
        }
        return lnResult;
    }
    static factorialPrimes(nOrArrayOfNs) {
        //https://github.com/zachmart/distriprob
        const result = {};
        let current;
        const arrayOfNs = Array.isArray(nOrArrayOfNs) ? nOrArrayOfNs : [nOrArrayOfNs];
        for (let n of arrayOfNs) {
            current = StatsTests._factorialPrimes(n);
            for (let p in current) {
                if (result[p]) {
                    result[p] += current[p];
                }
                else {
                    result[p] = current[p];
                }
            }
        }
        return result;
    }
    static _factorialPrimes(n) {
        //https://github.com/zachmart/distriprob
        if (n === 0 || n === 1) {
            return {};
        }
        else {
            const result = {};
            const primesLessThanOrEqualToN = StatsTests.primesLessThanOrEqualTo(n);
            let pToi;
            for (let p of primesLessThanOrEqualToN) {
                for (let i = 1; (pToi = Math.pow(p, i)) <= n; i++) {
                    let bracketX = Math.floor(n / pToi);
                    if (result[p]) {
                        result[p] += bracketX;
                    }
                    else {
                        result[p] = bracketX;
                    }
                }
            }
            return result;
        }
    }
    static primesLessThanOrEqualTo(n) {
        //https://github.com/zachmart/distriprob
        if (n === 1) {
            return [1];
        }
        else {
            const isPrime = [];
            const sqrtN = Math.sqrt(n);
            let index;
            let jIndex;
            for (let i = 2; i <= n; i++) {
                isPrime.push(true);
            }
            for (let i = 2; i < sqrtN; i++) {
                index = i - 2;
                if (isPrime[index]) {
                    for (let j = i * i; j <= n; j += i) {
                        jIndex = j - 2;
                        isPrime[jIndex] = false;
                    }
                }
            }
            let result = [];
            for (let i = 0; i < isPrime.length; i++) {
                if (isPrime[i]) {
                    result.push(i + 2);
                }
            }
            return result;
        }
    }

    static lngamm (z) {
        // Reference: "Lanczos, C. 'A precision approximation
        // of the gamma function', J. SIAM Numer. Anal., B, 1, 86-96, 1964."
        // Translation of  Alan Miller's FORTRAN-implementation
        // See http://lib.stat.cmu.edu/apstat/245
        let x = 0;
        x += 0.1659470187408462e-06 / (z + 7);
        x += 0.9934937113930748e-05 / (z + 6);
        x -= 0.1385710331296526     / (z + 5);
        x += 12.50734324009056      / (z + 4);
        x -= 176.6150291498386      / (z + 3);
        x += 771.3234287757674      / (z + 2);
        x -= 1259.139216722289      / (z + 1);
        x += 676.5203681218835      / (z);
        x += 0.9999999999995183;
        return (Math.log (x) - 5.58106146679532777 - z + (z - 0.5) * Math.log (z + 6.5));
    }
    static lnfact(n) {
        if (n <= 1) return (0);
        return (StatsTests.lngamm (n + 1));
    }
    static lnbico(n, k) {
        return (StatsTests.lnfact (n) - StatsTests.lnfact (k) - StatsTests.lnfact (n - k));
    }
    static exact_nc(n11, n12, n21, n22, w) {
        // https://bioinfo.iric.ca/a-javascript-implementation-of-the-non-central-version-of-fishers-exact-test/
        // https://bioinfo.iric.ca/tweaking-fishers-exact-test-for-biology/
        let x = n11;
        let m1 = n11 + n21;
        let m2 = n12 + n22;
        let n = n11 + n12;
        let x_min = Math.max (0, n - m2);
        let x_max = Math.min (n, m1);
        let l = [];
        for (let i = x_min; i <= x_max; i++) {
            l[i - x_min] = (StatsTests.lnbico(m1, i) + StatsTests.lnbico(m2, n - i) + i * Math.log (w));
        }
        let max_l = Math.max.apply (Math, l);
        let sum_l = l.map (function (x) { return Math.exp (x - max_l); }).reduce (function (a, b) {
            return a + b; }, 0);
        sum_l = Math.log (sum_l);

        let den_sum = 0;
        for (let i = x; i <= x_max; i++) {
            den_sum += Math.exp (l[i - x_min] - max_l);
        }
        den_sum = Math.log (den_sum);
        return Math.exp (den_sum - sum_l);
    };
    static fisherExactNonCentered(contingencyTable,enrichmentThreshold){
        return StatsTests.exact_nc(contingencyTable[0][0],contingencyTable[0][1],contingencyTable[1][0],contingencyTable[1][1],enrichmentThreshold);
    }
}