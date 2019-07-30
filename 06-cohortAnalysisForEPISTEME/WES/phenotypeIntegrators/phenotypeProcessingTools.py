from itertools import product
from scipy.stats import rankdata, ks_2samp, fisher_exact
from scipy.stats.distributions import chi2
from scipy.stats.distributions import t as tDist
from numpy import array, percentile, mean, log2, asarray, concatenate, insert, cumsum, isscalar, atleast_1d, ravel, errstate, divide, concatenate
from numpy import sum as npsum
from numpy import var as npvar
from numpy import sqrt as npsqrt
from numpy import abs as npabs
from numpy import mean as npmean
from collections import namedtuple
from numpy.random import shuffle
from jenkspy import jenks_breaks
from sys import stderr

KruskalResult = namedtuple('KruskalResult', ('statistic', 'pvalue'))
Ttest_indResult = namedtuple('Ttest_indResult', ('statistic', 'pvalue'))

def _chk_asarray(a, axis):
    if axis is None:
        a = ravel(a)
        outaxis = 0
    else:
        a = asarray(a)
        outaxis = axis

    if a.ndim == 0:
        a = atleast_1d(a)
    return a, outaxis

def _chk2_asarray(a, b, axis):
    if axis is None:
        a = ravel(a)
        b = ravel(b)
        outaxis = 0
    else:
        a = asarray(a)
        b = asarray(b)
        outaxis = axis

    if a.ndim == 0:
        a = atleast_1d(a)
    if b.ndim == 0:
        b = atleast_1d(b)
    return a, b, outaxis

def _square_of_sums(a, axis=0):
    a, axis = _chk_asarray(a, axis)
    s = npsum(a, axis)
    if not isscalar(s):
        return s.astype(float) * s
    else:
        return float(s) * s

def customKw(*args):
    args = list(map(asarray, args))
    num_groups = len(args)
    n = asarray(list(map(len, args)))
    alldata = concatenate(args)
    ranked = rankdata(alldata)
    ties = 1
    j = insert(cumsum(n), 0, 0)
    ssbn = 0
    for i in range(num_groups):
        ssbn += _square_of_sums(ranked[j[i]:j[i + 1]]) / n[i]

    totaln = npsum(n)
    h = 12.0 / (totaln * (totaln + 1)) * ssbn - 3 * (totaln + 1)
    h /= ties
    return KruskalResult(h, chi2.sf(h, 1))

def _ttest_ind_from_stats(mean1, mean2, denom, df):
    d = mean1 - mean2
    with errstate(divide='ignore', invalid='ignore'):
        t = divide(d, denom)
    t, prob = _ttest_finish(df, t)
    return t, prob

def _ttest_finish(df, t):
    prob = tDist.sf(npabs(t), df) * 2
    if t.ndim == 0:
        t = t[()]
    return t, prob

def _unequal_var_ttest_denom(v1, n1, v2, n2):
    vn1 = v1 / n1
    vn2 = v2 / n2
    if n1>1 and n2>1:
        df = (vn1 + vn2) ** 2 / (vn1 ** 2 / (n1 - 1) + vn2 ** 2 / (n2 - 1))
    elif n1>1:
        df = (vn1 + vn2) ** 2 / (vn1 ** 2 / (n1 - 1) + vn1 ** 2 / (n1 - 1))
    elif n2>1:
        df = (vn2 + vn2) ** 2 / (vn2 ** 2 / (n2 - 1) + vn1 ** 2 / (n1 - 1))
    else:
        raise ValueError
    denom = npsqrt(vn1 + vn2)
    return df, denom

def _equal_var_ttest_denom(v1, n1, v2, n2):
    df = n1 + n2 - 2.0
    if n1 > 1 and n2 > 1:
        svar = ((n1 - 1) * v1 + (n2 - 1) * v2) / df
        denom = npsqrt(svar * (1.0 / n1 + 1.0 / n2))
    elif n1 > 1:
        svar = ((n1 - 1) * v1) / df
        denom = npsqrt(svar * (1.0 / n1))
    elif n2 > 1:
        svar = ((n2 - 1) * v2) / df
        denom = npsqrt(svar * (1.0 / n2))
    else:
        raise ValueError
    return df, denom

