// Heavily modified from
// https://github.com/karpathy/tsnejs
// create main global object

// import {currentTime} from '../Utils'

var tsnejs = tsnejs || { REVISION: 'ALPHA' };

(function(global) {
    "use strict";

    // utility function
    var assert = function(condition, message) {
        if (!condition) { throw message || "Assertion failed"; }
    };

    // syntax sugar
    var getopt = function(opt, field, defaultval) {
        if(opt.hasOwnProperty(field)) {
            return opt[field];
        } else {
            return defaultval;
        }
    };

    // return 0 mean unit standard deviation random number
    var return_v = false;
    var v_val = 0.0;
    var gaussRandom = function() {
        if(return_v) {
            return_v = false;
            return v_val;
        }
        var u = 2*Math.random()-1;
        var v = 2*Math.random()-1;
        var r = u*u + v*v;
        if(r == 0 || r > 1) return gaussRandom();
        var c = Math.sqrt(-2*Math.log(r)/r);
        v_val = v*c; // cache this for next function call for efficiency
        return_v = true;
        return u*c;
    };

    // return random normal number
    var randn = function(mu, std){ return mu+gaussRandom()*std; }

    // utilitity that creates contiguous vector of zeros of size n
    var zeros = function(n) {
        if(typeof(n)==='undefined' || isNaN(n)) { return []; }
        if(typeof ArrayBuffer === 'undefined') {
            // lacking browser support
            var arr = new Array(n);
            for(var i=0;i<n;i++) { arr[i]= 0; }
            return arr;
        } else {
            return new Float64Array(n); // typed arrays are faster
        }
    };

    // utility that returns 2d array filled with random numbers
    // or with value s, if provided
    var randn2d = function(n,d,s) {
        var uses = typeof s !== 'undefined';
        // var x = [];
        let x =new Array(n*d).fill(0);
        for(var i=0;i<n;i++) {
            // var xhere = [];
            for(var j=0;j<d;j++) {
                const ind = i*d+j;
                if(uses) {
                    x[ind]=s;
                    // xhere.push(s);
                } else {
                    x[ind]=randn(0.0, 1e-4);
                    // xhere.push(randn(0.0, 1e-4));
                }
            }
            // x.push(xhere);
        }
        return x;
    };

    // // compute L2 distance between two vectors
    // var L2 = function(x1, x2,D) {
    //     var d = 0;
    //     for(var k=0;k<D;k++) {
    //         var x1i = x1[k];
    //         var x2i = x2[k];
    //         d += (x1i-x2i)*(x1i-x2i);
    //     }
    //     return d;
    // };

    // compute pairwise distance in all vectors in X
    var xtod = function(X,N,D) {
        let dist = zeros(N * N); // allocate contiguous array
        for(let i=0;i<N;i++) {
            for(let j=i+1;j<N;j++) {
                let d = 0;
                for(let k=0;k<D;k++) {
                    const dif=X[i][k]-X[j][k];
                    d += dif*dif;
                }
                dist[i*N+j] = d;
                dist[j*N+i] = d;
            }
        }
        return dist;
    };

    // compute (p_{i|j} + p_{j|i})/(2n)
    var d2p = function(D, perplexity, tol) {
        var Nf = Math.sqrt(D.length); // this better be an integer
        var N = Math.floor(Nf);
        assert(N === Nf, "D should have square number of elements.");
        var Htarget = Math.log(perplexity); // target entropy of distribution
        var P = zeros(N * N); // temporary probability matrix

        var prow = zeros(N); // a temporary storage compartment
        for(var i=0;i<N;i++) {
            var betamin = -Infinity;
            var betamax = Infinity;
            var beta = 1; // initial value of precision
            var done = false;
            var maxtries = 50;

            // perform binary search to find a suitable precision beta
            // so that the entropy of the distribution is appropriate
            var num = 0;
            while(!done) {
                //debugger;

                // compute entropy and kernel row with beta precision
                var psum = 0.0;
                for(var j=0;j<N;j++) {
                    var pj = Math.exp(- D[i*N+j] * beta);
                    if(i===j) { pj = 0; } // we dont care about diagonals
                    prow[j] = pj;
                    psum += pj;
                }
                // normalize p and compute entropy
                var Hhere = 0.0;
                for(var j=0;j<N;j++) {
                    if(psum == 0) {
                        var pj = 0;
                    } else {
                        var pj = prow[j] / psum;
                    }
                    prow[j] = pj;
                    if(pj > 1e-7) Hhere -= pj * Math.log(pj);
                }

                // adjust beta based on result
                if(Hhere > Htarget) {
                    // entropy was too high (distribution too diffuse)
                    // so we need to increase the precision for more peaky distribution
                    betamin = beta; // move up the bounds
                    if(betamax === Infinity) { beta = beta * 2; }
                    else { beta = (beta + betamax) / 2; }

                } else {
                    // converse case. make distrubtion less peaky
                    betamax = beta;
                    if(betamin === -Infinity) { beta = beta / 2; }
                    else { beta = (beta + betamin) / 2; }
                }

                // stopping conditions: too many tries or got a good precision
                num++;
                if(Math.abs(Hhere - Htarget) < tol) { done = true; }
                if(num >= maxtries) { done = true; }
            }

            // console.log('data point ' + i + ' gets precision ' + beta + ' after ' + num + ' binary search steps.');
            // copy over the final prow to P at row i
            for(var j=0;j<N;j++) { P[i*N+j] = prow[j]; }

        } // end loop over examples i

        // symmetrize P and normalize it to sum to 1 over all ij
        var Pout = zeros(N * N);
        var N2 = N*2;
        for(var i=0;i<N;i++) {
            for(var j=0;j<N;j++) {
                Pout[i*N+j] = Math.max((P[i*N+j] + P[j*N+i])/N2, 1e-100);
            }
        }

        return Pout;
    };

    // helper function
    function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }

    var tSNE = function(opt) {
        var opt = opt || {};
        this.perplexity = getopt(opt, "perplexity", 30); // effective number of nearest neighbors
        this.earlyExaggeration=getopt(opt, "earlyExaggeration", 12);
        this.lateExaggeration=getopt(opt, "lateExaggeration", 1.5);
        this.iterationsEarlyExaggeration=getopt(opt,"iterationsEarlyExaggeration",100);
        this.iterationsLateExaggeration=getopt(opt,"iterationsLateExaggeration",250);
        this.dim = getopt(opt, "dim", 2); // by default 2-D tSNE
        this.epsilon = getopt(opt, "epsilon", 10); // learning rate
        this.maxIter=getopt(opt, "maxIter", 1000);
        this.alpha=getopt(opt, "alpha", 1);
        this.df=1/this.alpha;
        this.iter = 0;
        this.itersWithoutProgress = 0;
        this.minCost=Number.MAX_VALUE;
    };

    tSNE.prototype = {
        // this function takes a set of high-dimensional points
        // and creates matrix P from them using gaussian kernel
        initDataRaw: function(X) {
            // console.log("tsneInit:",currentTime())
            const N = X.length;
            const D = X[0].length;
            assert(N > 0, " X is empty? You must have some data!");
            assert(D > 0, " X[0] is empty? Where is the data?");
            const dists = xtod(X,N,D); // convert X to distances using gaussian kernel
            this.P = d2p(dists, this.perplexity, 1e-4); // attach to object
            this.N = N; // back up the size of the dataset
            this.NN=N*N;
            this.Qu = zeros(this.NN);
            this.Q = zeros(this.NN);
            this.grad=new Array(N*this.dim).fill(0);
            this.initSolution(); // refresh this
            // console.log("tsneInitDone:",currentTime())
        },

        // this function takes a given distance matrix and creates
        // matrix P from them.
        // D is assumed to be provided as a list of lists, and should be symmetric
        initDataDist: function(D) {
            var N = D.length;
            assert(N > 0, " X is empty? You must have some data!");
            // convert D to a (fast) typed array version
            var dists = zeros(N * N); // allocate contiguous array
            for(var i=0;i<N;i++) {
                for(var j=i+1;j<N;j++) {
                    var d = D[i][j];
                    dists[i*N+j] = d;
                    dists[j*N+i] = d;
                }
            }
            this.P = d2p(dists, this.perplexity, 1e-4);
            this.N = N;
            this.initSolution(); // refresh this
        },

        // (re)initializes the solution to random
        initSolution: function() {
            // generate random solution to t-SNE
            this.Y = randn2d(this.N, this.dim); // the solution
            this.gains = randn2d(this.N, this.dim, 1.0); // step gains to accelerate progress in unchanging directions
            this.ystep = randn2d(this.N, this.dim, 0.0); // momentum accumulator
            this.iter = 0;
        },

        // return pointer to current solution
        getSolution: function() {
            let yMat=[];
            for(let i=0;i<this.N;++i){
                yMat.push(new Array(this.dim).fill(0));
                for(let j=0;j<this.dim;++j){
                    yMat[i][j]=this.Y[i*this.dim+j];
                }
            }
            return yMat;
        },

        // perform a single step of optimization to improve the embedding
        step: function() {
            // if(this.iter%100===0){
            //     console.log("tsneStep ",this.iter,":",currentTime())
            // }

            const cost = this.costGrad();

            // perform gradient step
            var ymean = zeros(this.dim);
            for(let i=0;i<this.N;i++) {
                for(let d=0;d<this.dim;d++) {
                    const ind_id=i*this.dim+d;
                    const sid = this.ystep[ind_id];
                    const gainid = this.gains[ind_id];
                    // compute gain update
                    let newgain = sign(this.grad[ind_id]) === sign(sid) ? gainid * 0.8 : gainid + 0.2;
                    if(newgain < 0.01) newgain = 0.01; // clamp
                    this.gains[ind_id] = newgain; // store for next turn

                    // compute momentum step direction
                    const momval = (this.iter < this.iterationsEarlyExaggeration||(this.lateExaggeration>1&&(this.maxIter-this.iter)<this.iterationsLateExaggeration)) ? 0.5 : 0.8;
                    const newsid = momval * sid - this.epsilon * newgain * this.grad[ind_id];
                    this.ystep[ind_id] = newsid; // remember the step we took

                    // step!
                    this.Y[ind_id] += newsid;
                    ymean[d] += this.Y[ind_id]; // accumulate mean so that we can center later
                }
            }
            // reproject Y to be zero mean
            for(let i=0;i<this.N;i++) {
                for(let d=0;d<this.dim;d++) {
                    const ind_id=i*this.dim+d;
                    this.Y[ind_id] -= ymean[d]/this.N;
                }
            }

            //if(this.iter%100===0) console.log('iter ' + this.iter + ', cost: ' + cost);
            if(this.iter===300){
                this.minCost=cost;
            }else if(this.iter>300){
                if(cost<this.minCost){
                    this.minCost=cost;
                    this.itersWithoutProgress=0;
                }else{
                    this.itersWithoutProgress+=1;
                }
                if(this.iter%100===0){
                    if(this.itersWithoutProgress>100){
                        return Number.MAX_VALUE;
                    }
                }
            }
            this.iter += 1;
            // if(this.iter%100===0){
            //     console.log("tsneStep ",this.iter," Done:",currentTime())
            // }
            return cost; // return current cost
        },

        // return cost and gradient, given an arrangement
        costGrad: function() {

            // compute current Q distribution, unnormalized first
            let qsum = 0.0;
            for(let i=0;i<this.N;i++) {
                for(let j=i+1;j<this.N;j++) {
                    let dsum = 0.0;
                    for(let d=0;d<this.dim;d++) {
                        const dhere = this.Y[i*this.dim+d] - this.Y[j*this.dim+d];
                        dsum += dhere * dhere;
                    }
                    const qu = 1.0 / Math.pow(1.0 + this.df*dsum,this.alpha); // Student t-distribution
                    // const qu = 1.0 / (1.0 + dsum); // Student t-distribution
                    this.Qu[i*this.N+j] = qu;
                    this.Qu[j*this.N+i] = qu;
                    qsum += 2 * qu;
                }
            }
            // normalize Q distribution to sum to 1
            for(let q=0;q<this.NN;q++) {
                this.Q[q] = Math.max(this.Qu[q] / qsum, 1e-100);
            }
            let cost = 0.0;
            // var grad = [];
            let pmul=1;
            if(this.iter<this.iterationsEarlyExaggeration){
                pmul=this.earlyExaggeration;
            }else if((this.maxIter-this.iter)<this.iterationsLateExaggeration){
                pmul=this.lateExaggeration;
            }
            for(let i=0;i<this.N;i++) {
                for(let d=0;d<this.dim;d++) {
                    const ind_id=i*this.dim+d;
                    this.grad[ind_id]=0;
                }
                for(let j=0;j<this.N;j++) {
                    const ind = i*this.N+j;
                    cost += - this.P[ind] * Math.log(this.Q[ind]); // accumulate cost (the non-constant portion at least...)
                    var premult = 4 * (pmul * this.P[ind] - this.Q[ind]) * Math.pow(this.Qu[ind],this.df);
                    for(let d=0;d<this.dim;d++) {
                        const ind_id=i*this.dim+d;
                        this.grad[ind_id] += premult * (this.Y[ind_id] - this.Y[j*this.dim+d]);
                    }
                }
            }
            // console.log(grad)
            return cost;
        },
        cleanup: function(){
            this.Y.length=0;
            this.grad.length=0;
            this.P=null;
            this.Q=null;
            this.Qu=null;
        }
    };
    global.tSNE = tSNE; // export tSNE class
})(tsnejs);


// export the library to window, or to module in nodejs
(function(lib) {
    "use strict";
    if (typeof module === "undefined" || typeof module.exports === "undefined") {
        window.tsnejs = lib; // in ordinary browser attach library to window
    } else {
        module.exports = lib; // in nodejs
    }
})(tsnejs);
