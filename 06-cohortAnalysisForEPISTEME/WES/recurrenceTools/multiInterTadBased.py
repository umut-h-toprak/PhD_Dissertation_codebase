from sys import argv, stderr
from common import tools

consensusTadFile = argv[1]

class MultiTadIntersector:
    def __init__(self,consensusTadRef):
        self.tads = []
        with open(consensusTadRef) as f:
            for line in f:
                lineChunks = line.rstrip().split('\t')
                self.tads.append(tools.TAD(*lineChunks))
    def addFile(self,filename):
        with open(filename) as f:
            header=next(f)
            tadOffset0col=0
            tadOffset1col=0
            tadOffset2col=0
            tadOffset3col=0
            donorCol=0
            for i,chunk in enumerate(header.rstrip().split('\t')):
                if chunk=="tadIndicesOffset0":
                    tadOffset0col = i
                elif chunk=="tadIndicesOffset1":
                    tadOffset1col = i
                elif chunk=="tadIndicesOffset2":
                    tadOffset2col = i
                elif chunk=="tadIndicesOffset3":
                    tadOffset3col = i
                elif chunk=="donor":
                    donorCol = i
            for line in f:
                lineChunks=line.rstrip().split('\t')
                tadOffset0=[int(x)-1 for x in lineChunks[tadOffset0col].split(';') if x!="."]
                tadOffset1=[int(x)-1 for x in lineChunks[tadOffset1col].split(';') if x!="."]
                tadOffset2=[int(x)-1 for x in lineChunks[tadOffset2col].split(';') if x!="."]
                tadOffset3=[int(x)-1 for x in lineChunks[tadOffset3col].split(';') if x!="."]
                donor=lineChunks[donorCol]
                for tadIndex in tadOffset0:
                    self.tads[tadIndex].addDonorContribution(donor,0)
                for tadIndex in tadOffset1:
                    self.tads[tadIndex].addDonorContribution(donor,1)
                for tadIndex in tadOffset2:
                    self.tads[tadIndex].addDonorContribution(donor,2)
                for tadIndex in tadOffset3:
                    self.tads[tadIndex].addDonorContribution(donor,3)
    def printDb(self):
        for tad in self.tads:
            tad.printTad()
multiTadIntersector=MultiTadIntersector(consensusTadFile)
primaryCohortWideOutput = argv[2]
multiTadIntersector.addFile(primaryCohortWideOutput)
if len(argv)==4:
    secondaryCohortWideOutput = argv[3]
    multiTadIntersector.addFile(secondaryCohortWideOutput)
print("tadIndex",
      "offset0donors",
      "offset1donors",
      "offset2donors",
      "offset3donors",
      sep='\t')
multiTadIntersector.printDb()