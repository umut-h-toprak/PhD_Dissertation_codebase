from sys import argv,stderr
from gzip import open as gzopen

methArrayData=argv[1]

with gzopen(methArrayData,'rt') as f:
    headerChunks=next(f).rstrip().split('\t')
    print(*headerChunks,sep='\t')
    expectedColumns=len(headerChunks)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        currentColumns=len(lineChunks)        
        if currentColumns==1:
            continue
        if currentColumns<expectedColumns:
            i=0
            while i<expectedColumns-currentColumns:
                lineChunks.append("")
                i+=1
        for i in range(expectedColumns):
            if lineChunks[i]=="":
                lineChunks[i]="NA"
        print(*lineChunks,sep='\t')
