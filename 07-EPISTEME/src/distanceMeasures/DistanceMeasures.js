export class DistanceMeasures {
    constructor() {
        this.validMetricsSparse = new Set('cityblock', 'cosine', 'euclidean', 'L1', 'L2', 'manhattan');
        this.validMetrics = new Set('cityblock', 'cosine', 'euclidean', 'L1', 'L2', 'manhattan', 'braycurtis', 'canberra', 'chebyshev', 'correlation', 'dice', 'hamming', 'jaccard', 'kulsinski', 'mahalanobis', 'minkowski', 'rogerstanimoto', 'russellrao', 'sokalmichener', 'sokalsneath', 'sqeuclidean', 'yule');
        this.realValidMetrics = ['cosine', 'euclidean','sqeuclidean','correlation', 'manhattan', 'braycurtis', 'canberra', 'chebyshev','hamming','diceBoolean', 'jaccardBoolean', 'kulsinskiBoolean', 'rogerstanimotoBoolean', 'russellraoBoolean', 'sokalmichenerBoolean', 'sokalsneathBoolean', 'yuleBoolean'];
    }
    static cityblock(arr1,arr2){
        let res=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            res+=Math.abs(arr1[i]-arr2[i]);
        }
        return res;
    }
    static manhattan(arr1,arr2){
        let res=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            res+=Math.abs(arr1[i]-arr2[i]);
        }
        return res;
    }
    static L1(arr1,arr2){
        let res=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            res+=Math.abs(arr1[i]-arr2[i]);
        }
        return res;
    }
    static cosine(arr1,arr2){
        let mag1Sum=0;
        let mag2Sum=0;
        let dotSum=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            mag1Sum+=Math.pow(arr1[i],2);
            mag2Sum+=Math.pow(arr2[i],2);
            dotSum+=arr1[i]*arr2[i]
        }
        return 1-dotSum/(Math.sqrt(mag1Sum)*Math.sqrt(mag2Sum));
    }
    static euclidean(arr1,arr2){
        let res=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            res+=Math.pow(arr1[i]-arr2[i],2);
        }
        return Math.sqrt(res);
    }
    static L2(arr1,arr2){
        let res=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            res+=Math.pow(arr1[i]-arr2[i],2);
        }
        return Math.sqrt(res);
    }
    static braycurtis(arr1,arr2){
        let res1=0;
        let res2=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            res1+=Math.abs(arr1[i]-arr2[i]);
            res2+=Math.abs(arr1[i]+arr2[i]);
        }
        return res1/res2;
    }
    static canberra(arr1,arr2){
        let res1=0;
        let res2=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            res1+=Math.abs(arr1[i]-arr2[i]);
            res2+=Math.abs(arr1[i])+Math.abs(arr2[i]);
        }
        return res1/res2;
    }
    static chebyshev(arr1,arr2){
        let resMax=0;
        let resCurrent=-1;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            resCurrent=Math.abs(arr1[i]-arr2[i]);
            if(resCurrent>resMax){
                resMax=resCurrent;
            }
        }
        return resMax;
    }
    static correlation(arr1,arr2){
        let sum1=0;
        let sum2=0;
        const L = arr1.length;
        for(let i=0;i<L;++i){
            sum1+=arr1[i];
            sum2+=arr2[i];
        }
        const mean1=sum1/L;
        const mean2=sum2/L;
        let normed1=arr1;
        let normed2=arr2;
        let mag1Normed=0;
        let mag2Normed=0;
        let dotSumNormed=0;
        for(let i=0;i<L;++i){
            normed1[i]-=mean1;
            normed2[i]-=mean2;
            dotSumNormed+=normed1[i]*normed2[i];
            mag1Normed+=Math.pow(normed1[i],2);
            mag2Normed+=Math.pow(normed2[i],2);
        }
        return 1-(dotSumNormed/(Math.sqrt(mag1Normed*mag2Normed)));
    }
    static hamming(arr1,arr2){
        let mismatches=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            if(arr1[i]!==arr2[i]){
                mismatches+=1;
            }
        }
        return mismatches/L;
    }
    static sqeuclidean(arr1,arr2){
        let res=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            res+=Math.pow(arr1[i]-arr2[i],2);
        }
        return res;
    }
    static diceBoolean(arr1,arr2){
        let matchesTT=0;
        let mismatches=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            if(arr1[i]===arr2[i]){
                if(arr1[i]===1){
                    matchesTT+=1;
                }
            }else{
                mismatches+=1;
            }
        }
        return mismatches/(2*matchesTT+mismatches);
    }
    static jaccardBoolean(arr1,arr2){
        let matchesTT=0;
        let mismatches=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            if(arr1[i]===arr2[i]){
                if(arr1[i]===1){
                    matchesTT+=1;
                }
            }else{
                mismatches+=1;
            }
        }
        return mismatches/(matchesTT+mismatches);
    }
    static kulsinskiBoolean(arr1,arr2){
        let matchesTT=0;
        let mismatches=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            if(arr1[i]===arr2[i]){
                if(arr1[i]===1){
                    matchesTT+=1;
                }
            }else{
                mismatches+=1;
            }
        }
        return (mismatches-matchesTT+L)/(L+mismatches);
    }
    static rogerstanimotoBoolean(arr1,arr2){
        let L = arr1.length;
        let matches=0;
        let mismatches=0;
        for(let i=0;i<L;++i){
            if(arr1[i]===arr2[i]){
                matches+=1;
            }else{
                mismatches+=1;
            }
        }
        return (2*mismatches)/matches;
    }
    static russellraoBoolean(arr1,arr2){
        let L = arr1.length;
        let matches=0;
        for(let i=0;i<L;++i){
            if(arr1[i]===arr2[i]){
                matches+=1;
            }
        }
        return (L-matches)/L;
    }
    static sokalmichenerBoolean(arr1,arr2){
        let L = arr1.length;
        let matches=0;
        let mismatches=0;
        for(let i=0;i<L;++i){
            if(arr1[i]===arr2[i]){
                matches+=1;
            }else{
                mismatches+=1;
            }
        }
        return (2*mismatches)/(2*mismatches+matches);
    }
    static sokalsneathBoolean(arr1,arr2){
        let matchesTT=0;
        let mismatches=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            if(arr1[i]===arr2[i]){
                if(arr1[i]===1){
                    matchesTT+=1;
                }
            }else{
                mismatches+=1;
            }
        }
        return (2*mismatches)/(matchesTT+2*mismatches);
    }
    static yuleBoolean(arr1,arr2){
        let matchesTT=0;
        let matchesFF=0;
        let mismatchesTF=0;
        let mismatchesFT=0;
        let L = arr1.length;
        for(let i=0;i<L;++i){
            if(arr1[i]===arr2[i]){
                if(arr1[i]===1){
                    matchesTT+=1;
                }else{
                    matchesFF+=1;
                }
            }else{
                if(arr1[i]===1){
                    mismatchesTF+=1;
                }else{
                    mismatchesFT+=1;
                }
            }
        }
        return (2*mismatchesFT*mismatchesTF)/(matchesTT*matchesFF+mismatchesTF*mismatchesFT);
    }

}