from sys import argv, stderr
from phenotypeProcessingTools import processGeneBatch
from numpy import log10
from gzip import open as gzopen
from multiprocessing import Pool,cpu_count
from copy import copy
from time import time,sleep

testMethod = argv[1]
cohortWideGeneLevelVariants = argv[2]
cohortRnaMatrix = argv[3]
metadataFile=argv[4]
chrYblacklistFile=argv[5]
expectedGenes=int(argv[6])-1
comparisonTypes=argv[7]

validPatients=set()
enumeratePatients=dict()
with open(metadataFile) as f:
    headerChunks=next(f).rstrip().split('\t')
    iAnyVariant=0
    iHealthySample=0
    for i,headerChunk in enumerate(headerChunks):
        if headerChunk=="AnyVariant":
            iAnyVariant=i
        elif headerChunk=="HealthySample":
            iHealthySample=i
    for line in f:
        lineChunks=line.rstrip().split('\t')
        if lineChunks[iAnyVariant]=="+" and lineChunks[iHealthySample]=="-":
            donor=lineChunks[0]
            donorIndex=int(lineChunks[1])
            validPatients.add(donor)
            if donor not in enumeratePatients:
                enumeratePatients[donor]=donorIndex
chrYblacklistedGenes=set()
with open(chrYblacklistFile) as f:
    for line in f:
        chrYblacklistedGenes.add(line.rstrip())

comparisonLookup=dict()
cohortWideGeneLevelVariantsDb=dict()

with gzopen(cohortWideGeneLevelVariants,'rt') as f:
    for line in f:
        gene,patient,variantType = line.rstrip().split('\t')
        if patient not in validPatients:
            continue
        if gene in chrYblacklistedGenes:
            continue
        if gene not in cohortWideGeneLevelVariantsDb:
            cohortWideGeneLevelVariantsDb[gene]=dict()
        if variantType not in cohortWideGeneLevelVariantsDb[gene]:
            cohortWideGeneLevelVariantsDb[gene][variantType]=set()
        cohortWideGeneLevelVariantsDb[gene][variantType].add(enumeratePatients[patient])
reverseEnumeratePatients = {v: k for k, v in enumeratePatients.items()}

def defineComparisonVocab(comparisonTypesIn):
    comparisonVocabOut = dict()
    with open(comparisonTypesIn) as f:
        next(f)
        for lineTmp in f:
            lineChunksTmp = lineTmp.rstrip().split('\t')
            comparisonVocabOut[lineChunksTmp[1]] = int(lineChunksTmp[0])
    return comparisonVocabOut

comparisonVocab=defineComparisonVocab(comparisonTypes)
outputHeader = ["gene", "comparison", "pValLog10", "log2FcTrimean", "log2FcMean", "numSelected", "numInverted", "numSwitched"]
for j in range(len(comparisonVocab)):
    for x in comparisonVocab:
        if comparisonVocab[x]==j:
            outputHeader.append(x)
            break
print(*outputHeader,sep='\t')
def outputCurrent(geneBuffer):
    if len(geneBuffer)==0:
        return
    geneCurrent=geneBuffer["gene"]
    del geneBuffer["gene"]
    for entry in geneBuffer:
        for currentComparison in geneBuffer[entry]:
            comparisonContributions = [0 for _ in range(len(comparisonVocab))]
            splitEntry = list(entry)
            for comparison in currentComparison.split('.'):
                index=comparisonVocab[comparison]
                comparisonContributions[index]=1
            tmpOutput = [geneCurrent]
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


def perr(err_msg):
    print(err_msg,file=stderr)
firstTime=time()
latestTime=firstTime
currentBatchIndex=1
currentPercentageTarget=4
with gzopen(cohortRnaMatrix,'rt') as f:
    header = next(f)
    headerChunks = header.rstrip().split('\t')
    columnIndexToEnumeratedPatient = dict()
    for i,patient in enumerate(headerChunks):
        if patient in validPatients:
            columnIndexToEnumeratedPatient[i] = enumeratePatients[patient]
    with Pool(processes=cpu_count()-1 or 1) as pool:
        batchResults = []
        currentBatch=[]
        cumulativePatientCount=0
        for line in f:
            lineChunks = line.rstrip().split('\t')
            gene=lineChunks.pop(0)
            if gene in chrYblacklistedGenes:
                continue
            if gene not in cohortWideGeneLevelVariantsDb:
                continue
            geneExpressions = dict()
            anyGreaterOne = False
            for i, expression in enumerate(lineChunks):
                if (i + 1) in columnIndexToEnumeratedPatient:
                    expression = float(expression)
                    geneExpressions[columnIndexToEnumeratedPatient[i + 1]] = 2 ** expression
                    if expression >= 1.0:
                        anyGreaterOne = True
            if not anyGreaterOne:
                continue
            currentBatch.append([gene,geneExpressions,cohortWideGeneLevelVariantsDb[gene]])
            cumulativePatientCount+=len(set.union(*[x for x in cohortWideGeneLevelVariantsDb[gene].values()]))
            if cumulativePatientCount>len(validPatients)*5:
                cumulativePatientCount=0
                batchResults.append(pool.apply_async(processGeneBatch,(copy(currentBatch),reverseEnumeratePatients,testMethod)))
                currentBatch.clear()
        batchResults.append(pool.apply_async(processGeneBatch, (copy(currentBatch), reverseEnumeratePatients,testMethod)))
        indicesToVisit={i for i in range(len(batchResults))}
        while True:
            indicesReady = {i for i in indicesToVisit if batchResults[i].ready()}
            for i in indicesReady:
                currentResults = batchResults[i].get()
                for result in currentResults:
                    outputCurrent(result)
                percentageProgress=(currentBatchIndex / len(batchResults)) * 100
                if percentageProgress>currentPercentageTarget:
                    currentTime = time()
                    print(round(percentageProgress,2), "% finished in",
                          (currentTime - latestTime), "seconds total time at", (currentTime-firstTime)/60,"minutes", file=stderr)
                    latestTime = currentTime
                    currentPercentageTarget+=4
                currentBatchIndex+=1
            indicesToVisit = indicesToVisit - indicesReady
            if len(indicesToVisit)==0:
                break
            sleep(1)