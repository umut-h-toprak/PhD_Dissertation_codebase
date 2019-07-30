from sys import argv

class Element:
    def __init__(self,chunks):
        self.chunks=chunks
        self.lastCols=set()
    def printElement(self):
        outputChunks=self.chunks+[';'.join(map(str,sorted(list(self.lastCols))))]
        print(*outputChunks,sep='\t')
idColumn=int(argv[2])
with open(argv[1]) as f:
    tmpDb=dict()
    for line in f:
        lineChunks = line.rstrip().split('\t')
        currentId = lineChunks[idColumn]
        currentSig=lineChunks[:-1]
        if currentId not in tmpDb:
            tmpDb[currentId]=Element(currentSig)
        tmpDb[currentId].lastCols.add(int(lineChunks[-1]))
    for key in tmpDb:
        tmpDb[key].printElement()
