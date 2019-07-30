from gzip import open as gzopen
from sys import argv,stderr
from numpy import var as npvar
metadataOutput=argv[1]
localExpressionTable=argv[2]
refRppaFile=argv[3]
refComparisonTypesIn=argv[4]
refGenesFile=argv[5]
refChrYBlacklist=argv[6]
expressionSummaryKw=argv[7]
expressionSummaryTtest=argv[8]
expressionSummaryKs=argv[9]
expressionSummaryJf=argv[10]

chrYblacklistedGenes=set()
with open(refChrYBlacklist) as f:
    for line in f:
        chrYblacklistedGenes.add(int(line.rstrip().lstrip("ENSG0")))

validGenes=set()
with open(refGenesFile) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        geneId=int(lineChunks[0])
        validGenes.add(geneId)

rppaToIds=dict()
with open(refRppaFile) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        rppaToIds[lineChunks[1]]=lineChunks[0]

donorToIndex=dict()
validDonors=set()
with open(metadataOutput) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        donorToIndex[lineChunks[0]]=int(lineChunks[1])
        validDonors.add(lineChunks[0])

refComparisonTypes=dict()
refComparisonTypes["volcanoItemIndex"]="volcanoItemIndex"
refComparisonTypes["gene"]="gene"
refComparisonTypes["rppa"]="rppa"
refComparisonTypes["pValLog10"]="pValLog10"
refComparisonTypes["log2FcTrimean"]="log2FcTrimean"
refComparisonTypes["log2FcMean"]="log2FcMean"
refComparisonTypes["numSelected"]="numSelected"
refComparisonTypes["numInverted"]="numInverted"
refComparisonTypes["numSwitched"]="numSwitched"


with open(refComparisonTypesIn) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        refComparisonTypes[lineChunks[1]]=lineChunks[0]
if localExpressionTable!="NA":
    with open(localExpressionTable.replace(".tsv.gz", "_EPISTEME.tsv"), 'w') as g:
        finalOutput = []
        with gzopen(localExpressionTable,'rt') as f:
            donorToIndex["antibody_id"]="rppa"
            donorToIndex["sample"]="rppa"
            donorToIndex["gene"]="gene"
            donorToIndex["0gene"]="gene"
            donorToIndex["#gene"]="gene"
            donorToIndex["#SAMPLE_ID1"]="gene"
            donorToIndex["SAMPLE_ID1"]="gene"
            donorToIndex["probe"]="probe"
            donorToIndex["Composite Element REF"]="probe"
            donorToIndex["varianceRank"]="varianceRank"
            donorToIndex[""]="gene"
            headerChunks = next(f).rstrip().split('\t')
            headerChunks = [headerChunks[0]] + ["varianceRank"] + headerChunks[1:]
            colsToIgnore=set()
            for i in range(2,len(headerChunks)):
                if not headerChunks[i][-1].isdigit():
                    headerChunks[i]=headerChunks[i][:-1]
                if headerChunks[i] not in validDonors:
                    colsToIgnore.add(i)
            filteredHeaderChunks=[str(donorToIndex[chunk]) for i,chunk in enumerate(headerChunks) if i not in colsToIgnore]
            print(*filteredHeaderChunks,sep='\t',file=g)
            for line in f:
                lineChunks = line.rstrip().split('\t')
                genesOrAntibodies=lineChunks.pop(0)
                for geneOrRppa in genesOrAntibodies.split(','):
                    variance = 0
                    if geneOrRppa in rppaToIds:
                        geneOrRppa = rppaToIds[geneOrRppa]
                    elif geneOrRppa.startswith("ENSGR"):
                        continue
                    elif geneOrRppa.startswith("ENSG"):
                        geneOrRppa = int(geneOrRppa.lstrip("ENSG0"))
                        if geneOrRppa not in validGenes:
                            continue
                        if geneOrRppa in chrYblacklistedGenes:
                            variance=-1
                    varInput = []
                    for i, x in enumerate(lineChunks):
                        if i in colsToIgnore:
                            continue
                        if x=="":
                            variance=-1
                            break
                        varInput.append(float(x))
                    if len(varInput)==0:
                        continue
                    if variance!=-1:
                        variance=npvar(varInput)
                    outputChunks=[geneOrRppa,variance]+ lineChunks
                    finalOutput.append([chunk for i, chunk in enumerate(outputChunks) if i not in colsToIgnore])
        finalOutput.sort(key=lambda x: -x[1])
        for i in range(len(finalOutput)):
            finalOutput[i][1]=i+1
            print(*finalOutput[i], sep='\t', file=g)
