#!/bin/python
import re
from sys import argv
from gzip import open as gzopen

consensusTadFile=argv[1]
cnvResultFiles=argv[2]

chromosomeList=[str(x) for x in range(1,23)]+["X","Y"]

def natural_sort(l): 
    convert = lambda text: int(text) if text.isdigit() else text.lower() 
    alphanum_key = lambda key: [ convert(c) for c in re.split('([0-9]+)', key) ] 
    return sorted(l, key = alphanum_key)

validChromosomes={str(x) for x in range(1,23)}
validChromosomes.add("X")
validChromosomes.add("Y")

chrToIndex = {str(x):x for x in range(1,23)}
chrToIndex["X"]=23
chrToIndex["Y"]=24


class TAD:
    def __init__(self,chromosome,start,end,index,cytoband,genes,cancerGenes):
        self.chromosome=chromosome
        self.start=start
        self.end=end
        self.index=index
        self.donorIndicesGain=set()
        self.donorIndicesLoss=set()
        self.donorIndicesLoh=set()
    def printTad(self,donorConverter):
        if self.chromosome in validChromosomes and (len(self.donorIndicesGain)>0 or len(self.donorIndicesLoss)>0):
            donorsStrGain=','.join(natural_sort([donorConverter[x] for x in self.donorIndicesGain]))
            if donorsStrGain=="":
                donorsStrGain="NA"
            donorsStrLoss=','.join(natural_sort([donorConverter[x] for x in self.donorIndicesLoss]))
            if donorsStrLoss=="":
                donorsStrLoss="NA"
            donorsStrLoh=','.join(natural_sort([donorConverter[x] for x in self.donorIndicesLoh]))
            if donorsStrLoh=="":
                donorsStrLoh="NA"
            print(self.index,donorsStrLoss,donorsStrGain,donorsStrLoh,sep='\t')
class TadIntersector:
    def __init__(self):
        self.tads=[]
        with open(consensusTadFile) as f:
            for line in f:
                lineChunks=line.rstrip().split('\t')
                self.tads.append(TAD(*lineChunks))
        self.donorIndices=dict()
        self.maxDonorIndex=0
    def processResults(self,tadResults,donor):
        if donor not in self.donorIndices:
            self.maxDonorIndex+=1
            self.donorIndices[donor] = self.maxDonorIndex
        with gzopen(tadResults,'rt') as f:
            for line in f:
                lineChunks=line.rstrip().split('\t')
                tadIndex=int(lineChunks[0])
                cnvTypes=lineChunks[1].split(',')
                lohTypes=[x for x in lineChunks[2].split(',') if x!="."]
                if any(["gain" in x for x in cnvTypes]):
                    self.tads[tadIndex-1].donorIndicesGain.add(self.maxDonorIndex)
                if any(["loss" in x for x in cnvTypes]):
                    self.tads[tadIndex-1].donorIndicesLoss.add(self.maxDonorIndex)
                if len(lohTypes) > 0:
                    self.tads[tadIndex-1].donorIndicesLoh.add(self.maxDonorIndex)
    def printDb(self):
        donorIndicesInverse = {v: k for k, v in self.donorIndices.items()}
        for tad in self.tads:
            tad.printTad(donorIndicesInverse)

tmpObj=TadIntersector()
with open(cnvResultFiles) as f:
    for line in f:
        inputPath,inputGeneBased,inputPathTadBased, donor=line.rstrip().split('\t')
        tmpObj.processResults(inputPathTadBased,donor)
print("tadIndex","lossDonors","gainDonors","lohDonors",sep='\t')
tmpObj.printDb()
