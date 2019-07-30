from sys import argv,stderr
from gzip import open as gzopen

matrixIn=argv[1]
validProbes=set()
numValidProbes=0
if len(argv)==3:
    validProbeFile=argv[2]
else:
    validProbeFile="filteredProbes.tsv"
    
with open(validProbeFile) as f:
    for line in f:
        validProbes.add(line.rstrip())
        numValidProbes+=1    

with gzopen(matrixIn,'rt') as f:
    processedSpecimens=set()
    headerChunks=next(f).rstrip().split('\t')
    filteredChunks=[]
    print(*headerChunks,sep='\t')
    expectedColumns=len(headerChunks)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        currentColumns=len(lineChunks)
        if currentColumns==1:
            continue
        if lineChunks[0] not in validProbes:
            continue
        print(*lineChunks,sep='\t')
