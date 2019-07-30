from itertools import product
from scipy.stats import kruskal
from numpy import array, percentile, mean, log2, log10,seterr
seterr(all='raise')
from sys import stderr
import time



def generateComparisonFrames():
    # always: valid, toIgnore
    comparisonModuleTypes=dict()
    comparisonFrames = dict()
    for pair in product(range(4), range(4)):
        xMax, yMax = pair
        svContribution="Sv" + str(xMax)
        offIndelContribution="OffIndel" + str(yMax)
        comparisonName = svContribution +"."+ offIndelContribution
        comparisonFrames[comparisonName] = [sum([["svTadOffset" + str(x) for x in range(xMax+1)] +
                                                 ["indelTadOffset" + str(y) for y in range(yMax+1)]], []), []]
    for xMax in range(4):
        svComparisonName = "Sv" + str(xMax)
        comparisonModuleTypes[svComparisonName ]=["svTadOffset" + str(x) for x in range(xMax+1)]
        comparisonFrames[svComparisonName ] = [["svTadOffset" + str(x) for x in range(xMax+1)], []]
        offIndelComparisonName = "OffIndel" + str(xMax)
        comparisonModuleTypes[offIndelComparisonName] = ["indelTadOffset" + str(x) for x in range(xMax+1)]
        comparisonFrames[offIndelComparisonName] = [["indelTadOffset" + str(x) for x in range(xMax+1)], []]

    upstreamTypes = ["upstream SNV", "upstream insertion", "upstream deletion"]
    for comparisonName in list(comparisonFrames.keys()):
        comparisonNameUpstream = comparisonName + ".Upstream"
        comparisonFrames[comparisonNameUpstream] = [comparisonFrames[comparisonName][0] + upstreamTypes,
                                                    comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["Upstream"]=upstreamTypes
    comparisonFrames["Upstream"] = [upstreamTypes, []]
    downstreamTypes = ["downstream SNV", "downstream insertion", "downstream deletion"]

    for comparisonName in list(comparisonFrames.keys()):
        comparisonNameDownstream = comparisonName + ".Downstream"
        comparisonFrames[comparisonNameDownstream] = [comparisonFrames[comparisonName][0] + downstreamTypes,
                                                      comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["Downstream"]=downstreamTypes
    comparisonFrames["Downstream"] = [downstreamTypes, []]
    UTR5Types = ["UTR5 deletion", "UTR5 insertion", "UTR5 SNV"]

    for comparisonName in list(comparisonFrames.keys()):
        comparisonNameUTR5 = comparisonName + ".UTR5"
        comparisonFrames[comparisonNameUTR5] = [comparisonFrames[comparisonName][0] + UTR5Types,
                                                comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["UTR5"]=UTR5Types
    comparisonFrames["UTR5"] = [UTR5Types, []]
    UTR3Types = ["UTR3 deletion", "UTR3 insertion", "UTR3 SNV"]
    for comparisonName in list(comparisonFrames.keys()):
        comparisonNameUTR3 = comparisonName + ".UTR3"
        comparisonFrames[comparisonNameUTR3] = [comparisonFrames[comparisonName][0] + UTR3Types,
                                                comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["UTR3"] = UTR3Types
    comparisonFrames["UTR3"] = [UTR3Types, []]
    for comparisonName in list(comparisonFrames.keys()):
        comparisonNameAmp= comparisonName + ".Amp"
        comparisonNameHomdel = comparisonName + ".Homdel"
        comparisonFrames[comparisonNameAmp] = [comparisonFrames[comparisonName][0] + ["ampgain"] ,
                                               comparisonFrames[comparisonName][1]]
        comparisonFrames[comparisonNameHomdel] = [comparisonFrames[comparisonName][0] + ["homoloss"] ,
                                                  comparisonFrames[comparisonName][1]]
    comparisonModuleTypes["Amp"] = ["ampgain"]
    comparisonFrames["Amp"] = [["ampgain"], []]
    comparisonModuleTypes["Homdel"] = ["homoloss"]
    comparisonFrames["Homdel"] = [["homoloss"], []]
    comparisonModuleTypes["CnvLoss"] = ["loss"]
    comparisonFrames["CnvLoss"] = [["loss"], []]
    comparisonFrames["CnvLoss.Homdel"] = [["loss","homoloss"], []]
    comparisonModuleTypes["CnvGain"] = ["gain"]
    comparisonFrames["CnvGain"] = [["gain"], []]
    comparisonFrames["CnvGain.Amp"] = [["gain","ampgain"], []]
    comparisonFrames["Synonymous"] = [["synonymous SNV"], []]
    splicingTypes=["splicing SNV","splicing insertion","splicing deletion"]
    comparisonModuleTypes["Synonymous"] = ["synonymous SNV"]
    comparisonModuleTypes["Splicing"] = splicingTypes
    comparisonFrames["Synonymous.Splicing"] = [["synonymous SNV"]+splicingTypes, []]
    functionalSnvTypes = [x + "SNV" for x in ["nonsynonymous ", "stopgain ", "stoploss ", "splicing "]]
    functionalIndelTypes = [x[0] + x[1] for x in
                            product(["frameshift ", "nonframeshift ", "splicing ", "stopgain ", "stoploss "],
                                    ["insertion", "deletion"])]
    functionalSmallVarTypes = functionalSnvTypes + functionalIndelTypes
    comparisonModuleTypes["FunctionalSmallVar"] = functionalSmallVarTypes
    comparisonFrames["FunctionalSmallVar"] = [functionalSmallVarTypes, []]
    comparisonFrames["FunctionalSmallVar.Synonymous"] = [functionalSmallVarTypes + ["synonymous SNV"], []]
    comparisonModuleTypes["DirectSv"] = ["directSV"]
    comparisonFrames["DirectSv"] = [["directSV"], []]
    comparisonFrames["FunctionalSmallVar.DirectSv"] = [functionalSmallVarTypes + ["directSV"], []]
    comparisonFramesFinal=dict()
    comparisonModuleTypesFinal=dict()
    for key,value in comparisonFrames.items():
        comparisonFramesFinal[key]=[set(value[0]),set(value[1])]
    for key, value in comparisonModuleTypes.items():
        comparisonModuleTypesFinal[key] = set(value)
    return comparisonFramesFinal,comparisonModuleTypesFinal
comparisonFrames,comparisonModuleNames=generateComparisonFrames()
print("running",len(comparisonFrames),"comparisons",file=stderr)

helper=dict()
helper["Sv"]="svTadOffset"
helper["OffIndel"]="indelTadOffset"

class GeneProcessor:
    def __init__(self,numExpectedGenes,expressionMode,comparisonTypes):
        self.comparisonVocab = dict()
        with open(comparisonTypes) as f:
            next(f)
            for line in f:
                lineChunks = line.rstrip().split('\t')
                self.comparisonVocab[lineChunks[1]] = int(lineChunks[0])
        self.previousKwResults = dict()
        self.previousComparisonResults = dict()
        self.numExpectedGenes=numExpectedGenes
        self.numProcessedGenes=0
        self.numProcessedGenesBatch=0
        self.startTime = time.time()
        self.latestTime = time.time()
        self.timingSteps=list(reversed([x/100 for x in range(0,100,5)[1:]]))
        outputHeader = [expressionMode, "comparison", "pValLog10", "log2FcTrimean", "log2FcMean", "numSelected", "numInverted", "numSwitched"]
        for i in range(len(self.comparisonVocab)):
            for x in self.comparisonVocab:
                if self.comparisonVocab[x]==i:
                    outputHeader.append(x)
                    break
        print(*outputHeader,sep='\t')

    @staticmethod
    def comparisonRank(comp1, comp2):
        comp1Chunks = set(comp1.split('.'))
        comp2Chunks = set(comp2.split('.'))
        comp1SvRank = -1
        if "Sv0" in comp1Chunks:
            comp1SvRank = 0
        elif "Sv1" in comp1Chunks:
            comp1SvRank = 1
        elif "Sv2" in comp1Chunks:
            comp1SvRank = 2
        elif "Sv3" in comp1Chunks:
            comp1SvRank = 3
        comp2SvRank = -1
        if "Sv0" in comp2Chunks:
            comp2SvRank = 0
        elif "Sv1" in comp2Chunks:
            comp2SvRank = 1
        elif "Sv2" in comp2Chunks:
            comp2SvRank = 2
        elif "Sv3" in comp2Chunks:
            comp2SvRank = 3
        comp1OffIndelRank = -1
        if "OffIndel0" in comp1Chunks:
            comp1OffIndelRank = 0
        elif "OffIndel1" in comp1Chunks:
            comp1OffIndelRank = 1
        elif "OffIndel2" in comp1Chunks:
            comp1OffIndelRank = 2
        elif "OffIndel3" in comp1Chunks:
            comp1OffIndelRank = 3
        comp2OffIndelRank = -1
        if "OffIndel0" in comp2Chunks:
            comp2OffIndelRank = 0
        elif "OffIndel1" in comp2Chunks:
            comp2OffIndelRank = 1
        elif "OffIndel2" in comp2Chunks:
            comp2OffIndelRank = 2
        elif "OffIndel3" in comp2Chunks:
            comp2OffIndelRank = 3
        comp1SimpleChunks = {x for x in comp1Chunks if (not x.startswith("Sv")) and (not x.startswith("OffIndel"))}
        comp2SimpleChunks = {x for x in comp2Chunks if (not x.startswith("Sv")) and (not x.startswith("OffIndel"))}
        a = comp1SvRank
        b = comp2SvRank
        c = comp1OffIndelRank
        d = comp2OffIndelRank
        if a == -1 and b == -1 and c == -1 and d == -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                return comp1
            elif comp1SimpleChunks < comp2SimpleChunks:
                return comp1
            elif comp2SimpleChunks < comp1SimpleChunks:
                return comp2
            return False
        elif a == -1 and b == -1 and c == -1 and d != -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                return comp1
            elif comp1SimpleChunks < comp2SimpleChunks:
                return comp1
            elif comp2SimpleChunks < comp1SimpleChunks:
                return False
            return False
        elif a == -1 and b == -1 and c != -1 and d == -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                return comp2
            elif comp1SimpleChunks < comp2SimpleChunks:
                return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                return comp2
            return False
        elif a == -1 and b == -1 and c != -1 and d != -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                if c <= d:
                    return comp1
                elif d <= c:
                    return comp2
                else:
                    return False
            elif comp1SimpleChunks < comp2SimpleChunks:
                if c <= d:
                    return comp1
                else:
                    return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                if d <= c:
                    return comp2
                else:
                    return False
            return False
        elif a == -1 and b != -1 and c == -1 and d == -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                return comp1
            elif comp1SimpleChunks < comp2SimpleChunks:
                return comp1
            elif comp2SimpleChunks < comp1SimpleChunks:
                return False
            return False
        elif a == -1 and b != -1 and c == -1 and d != -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                return comp1
            elif comp1SimpleChunks < comp2SimpleChunks:
                return comp1
            elif comp2SimpleChunks < comp1SimpleChunks:
                return False
            return False
        elif a == -1 and b != -1 and c != -1 and d == -1:
            return False
        elif a == -1 and b != -1 and c != -1 and d != -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                if c <= d:
                    return comp1
                else:
                    return False
            elif comp1SimpleChunks < comp2SimpleChunks:
                if c <= d:
                    return comp1
                else:
                    return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                return False
            return False
        elif a != -1 and b == -1 and c == -1 and d == -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                return comp2
            elif comp1SimpleChunks < comp2SimpleChunks:
                return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                return comp2
            return False
        elif a != -1 and b == -1 and c == -1 and d != -1:
            return False
        elif a != -1 and b == -1 and c != -1 and d == -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                return comp2
            elif comp1SimpleChunks < comp2SimpleChunks:
                return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                return comp2
            return False
        elif a != -1 and b == -1 and c != -1 and d != -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                if d <= c:
                    return comp2
                else:
                    return False
            elif comp1SimpleChunks < comp2SimpleChunks:
                return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                if d <= c:
                    return comp2
                else:
                    return False
            return False
        elif a != -1 and b != -1 and c == -1 and d == -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                if a <= b:
                    return comp1
                else:
                    return comp2
            elif comp1SimpleChunks < comp2SimpleChunks:
                if a <= b:
                    return comp1
                else:
                    return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                if b <= a:
                    return comp2
                else:
                    return False
            return False
        elif a != -1 and b != -1 and c == -1 and d != -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                if a <= b:
                    return comp1
                else:
                    return False
            elif comp1SimpleChunks < comp2SimpleChunks:
                if a <= b:
                    return comp1
                else:
                    return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                return False
            return False
        elif a != -1 and b != -1 and c != -1 and d == -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                if b <= a:
                    return comp2
                else:
                    return False
            elif comp1SimpleChunks < comp2SimpleChunks:
                return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                if b <= a:
                    return comp2
                else:
                    return False
            return False
        elif a != -1 and b != -1 and c != -1 and d != -1:
            if comp1SimpleChunks == comp2SimpleChunks:
                if a <= b and c <= d:
                    return comp1
                elif b <= a and d <= c:
                    return comp2
                else:
                    return False
            elif comp1SimpleChunks < comp2SimpleChunks:
                if a <= b and c <= d:
                    return comp1
                else:
                    return False
            elif comp2SimpleChunks < comp1SimpleChunks:
                if b <= a and d <= c:
                    return comp2
                else:
                    return False
            return False
        return False

    @staticmethod
    def checkComparisonValidity(comparison,varKeys):
        comparisonSubmodules = comparison.split('.')
        for comparisonSubmodule in comparisonSubmodules:
            for varClass in ("Sv", "OffIndel"):
                if varClass in comparisonSubmodule:
                    for offset in range(4):
                        offsetStr = str(offset)
                        comparisonSubmoduleRoot, comparisonSubmoduleVarKeyRoot = varClass, helper[varClass]
                        if comparisonSubmodule == comparisonSubmoduleRoot + offsetStr:
                            if comparisonSubmoduleVarKeyRoot + offsetStr not in varKeys:
                                #print("0",comparison,varKeys,file=stderr)
                                return False
                            anyMatch = False
                            for i in range(0, offset + 1):
                                if comparisonSubmoduleVarKeyRoot + str(i) in varKeys:
                                    anyMatch = True
                                    break
                            if not anyMatch:
                                #print("1",comparison, varKeys,file=stderr)
                                return False
            expectedVariants = comparisonModuleNames[comparisonSubmodule]
            if len(set.intersection(varKeys, expectedVariants)) == 0:
                #print("2", comparison, varKeys,file=stderr)
                return False
        #print("OK", comparison, varKeys,file=stderr)
        return True
    @staticmethod
    def slimDownVariants(variants, patientToKickOut):
        variantsSlim=dict()
        for key,value in variants.items():
            if value!={patientToKickOut}:
                variantsSlim[key]=value-{patientToKickOut}
        return variantsSlim
    def processGene(self,gene,expressions,variants,pidTranslator):
        if len(self.timingSteps)>0:
            if self.numProcessedGenes / self.numExpectedGenes >  self.timingSteps[-1]:
                avgTime = (time.time() - self.latestTime) / self.numProcessedGenesBatch
                self.latestTime = time.time()
                print(str(self.timingSteps[-1]*100)+"%",
                      "processed in",(self.latestTime-self.startTime)/60,"minutes, with the latest batch processed at",
                      avgTime,"seconds per gene", file=stderr)
                self.numProcessedGenesBatch=0
                self.timingSteps.pop()
        self.previousKwResults = dict()
        self.previousComparisonResults = dict()
        geneBuffer=dict()
        #relevantComparisonFrames=[x for x in comparisonFrames if any((y in comparisonFrames[x][0] for y in variants))]
        #for comparison in relevantComparisonFrames:
        blacklistedComparisons=set()
        varKeys=set(variants.keys())
        for comparison in comparisonFrames:
            if not GeneProcessor.checkComparisonValidity(comparison,varKeys):
                blacklistedComparisons.add(comparison)
        for comparison in comparisonFrames:
            if comparison in blacklistedComparisons:
                continue
            validVariantTypes=comparisonFrames[comparison][0]
            # ignoredVariantTypes=comparisonFrames[comparison][1]
            # indicesToIgnore=set()
            # for ignoredVariantType in ignoredVariantTypes:
            #     for i in variants[ignoredVariantType]:
            #         indicesToIgnore.add(i)
            # selectedIndices=set().union(*[x for i,x in variants.items() if  (i not in ignoredVariantTypes) and i in validVariantTypes])
            selectedIndices=set().union(*[x for i,x in variants.items() if i in validVariantTypes])
            selectedIndicesFinal={i for i in selectedIndices if i in expressions}
            if len(selectedIndicesFinal)==0:
                continue
            # invertedIndicesFinal=sorted([i for i in pidTranslator if (i not in indicesToIgnore) and (i not in selectedIndices) and (i in expressions)])
            invertedIndicesFinal={i for i in pidTranslator if (i not in selectedIndices) and i in expressions}
            if len(invertedIndicesFinal)==0:
                continue
            selectedExpressions = [[expressions[i], i] for i in selectedIndicesFinal]
            invertedExpressions = [[expressions[i], i] for i in invertedIndicesFinal]
            selectedExpressions.sort(key=lambda x: x[0])
            invertedExpressions.sort(key=lambda x: x[0])
            resTmp = self.processComparison(selectedExpressions, invertedExpressions, comparison, variants)
            if not resTmp:
                continue
            res=resTmp
            rowEntry=tuple(res)
            if rowEntry not in geneBuffer:
                geneBuffer[rowEntry] = []
            geneBuffer[rowEntry].append(comparison)
            # key=(tuple(sorted(list(selectedIndicesFinal))),
            #      tuple(sorted(list(invertedIndicesFinal))))
            # if key in self.previousComparisonResults:
            #     res=self.previousComparisonResults[key]
            # else:
            #     selectedExpressions=[[expressions[i],i] for i in selectedIndicesFinal]
            #     invertedExpressions=[[expressions[i],i] for i in invertedIndicesFinal]
            #     selectedExpressions.sort(key=lambda x: x[0])
            #     invertedExpressions.sort(key=lambda x: x[0])
            #     res=self.processComparison(selectedExpressions,invertedExpressions,comparison)
            #     self.previousComparisonResults[key]=res
            # kickOuts=res[-1]
            # rowEntrySlim=tuple(res[:-1])
            # if rowEntrySlim not in geneBuffer:
            #     geneBuffer[rowEntrySlim]=[kickOuts,[]]
            # else:
            #     if kickOuts<geneBuffer[rowEntrySlim][0]:
            #         geneBuffer[rowEntrySlim][0]=kickOuts
            # geneBuffer[rowEntrySlim][1].append(comparison)
        self.numProcessedGenes+=1
        self.numProcessedGenesBatch+=1
        if len(geneBuffer)>0:
            self.outputCurrent(gene,geneBuffer)
    @staticmethod
    def computeTrimean(arrIn):
        percentiles=percentile(arrIn,[25,50,75])
        return (percentiles[0]+2*percentiles[1]+percentiles[2])/4
    @staticmethod
    def log2FC(x,y):
        return log2(x)-log2(y)
    @staticmethod
    def computeKwTest(selectedExpressions,invertedExpressions):
        selectedExpressionValues=array([x[0] for x in selectedExpressions])
        invertedExpressionValues=array([x[0] for x in invertedExpressions])
        kwP=kruskal(selectedExpressionValues,invertedExpressionValues)[1]
        return kwP

    def processComparison(self,selectedExpressionsInit,invertedExpressionsInit,targetedComparison,variants):
        initResult=GeneProcessor.computeKwTest(selectedExpressionsInit,invertedExpressionsInit)
        selectedExpressionsInitPure = array([x[0] for x in selectedExpressionsInit])
        invertedExpressionsInitPure = array([x[0] for x in invertedExpressionsInit])
        initTrimeanDiff=GeneProcessor.log2FC(GeneProcessor.computeTrimean(selectedExpressionsInitPure),
                                             GeneProcessor.computeTrimean(invertedExpressionsInitPure))
        if len(selectedExpressionsInitPure)<3 or \
                initTrimeanDiff==0 or \
                len(selectedExpressionsInitPure)/(len(selectedExpressionsInitPure)+len(invertedExpressionsInitPure))>0.8:
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
            if key in self.previousKwResults:
                tmpResult = self.previousKwResults[key]
            else:
                tmpResult = GeneProcessor.computeKwTest(selectedExpressionsTmp,invertedExpressionsTmp)
                self.previousKwResults[key]=tmpResult
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

    def outputCurrent(self,gene,geneBuffer):
        for entry in geneBuffer:
            for currentComparison in geneBuffer[entry]:
                comparisonContributions = [0 for _ in range(len(self.comparisonVocab))]
                splitEntry = list(entry)
                for comparison in currentComparison.split('.'):
                    index=self.comparisonVocab[comparison]
                    comparisonContributions[index]=1
                tmpOutput = [gene]
                tmpOutput.append(currentComparison)
                tmpOutput.extend(splitEntry)
                tmpOutput.extend(comparisonContributions)
                if tmpOutput[2] == 0.0:
                    tmpOutput[2] = 1e-12
                tmpOutput[2] = abs(-log10(tmpOutput[2]))
                tmpOutput[2] = round(tmpOutput[2], 4)
                tmpOutput[3] = round(float(tmpOutput[3]), 4)
                tmpOutput[4] = round(float(tmpOutput[4]), 4)
                print(*tmpOutput,sep='\t')

    @staticmethod
    def findTreeRoots(compList):
        rootList = []
        compList.sort(key=lambda x: len(x))
        for comp in compList:
            foundMatch = False
            for i in range(len(rootList)):
                root = rootList[i]
                if GeneProcessor.comparisonRank(comp, root) == comp:
                    foundMatch = True
                    rootList[i] = comp
                    break
                elif GeneProcessor.comparisonRank(comp, root) == root:
                    foundMatch = True
                    break
            if not foundMatch:
                rootList.append(comp)
        return rootList

    def outputCurrentTreeBased(self,gene, geneBuffer):
        for entrySlim in geneBuffer:
            currentRoots = GeneProcessor.findTreeRoots(geneBuffer[entrySlim][1])
            for currentRoot in currentRoots:
                comparisonContributions = [0 for _ in range(len(self.comparisonVocab))]
                splitEntry = list(entrySlim) + [geneBuffer[entrySlim][0]]
                for comparison in currentRoot.split('.'):
                    index = self.comparisonVocab[comparison]
                    comparisonContributions[index] = 1
                tmpOutput = [gene]
                tmpOutput.extend(splitEntry)
                tmpOutput.extend(comparisonContributions)
                tmpOutput.append(currentRoot)
                if tmpOutput[1] == 0.0:
                    tmpOutput[1] = 1e-12
                tmpOutput[1] = abs(-log10(tmpOutput[1]))
                tmpOutput[1] = round(tmpOutput[1], 4)
                tmpOutput[2] = round(float(tmpOutput[2]), 4)
                tmpOutput[3] = round(float(tmpOutput[3]), 4)
                print(*tmpOutput, sep='\t')