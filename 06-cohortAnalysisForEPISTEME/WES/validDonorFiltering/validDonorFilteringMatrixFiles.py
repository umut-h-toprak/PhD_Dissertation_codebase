from sys import argv,stderr
from gzip import open as gzopen

matrixIn=argv[1]
validSpecimensIn=argv[2]
validProbes=set()
numValidProbes=0
if len(argv)==4:
    validProbeFile=argv[3]
    with open(validProbeFile) as f:
        for line in f:
            validProbes.add(line.rstrip())
            numValidProbes+=1    

validSpecimens=set()
validDonors=set()
with open(validSpecimensIn) as f:
    for line in f:
        validSpecimens.add(line.rstrip())
        validDonors.add('-'.join(line.rstrip().split('-')[:-1]))

with gzopen(matrixIn,'rt') as f:
    processedSpecimens=set()
    headerChunks=next(f).rstrip().split('\t')
    validColumns=[0]
    for i in range(1,len(headerChunks)):
        currentSpecimen=headerChunks[i]
        if not currentSpecimen[-1].isdigit():
            currentSpecimen=currentSpecimen[:-1]
        specimenChunks=currentSpecimen.split('-')
        healthySpecimen=int(specimenChunks[-1])>10
        currentDonor='-'.join(specimenChunks[:-1])
        validDonor=False
        if currentSpecimen in validSpecimens or (healthySpecimen and currentDonor in validDonors):
            if currentSpecimen not in processedSpecimens:
                processedSpecimens.add(currentSpecimen)
                validColumns.append(i)
    filteredChunks=[]
    for i in validColumns:
        if i>0:
            if not headerChunks[i][-1].isdigit():
                headerChunks[i]=headerChunks[i][:-1]
        filteredChunks.append(headerChunks[i])
    print(*filteredChunks,sep='\t')
    expectedColumns=len(headerChunks)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        if lineChunks[0].startswith("ENSGR"):
            continue
        if lineChunks[0].startswith("ENSG"):
            lineChunks[0]=lineChunks[0].split('.')[0]
        currentColumns=len(lineChunks)
        if currentColumns==1:
            continue
        if  numValidProbes>0:
            if lineChunks[0] not in validProbes:
                continue
        if currentColumns<expectedColumns:
            i=0
            while i<expectedColumns-currentColumns:
                lineChunks.append("")
                i+=1
        filteredChunks=[]
        invalidRow=False
        for i in validColumns:
            if lineChunks[i]=="":
                invalidRow=True
                break
            if lineChunks[i]=="NA":
                invalidRow=True
                break
            filteredChunks.append(lineChunks[i])
        if invalidRow:
            continue
        print(*filteredChunks,sep='\t')
