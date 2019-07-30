#!/bin/python
from sys import argv
inputPath=argv[1]
minClusterSize=int(argv[2])

STEPSIZE=40000
CLUSTERINGRATIO=0.75

class TADitem:
    def __init__(self,tadStr):
        lineChunks=tadStr.rstrip().split('\t')
        self.chromosome=lineChunks[0]
        self.pos=int(lineChunks[1])
        self.sample=lineChunks[3]

class TADbuffer:
    def __init__(self,chromosome,seedPos):
        self.chromosome=chromosome
        self.startLocs=dict()
        self.samples=set()
        self.maxPos=seedPos
    def addEntry(self,tadItem):
        if tadItem.pos-self.maxPos>3*STEPSIZE:
            return False
        self.samples.add(tadItem.sample)
        if tadItem.pos in self.startLocs:
            self.startLocs[tadItem.pos]+=1
        else:
            self.startLocs[tadItem.pos]=1
        self.maxPos=tadItem.pos
        return True
    def printBuffer(self):
        if len(self.samples)<minClusterSize:
            return
        leftPos,rightPos=self.compressBuffer()
        print(self.chromosome,leftPos,rightPos,len(self.samples),','.join(self.samples),sep='\t')
    def compressBuffer(self):
        targetSize=CLUSTERINGRATIO*len(self.samples)
        startLocsFlat=[[k,v] for k, v in self.startLocs.items()]
        startLocsFlatPosSorted=sorted(startLocsFlat, key=lambda x: x[0])
        startLocsFlatRecSorted=sorted(startLocsFlat, key=lambda x: x[1], reverse=True)
        leftPos=startLocsFlatRecSorted[0][0]
        rightPos=leftPos
        totalSize=startLocsFlatRecSorted[0][1]
        while True:
            if totalSize>=targetSize:
                break
            leftCount=0
            rightCount=0
            leftIndex=0
            rightIndex=0
            for i,x in enumerate(startLocsFlatPosSorted):
                if x[0]<leftPos:
                    leftCount+=x[1]
                if x[0]==leftPos:
                    leftIndex=i
                if x[0]==rightPos:
                    rightIndex=i
                if x[0]>rightPos:
                    rightCount+=x[1]
            if rightCount==0 and leftCount==0:
                break
            if rightCount>leftCount:
                rightPos=startLocsFlatPosSorted[rightIndex+1][0]
                totalSize+=startLocsFlatPosSorted[rightIndex+1][1]
            elif leftCount>rightCount:
                leftPos=startLocsFlatPosSorted[leftIndex-1][0]
                totalSize+=startLocsFlatPosSorted[leftIndex-1][1]
            else:
                if startLocsFlatPosSorted[rightIndex+1][1] >= startLocsFlatPosSorted[leftIndex-1][1]:
                    rightPos=startLocsFlatPosSorted[rightIndex+1][0]
                    totalSize+=startLocsFlatPosSorted[rightIndex+1][1]    
                else:
                    leftPos=startLocsFlatPosSorted[leftIndex-1][0]
                    totalSize+=startLocsFlatPosSorted[leftIndex-1][1]   
        return [leftPos,rightPos+STEPSIZE]
        

with open(inputPath) as f:
    currentChromosome="NA"
    tadBuffer=TADbuffer(1,0)
    for line in f:
        tadItem=TADitem(line)
        if currentChromosome!=tadItem.chromosome:
            tadBuffer.printBuffer()
            tadBuffer=TADbuffer(tadItem.chromosome,tadItem.pos)
            currentChromosome=tadItem.chromosome
        if not tadBuffer.addEntry(tadItem):
            tadBuffer.printBuffer()
            tadBuffer=TADbuffer(tadItem.chromosome,tadItem.pos)
            tadBuffer.addEntry(tadItem) 
