from sys import argv

class Segment:
    def __init__(self,tadIndex):
        self.tadIndex = tadIndex
        self.cnvTypes = set()
        self.lohTypes = set()
    def printSegment(self,donor):
        cnvStr=','.join(self.cnvTypes)
        if cnvStr == "":
            cnvStr ="."
        lohStr=','.join(self.lohTypes)
        if lohStr == "":
            lohStr ="."
        print(self.tadIndex,cnvStr,lohStr,donor,sep='\t')
with open(argv[1]) as f:
    segmentDb=dict()
    prevDonor=""
    for line in f:
        lineChunks = line.rstrip().split('\t')
        currentDonor = lineChunks[3]
        if currentDonor!=prevDonor:
            for key in segmentDb:
                segmentDb[key].printSegment(prevDonor)
            prevDonor=currentDonor
            segmentDb.clear()
        currentId = lineChunks[0]
        if currentId not in segmentDb:
            segmentDb[currentId]=Segment(currentId)
        if lineChunks[1]!=".":
            segmentDb[currentId].cnvTypes.add(lineChunks[1])
        if lineChunks[2]!=".":
            segmentDb[currentId].lohTypes.add(lineChunks[2])
    for key in segmentDb:
        segmentDb[key].printSegment(prevDonor)
    prevDonor=currentDonor
    segmentDb.clear()