def customTtest(a,b,equal_var):
    a, b, _ = _chk2_asarray(a, b, 0)
    n1 = a.shape[0]
    n2 = b.shape[0]
    if n1==n2 and n1==1:
        raise ValueError
    if n1>1:
        v1 = npvar(a, 0, ddof=1)
    else:
        anew = concatenate((a, a))
        return customTtest(anew,b, equal_var)
        # v1 = npvar(b, 0, ddof=1)
    if n2>1:
        v2 = npvar(b, 0, ddof=1)
    else:
        bnew = concatenate((b, b))
        return customTtest(a, bnew, equal_var)
        # v2 = npvar(a, 0, ddof=1)
    if equal_var:
        df, denom = _equal_var_ttest_denom(v1, n1, v2, n2)
    else:
        df, denom = _unequal_var_ttest_denom(v1, n1, v2, n2)
    res = _ttest_ind_from_stats(npmean(a, 0), npmean(b, 0), denom, df)
    return Ttest_indResult(*res)

def generateComparisonFrames():
    # always: valid, toIgnore
    comparisonModuleTypes=dict()
    _comparisonFrames = dict()
    
    upstreamTypes = ["upstream SNV", "upstream insertion", "upstream deletion"]
    for comparisonName in list(_comparisonFrames.keys()):
        comparisonNameUpstream = comparisonName + ".Upstream"
        _comparisonFrames[comparisonNameUpstream] = [_comparisonFrames[comparisonName][0] + upstreamTypes,
                                                    _comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["Upstream"]=upstreamTypes
    _comparisonFrames["Upstream"] = [upstreamTypes, []]
    downstreamTypes = ["downstream SNV", "downstream insertion", "downstream deletion"]

    for comparisonName in list(_comparisonFrames.keys()):
        comparisonNameDownstream = comparisonName + ".Downstream"
        _comparisonFrames[comparisonNameDownstream] = [_comparisonFrames[comparisonName][0] + downstreamTypes,
                                                      _comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["Downstream"]=downstreamTypes
    _comparisonFrames["Downstream"] = [downstreamTypes, []]
    UTR5Types = ["UTR5 deletion", "UTR5 insertion", "UTR5 SNV"]

    for comparisonName in list(_comparisonFrames.keys()):
        comparisonNameUTR5 = comparisonName + ".UTR5"
        _comparisonFrames[comparisonNameUTR5] = [_comparisonFrames[comparisonName][0] + UTR5Types,
                                                _comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["UTR5"]=UTR5Types
    _comparisonFrames["UTR5"] = [UTR5Types, []]
    UTR3Types = ["UTR3 deletion", "UTR3 insertion", "UTR3 SNV"]
    for comparisonName in list(_comparisonFrames.keys()):
        comparisonNameUTR3 = comparisonName + ".UTR3"
        _comparisonFrames[comparisonNameUTR3] = [_comparisonFrames[comparisonName][0] + UTR3Types,
                                                _comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["UTR3"] = UTR3Types
    _comparisonFrames["UTR3"] = [UTR3Types, []]
    for comparisonName in list(_comparisonFrames.keys()):
        comparisonNameAmp= comparisonName + ".Amp"
        comparisonNameHomdel = comparisonName + ".Homdel"
        _comparisonFrames[comparisonNameAmp] = [_comparisonFrames[comparisonName][0] + ["ampgain"] ,
                                               _comparisonFrames[comparisonName][1]]
        _comparisonFrames[comparisonNameHomdel] = [_comparisonFrames[comparisonName][0] + ["homoloss"] ,
                                                  _comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["Amp"] = ["ampgain"]
    _comparisonFrames["Amp"] = [["ampgain"], []]
    comparisonModuleTypes["Homdel"] = ["homoloss"]
    _comparisonFrames["Homdel"] = [["homoloss"], []]
    comparisonModuleTypes["CnvLoss"] = ["loss"]
    _comparisonFrames["CnvLoss"] = [["loss"], []]
    _comparisonFrames["CnvLoss.Homdel"] = [["loss","homoloss"], []]
    comparisonModuleTypes["CnvGain"] = ["gain"]
    _comparisonFrames["CnvGain"] = [["gain"], []]
    _comparisonFrames["CnvGain.Amp"] = [["gain","ampgain"], []]
    _comparisonFrames["Synonymous"] = [["synonymous SNV"], []]
    splicingTypes=["splicing SNV","splicing insertion","splicing deletion"]
    comparisonModuleTypes["Synonymous"] = ["synonymous SNV"]
    comparisonModuleTypes["Splicing"] = splicingTypes
    _comparisonFrames["Synonymous.Splicing"] = [["synonymous SNV"]+splicingTypes, []]
    functionalSnvTypes = [x + "SNV" for x in ["nonsynonymous ", "stopgain ", "stoploss ", "splicing "]]
    functionalIndelTypes = [x[0] + x[1] for x in
                            product(["frameshift ", "nonframeshift ", "splicing ", "stopgain ", "stoploss "],
                                    ["insertion", "deletion"])]
    functionalSmallVarTypes = functionalSnvTypes + functionalIndelTypes
    comparisonModuleTypes["FunctionalSmallVar"] = functionalSmallVarTypes
    _comparisonFrames["FunctionalSmallVar"] = [functionalSmallVarTypes, []]
    _comparisonFrames["FunctionalSmallVar.Synonymous"] = [functionalSmallVarTypes + ["synonymous SNV"], []]
    comparisonFramesFinal=dict()
    comparisonModuleTypesFinal=dict()
    for key,value in _comparisonFrames.items():
        comparisonFramesFinal[key]=[set(value[0]),set(value[1])]
    for key, value in comparisonModuleTypes.items():
        comparisonModuleTypesFinal[key] = set(value)
    return comparisonFramesFinal,comparisonModuleTypesFinal

comparisonFrames,comparisonModuleNames=generateComparisonFrames()
print("running",len(comparisonFrames),"comparisons",file=stderr)

helper=dict()
helper["Sv"]="svTadOffset"
helper["OffIndel"]="indelTadOffset"

def processGeneBatch(batch,pidTranslator,testMethod):
    results=[]
    for item in batch:
        results.append(processGene(item[0], item[1], item[2], pidTranslator,testMethod))
    return results
def processGene(gene,expressions,variants,pidTranslator,testMethod):
    currentResults=GeneProcessor(expressions,variants,pidTranslator,testMethod,gene)
    if len(currentResults.geneBuffer) > 0:
        currentResults.geneBuffer["gene"] = gene
    return currentResults.geneBuffer

class GeneProcessor:
    def __init__(self,expressions,variants,pidTranslator,testMethod,gene):
        self.gene=gene
        self.previousTestResults = dict()
        self.previousComparisonResults = dict()
        self.testMethod = testMethod
        if self.testMethod=="jf":
            #, gene in {"ENSG00000077327","ENSG00000133392","ENSG00000130675"}
            # self.geneBuffer = GeneProcessor.processGeneJf(expressions, variants)
            self.geneBuffer = self.processGeneJf(expressions, variants)
        else:
            self.geneBuffer=self.processGene(expressions,variants,pidTranslator)

    # @staticmethod
    def processGeneJf(self,expressions, variants):
        pureExpressions=sorted([log2(expressions[i]) for i in expressions])
        geneBuffer = dict()
        expressionBreaks=[2**x for x in jenks_breaks(pureExpressions,nb_class=2)]

        if expressionBreaks[1]!=expressionBreaks[0]:
            lowExpressions1 = {i: expressions[i] for i in expressions if expressions[i] < expressionBreaks[1]}
            lowExpressionsPure1 = [lowExpressions1[x] for x in lowExpressions1]
            highExpressions1 = {i: expressions[i] for i in expressions if expressions[i] >= expressionBreaks[1]}
            highExpressionsPure1 = [highExpressions1[x] for x in highExpressions1]

            lowExpressions2 = {i: expressions[i] for i in expressions if expressions[i] <= expressionBreaks[1]}
            lowExpressionsPure2 = [lowExpressions2[x] for x in lowExpressions2]
            highExpressions2 = {i: expressions[i] for i in expressions if expressions[i] > expressionBreaks[1]}
            highExpressionsPure2 = [highExpressions2[x] for x in highExpressions2]
            alternativeSolutions = [[lowExpressions1,lowExpressionsPure1,highExpressions1,highExpressionsPure1],[lowExpressions2,lowExpressionsPure2,highExpressions2,highExpressionsPure2]]
        else:
            lowExpressions1 = {i: expressions[i] for i in expressions if expressions[i] <= expressionBreaks[1]}
            lowExpressionsPure1 = [lowExpressions1[x] for x in lowExpressions1]
            highExpressions1 = {i: expressions[i] for i in expressions if expressions[i] > expressionBreaks[1]}
            highExpressionsPure1 = [highExpressions1[x] for x in highExpressions1]
            alternativeSolutions = [[lowExpressions1, lowExpressionsPure1, highExpressions1, highExpressionsPure1]]
        varKeys = set(variants.keys())
        for comparison in comparisonFrames:
            if not GeneProcessor.checkComparisonValidity(comparison, varKeys):
                continue
            validVariantTypes = comparisonFrames[comparison][0]
            selectedIndices = set().union(*[x for i, x in variants.items() if i in validVariantTypes])
            selectedIndicesFinal = {i for i in selectedIndices if i in expressions}

            # if self.gene=="ENSG00000147889":
            #     print(comparison,file=stderr)
            #     print(expressionBreaks,file=stderr)
            #     print(lowExpressionsPure,file=stderr)
            #     print(highExpressionsPure,file=stderr)
            #     print([[len(selectedIndicesLow),
            #             len(selectedIndicesHigh)],
            #            [len(lowExpressions) - len(selectedIndicesLow),
            #             len(highExpressions) - len(selectedIndicesHigh)]],file=stderr)
            pVals=[]
            for lowExpressions, lowExpressionsPure, highExpressions, highExpressionsPure in alternativeSolutions:
                selectedIndicesHigh = [donorIndex for donorIndex in highExpressions if donorIndex in selectedIndicesFinal]
                selectedIndicesLow = [donorIndex for donorIndex in lowExpressions if donorIndex in selectedIndicesFinal]
                pVal = fisher_exact([[len(selectedIndicesLow),
                                      len(selectedIndicesHigh)],
                                     [len(lowExpressions) - len(selectedIndicesLow),
                                      len(highExpressions) - len(selectedIndicesHigh)]])[1]
                pVals.append(pVal)
            if len(alternativeSolutions)==1 or pVals[0]<pVals[1]:
                lowExpressions, lowExpressionsPure, highExpressions, highExpressionsPure=alternativeSolutions[0]
                pVal=pVals[0]
                selectedIndicesHigh = [donorIndex for donorIndex in highExpressions if donorIndex in selectedIndicesFinal]
                selectedIndicesLow = [donorIndex for donorIndex in lowExpressions if donorIndex in selectedIndicesFinal]
            else:
                lowExpressions, lowExpressionsPure, highExpressions, highExpressionsPure = alternativeSolutions[1]
                pVal = pVals[1]
                selectedIndicesHigh = [donorIndex for donorIndex in highExpressions if donorIndex in selectedIndicesFinal]
                selectedIndicesLow = [donorIndex for donorIndex in lowExpressions if donorIndex in selectedIndicesFinal]
            if len(lowExpressionsPure)>0 and len(highExpressionsPure)>0:
                if len(selectedIndicesLow) > len(selectedIndicesHigh):
                    res=[pVal,
                         GeneProcessor.log2FC(GeneProcessor.computeTrimean(lowExpressionsPure),
                                              GeneProcessor.computeTrimean(highExpressionsPure)),
                         GeneProcessor.log2FC(mean(lowExpressionsPure),
                                              mean(highExpressionsPure)),
                         len(lowExpressionsPure),
                         len(highExpressionsPure),
                         0]
                else:
                    res = [pVal,
                           GeneProcessor.log2FC(GeneProcessor.computeTrimean(highExpressionsPure),
                                                GeneProcessor.computeTrimean(lowExpressionsPure)),
                           GeneProcessor.log2FC(mean(highExpressionsPure),
                                                mean(lowExpressionsPure)),
                           len(highExpressionsPure),
                           len(lowExpressionsPure),
                           0]
                rowEntry = tuple(res)
                if rowEntry not in geneBuffer:
                    geneBuffer[rowEntry] = []
                geneBuffer[rowEntry].append(comparison)
        return geneBuffer

    def processGene(self, expressions, variants, pidTranslator):
        geneBuffer = dict()
        blacklistedComparisons = set()
        varKeys = set(variants.keys())
        for comparison in comparisonFrames:
            if not GeneProcessor.checkComparisonValidity(comparison, varKeys):
                blacklistedComparisons.add(comparison)
        for comparison in comparisonFrames:
            if comparison in blacklistedComparisons:
                continue
            validVariantTypes = comparisonFrames[comparison][0]
            selectedIndices = set().union(*[x for i, x in variants.items() if i in validVariantTypes])
            selectedIndicesFinal = {i for i in selectedIndices if i in expressions}

            if len(selectedIndicesFinal) == 0:
                continue
            invertedIndicesFinal = {i for i in pidTranslator if (i not in selectedIndices) and i in expressions}
            if len(invertedIndicesFinal) == 0:
                continue
            selectedExpressions = [[expressions[i], i] for i in selectedIndicesFinal]
            invertedExpressions = [[expressions[i], i] for i in invertedIndicesFinal]
            selectedExpressions.sort(key=lambda x: x[0])
            invertedExpressions.sort(key=lambda x: x[0])
            resTmp = self.processComparison(selectedExpressions, invertedExpressions, comparison, variants)
            if not resTmp:
                continue
            res = resTmp
            rowEntry = tuple(res)
            if rowEntry not in geneBuffer:
                geneBuffer[rowEntry] = []
            geneBuffer[rowEntry].append(comparison)
        return geneBuffer

    def processComparison(self,selectedExpressionsInit,invertedExpressionsInit,targetedComparison,variants):
        initResult=self.computeTest(selectedExpressionsInit,invertedExpressionsInit)
        selectedExpressionsInitPure = array([x[0] for x in selectedExpressionsInit])
        invertedExpressionsInitPure = array([x[0] for x in invertedExpressionsInit])
        initTrimeanDiff=GeneProcessor.log2FC(GeneProcessor.computeTrimean(selectedExpressionsInitPure),
                                             GeneProcessor.computeTrimean(invertedExpressionsInitPure))
        if len(selectedExpressionsInitPure)<3 or \
                initTrimeanDiff==0 or \
                len(selectedExpressionsInitPure)/(len(selectedExpressionsInitPure)+len(invertedExpressionsInitPure))>0.8 \
                or self.testMethod=="ttest":
            return [initResult,
                    initTrimeanDiff,
                    GeneProcessor.log2FC(mean(selectedExpressionsInitPure),
                                         mean(invertedExpressionsInitPure)),
                    len([x[0] for x in selectedExpressionsInit]),
                    len([x[0] for x in invertedExpressionsInit]),
                    0]
        samplesKickedOut = 0
        selectedExpressionsTmp = selectedExpressionsInit.copy()
        invertedExpressionsTmp = invertedExpressionsInit.copy()
        bestPval=initResult
        bestSelectedExpressions = selectedExpressionsInit.copy()
        bestInvertedExpressions = invertedExpressionsInit.copy()
        initTrimeanDiffPos = initTrimeanDiff >0
        bestVariants=variants.copy()
        while len(selectedExpressionsInit) >= 4 * samplesKickedOut:
            selectedExpressionsTmp.sort(key=lambda x: x[0])
            invertedExpressionsTmp.sort(key=lambda x: x[0])
            if initTrimeanDiffPos:
                element = selectedExpressionsTmp.pop(0)
            else:
                element = selectedExpressionsTmp.pop()
            invertedExpressionsTmp.append(element)
            kickedOutDonorId = element[1]
            bestVariants = GeneProcessor.slimDownVariants(variants,kickedOutDonorId)
            if variants!=bestVariants:
                if not GeneProcessor.checkComparisonValidity(targetedComparison,set(bestVariants.keys())):
                    break
            key = (tuple(sorted([x[1] for x in selectedExpressionsTmp])),
                   tuple(sorted([x[1] for x in invertedExpressionsTmp])))
            if key in self.previousTestResults:
                tmpResult = self.previousTestResults[key]
            else:
                tmpResult = self.computeTest(selectedExpressionsTmp,invertedExpressionsTmp)
                self.previousTestResults[key]=tmpResult
            if tmpResult < bestPval:
                bestSelectedExpressions=selectedExpressionsTmp.copy()
                bestInvertedExpressions=invertedExpressionsTmp.copy()
                bestPval = tmpResult
            else:
                break
            samplesKickedOut += 1
        bestSelectedExpressionsPure=array([x[0] for x in bestSelectedExpressions])
        bestInvertedExpressionsPure=array([x[0] for x in bestInvertedExpressions])
        return [bestPval,
                GeneProcessor.log2FC(GeneProcessor.computeTrimean(bestSelectedExpressionsPure),
                                     GeneProcessor.computeTrimean(bestInvertedExpressionsPure)),
                GeneProcessor.log2FC(mean(bestSelectedExpressionsPure),
                                     mean(bestInvertedExpressionsPure)),
                len(bestSelectedExpressions),
                len(bestInvertedExpressions),
                samplesKickedOut]

    @staticmethod
    def slimDownVariants(variants, patientToKickOut):
        variantsSlim = dict()
        for key, value in variants.items():
            if value != {patientToKickOut}:
                variantsSlim[key] = value - {patientToKickOut}
        return variantsSlim

    @staticmethod
    def checkComparisonValidity(comparison, varKeys):
        comparisonSubmodules = comparison.split('.')
        for comparisonSubmodule in comparisonSubmodules:
            for varClass in ("Sv", "OffIndel"):
                if varClass in comparisonSubmodule:
                    for offset in range(4):
                        offsetStr = str(offset)
                        comparisonSubmoduleRoot, comparisonSubmoduleVarKeyRoot = varClass, helper[varClass]
                        if comparisonSubmodule == comparisonSubmoduleRoot + offsetStr:
                            if comparisonSubmoduleVarKeyRoot + offsetStr not in varKeys:
                                return False
                            anyMatch = False
                            for i in range(0, offset + 1):
                                if comparisonSubmoduleVarKeyRoot + str(i) in varKeys:
                                    anyMatch = True
                                    break
                            if not anyMatch:
                                return False
            expectedVariants = comparisonModuleNames[comparisonSubmodule]
            if len(set.intersection(varKeys, expectedVariants)) == 0:
                return False
        return True


    def computeTest(self,selectedExpressions,invertedExpressions):
        selectedExpressionValues=array([x[0] for x in selectedExpressions])
        tiedBlocksSelected=[0]
        currentHighestSelected=0
        for i in range(1,len(selectedExpressionValues)):
            if selectedExpressionValues[i]==selectedExpressionValues[i-1]:
                currentHighestSelected+=1
            else:
                tiedBlocksSelected.append(currentHighestSelected)
                currentHighestSelected=0
        invertedExpressionValues=array([x[0] for x in invertedExpressions])
        tiedBlocksInverted=[0]
        currentHighestInverted = 0
        for i in range(1,len(invertedExpressionValues)):
            if invertedExpressionValues[i]==invertedExpressionValues[i-1]:
                currentHighestInverted+=1
            else:
                tiedBlocksInverted.append(currentHighestInverted)
                currentHighestInverted=0
        if self.testMethod=="kw":
            permutations=0
            maxIter=100
            kwresults=[]
            while permutations < min(maxIter, max(1, max(max(tiedBlocksSelected),max(tiedBlocksInverted)) * 2)):
                shuffle(selectedExpressionValues)
                shuffle(invertedExpressionValues)
                res = customKw(selectedExpressionValues,invertedExpressionValues)[1]
                if res > 0.5:
                    return res
                kwresults.append(res)
                permutations+=1
            return max(kwresults)
        elif self.testMethod=="ttest":
            selectedExpressionValuesLog2=array([log2(x) for x in selectedExpressionValues])
            invertedExpressionValuesLog2=array([log2(x) for x in invertedExpressionValues])
            return customTtest(selectedExpressionValuesLog2, invertedExpressionValuesLog2,True)[1]
        elif self.testMethod == "ks":
            return ks_2samp(selectedExpressionValues, invertedExpressionValues)[1]
    @staticmethod
    def computeTrimean(arrIn):
        percentiles=percentile(arrIn,[25,50,75])
        return (percentiles[0]+2*percentiles[1]+percentiles[2])/4
    @staticmethod
    def log2FC(x,y):
        return log2(x)-log2(y)