if expressionSummaryKw!="NA":
    with open(expressionSummaryKw.replace(".tsv.gz","_EPISTEME.tsv"),'w') as g:
        with gzopen(expressionSummaryKw,'rt') as f:
            headerChunks = next(f).rstrip().split('\t')
            colsToIgnore={1}
            headerOutputChunks=["volcanoItemIndex"]+[refComparisonTypes[chunk] for i,chunk in enumerate(headerChunks) if i not in colsToIgnore]
            print(*headerOutputChunks,sep='\t',file=g)
            volcanoItemIndex = 0
            for line in f:
                lineChunks = line.rstrip().split('\t')
                if lineChunks[0] in rppaToIds:
                    lineChunks[0]=rppaToIds[lineChunks[0]]
                elif lineChunks[0].startswith("ENSG0"):
                    lineChunks[0] = lineChunks[0].lstrip("ENSG0")

                print(*([volcanoItemIndex]+[chunk for i, chunk in enumerate(lineChunks) if i not in colsToIgnore]), sep='\t', file=g)
                volcanoItemIndex+=1
if expressionSummaryTtest!="NA":
    with open(expressionSummaryTtest.replace(".tsv.gz","_EPISTEME.tsv"),'w') as g:
        with gzopen(expressionSummaryTtest,'rt') as f:
            headerChunks = next(f).rstrip().split('\t')
            colsToIgnore={1}
            headerOutputChunks=["volcanoItemIndex"]+[refComparisonTypes[chunk] for i,chunk in enumerate(headerChunks) if i not in colsToIgnore]
            print(*headerOutputChunks,sep='\t',file=g)
            volcanoItemIndex = 0
            for line in f:
                lineChunks = line.rstrip().split('\t')
                if lineChunks[0] in rppaToIds:
                    lineChunks[0]=rppaToIds[lineChunks[0]]
                else:
                    lineChunks[0] = lineChunks[0].lstrip("ENSG0")
                print(*([volcanoItemIndex]+[chunk for i, chunk in enumerate(lineChunks) if i not in colsToIgnore]), sep='\t', file=g)
                volcanoItemIndex+=1
if expressionSummaryKs!="NA":
    with open(expressionSummaryKs.replace(".tsv.gz","_EPISTEME.tsv"),'w') as g:
        with gzopen(expressionSummaryKs,'rt') as f:
            headerChunks = next(f).rstrip().split('\t')
            colsToIgnore={1}
            headerOutputChunks=["volcanoItemIndex"]+[refComparisonTypes[chunk] for i,chunk in enumerate(headerChunks) if i not in colsToIgnore]
            print(*headerOutputChunks,sep='\t',file=g)
            volcanoItemIndex = 0
            for line in f:
                lineChunks = line.rstrip().split('\t')
                if lineChunks[0] in rppaToIds:
                    lineChunks[0]=rppaToIds[lineChunks[0]]
                else:
                    lineChunks[0] = lineChunks[0].lstrip("ENSG0")
                print(*([volcanoItemIndex]+[chunk for i, chunk in enumerate(lineChunks) if i not in colsToIgnore]), sep='\t', file=g)
                volcanoItemIndex+=1
if expressionSummaryJf!="NA":
    with open(expressionSummaryJf.replace(".tsv.gz","_EPISTEME.tsv"),'w') as g:
        with gzopen(expressionSummaryJf,'rt') as f:
            headerChunks = next(f).rstrip().split('\t')
            colsToIgnore={1}
            headerOutputChunks=["volcanoItemIndex"]+[refComparisonTypes[chunk] for i,chunk in enumerate(headerChunks) if i not in colsToIgnore]
            print(*headerOutputChunks,sep='\t',file=g)
            volcanoItemIndex = 0
            for line in f:
                lineChunks = line.rstrip().split('\t')
                if lineChunks[0] in rppaToIds:
                    lineChunks[0]=rppaToIds[lineChunks[0]]
                else:
                    lineChunks[0] = lineChunks[0].lstrip("ENSG0")
                print(*([volcanoItemIndex]+[chunk for i, chunk in enumerate(lineChunks) if i not in colsToIgnore]), sep='\t', file=g)
                volcanoItemIndex+=1
