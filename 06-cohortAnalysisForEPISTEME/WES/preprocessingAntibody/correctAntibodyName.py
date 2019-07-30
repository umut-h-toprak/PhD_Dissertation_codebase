from sys import argv
from gzip import open as gzopen

inputRppaFile=argv[1]
antibodyFixingRefFile=argv[2]

antibodyFixingRef=dict()

with open(antibodyFixingRefFile) as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        antibodyFixingRef[lineChunks[0]]=lineChunks[1]

with gzopen(inputRppaFile,'rt') as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        if lineChunks[0] in antibodyFixingRef:
            lineChunks[0]=antibodyFixingRef[lineChunks[0]]
        print(*lineChunks,sep='\t')
