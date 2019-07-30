from sys import argv 

class ChromosomeEntry:
    def __init__(self,midLineIn,end):
        self.midLine=midLineIn
        self.end=end
resFile=argv[1]
refChromosomes=argv[2]


chromosomesDb=dict()
with open(refChromosomes) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        if lineChunks[1]=="25":
            break
        chromosomesDb[lineChunks[0]]=ChromosomeEntry(int(lineChunks[2]),int(lineChunks[3]))
        

with open(resFile) as f:
    for line in f:
        line=line.rstrip()
        lineChunks=line.split('\t')
        if lineChunks[3]!="T":
            print(line)
            continue
        chromosome=lineChunks[0]
        if chromosome not in chromosomesDb:
            continue
        pos=int(lineChunks[1])
        currentMidLine=chromosomesDb[chromosome].midLine
        teloEncounteredM=lineChunks[16][0]=="|"
        lineChunks[3]=chromosome
        if pos<currentMidLine:
            lineChunks[4]=1
            lineChunks[5]=2
            if teloEncounteredM:
                lineChunks[8]="DUP"
            else:
                lineChunks[8]="DEL"
        else:
            lineChunks[4]=chromosomesDb[chromosome].end
            lineChunks[5]=chromosomesDb[chromosome].end+1
            #q-arm
            if teloEncounteredM:
                lineChunks[8]="DEL"
            else:
                lineChunks[8]="DUP"
        lineChunks[10]=abs(lineChunks[4]-pos)
        print(*lineChunks,sep='\t')
