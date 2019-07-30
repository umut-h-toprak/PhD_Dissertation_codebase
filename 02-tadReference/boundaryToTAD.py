from sys import argv
inputPath=argv[1]

chrSizeDict={"1":249250621,"2":243199373,"3":198022430,"4":191154276,"5":180915260,
             "6":171115067,"7":159138663,"8":146364022,"9":141213431,"10":135534747,
             "11":135006516,"12":133851895,"13":115169878,"14":107349540,"15":102531392,
             "16":90354753,"17":81195210,"18":78077248,"19":59128983,"20":63025520,
             "21":48129895,"22":51304566,"X":155270560,"Y":59373566}

chrMidlineDict={"1":125000000,"2":93300000,"3":91000000,"4":50400000,"5":48400000,
                "6":61000000,"7":59900000,"8":45600000,"9":49000000,"10":40200000,
                "11":53700000,"12":35800000,"13":17900000,"14":17600000,"15":19000000,
                "16":36600000,"17":24000000,"18":17200000,"19":26500000,"20":27500000,
                "21":13200000,"22":14700000,"X":60600000,"Y":12500000}

class Chromosome:
    def __init__(self,chromosomeId):
        self.size=chrSizeDict[chromosomeId]
        self.midLine=chrMidlineDict[chromosomeId]
        self.chromosomeId=chromosomeId
        self.boundaryPositionsP=[]
        self.boundaryPositionsQ=[]
    def addBoundary(self,start,end):
        if start<self.midLine:
            self.boundaryPositionsP.append(start)
            self.boundaryPositionsP.append(end)
        else:
            self.boundaryPositionsQ.append(start)
            self.boundaryPositionsQ.append(end)
    def printChromosome(self):
        self.boundaryPositionsP=sorted(self.boundaryPositionsP)
        self.boundaryPositionsQ=sorted(self.boundaryPositionsQ)
        if len(self.boundaryPositionsP)>=2:
            print(self.chromosomeId,1,self.boundaryPositionsP[1],sep='\t')
            for i in range(0,len(self.boundaryPositionsP)-3,2):
                print(self.chromosomeId,self.boundaryPositionsP[i],self.boundaryPositionsP[i+3],sep='\t')
            print(self.chromosomeId,self.boundaryPositionsP[-2],self.midLine,sep='\t')
        else:
            print(self.chromosomeId,1,self.midLine,sep='\t')
        if len(self.boundaryPositionsQ)>=2:
            print(self.chromosomeId,self.midLine,self.boundaryPositionsQ[1],sep='\t')
            for i in range(0,len(self.boundaryPositionsQ)-3,2):
                print(self.chromosomeId,self.boundaryPositionsQ[i],self.boundaryPositionsQ[i+3],sep='\t')
            print(self.chromosomeId,self.boundaryPositionsQ[-2],self.size,sep='\t')
        else:
            print(self.chromosomeId,self.midLine,self.size,sep='\t')
chromosomes=dict()
for chromosome in sorted(chrMidlineDict.keys()):
    chromosomes[chromosome]=Chromosome(chromosome)

with open(inputPath) as f:
    currentChromosome="NA"
    for line in f:
        lineChunks=line.rstrip().split('\t')
        chromosome=lineChunks[0]
        startPos=int(lineChunks[1])
        endPos=int(lineChunks[2])        
        chromosomes[chromosome].addBoundary(startPos,endPos)

for chromosome in sorted(chrMidlineDict.keys()):
    chromosomes[chromosome].printChromosome()