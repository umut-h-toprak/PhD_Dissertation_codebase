from sys import argv
from gzip import open as gzopen

methArrayData=argv[1]
validProbesRef=argv[2]

validProbes=set()

with open(validProbesRef) as f:
    for line in f:
        validProbes.add(line.rstrip())
with gzopen(methArrayData,'rt') as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        if lineChunks[0] in validProbes:
            print(line.rstrip())
