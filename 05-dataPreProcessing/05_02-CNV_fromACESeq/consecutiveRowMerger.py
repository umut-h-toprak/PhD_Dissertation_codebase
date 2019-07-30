from sys import argv

class Segment:
    def __init__(self,tadIndex):
        self.tadIndex = tadIndex
        self.cnvTypes = set()
        self.lohTypes = set()
    def printSegment(self):
        cnvStr=','.join(self.cnvTypes)
        if cnvStr == "":
            cnvStr ="."
        lohStr=','.join(self.lohTypes)
        if lohStr == "":
            lohStr ="."
        print(self.tadIndex,cnvStr,lohStr,sep='\t')
with open(argv[1]) as f:
    segmentDb=dict()
    for line in f:
        lineChunks = line.rstrip().split('\t')
        currentId = lineChunks[0]
        if currentId not in segmentDb:
            segmentDb[currentId]=Segment(currentId)
        if lineChunks[-2]!=".":
            segmentDb[currentId].cnvTypes.add(lineChunks[-2])
        if lineChunks[-1]!=".":
            segmentDb[currentId].lohTypes.add(lineChunks[-1])
    for key in segmentDb:
        segmentDb[key].printSegment()
