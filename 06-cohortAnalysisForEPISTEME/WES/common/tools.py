from gzip import open as gzopen
import numpy as np
import re
from sys import stderr

class SuppAlignment:
    def __init__(self, saStr):
        self.invalid=saStr=="_"
        if not self.invalid:
            self.suspiciousMapping='?' in saStr
            self.overcorrectedProperPairing='#' in saStr
            saChunks=saStr.replace('#','').replace('?','').rstrip(')').split('(')
            posPart=saChunks[0]
            eviPart=saChunks[1]
            self.rightSplit=posPart[0]=='|'
            self.leftSplit=posPart[-1]=='|'
            self.inverted='_INV' in posPart
            posPart=posPart.lstrip('|').rstrip('|').rstrip('_INV')
            self.chr,pos=posPart.split(':')
            if '-' in pos:
                self.fuzzy=True
                self.startPos,self.endPos=pos.split('-')
                self.startPos=int(self.startPos)
                self.endPos=int(self.endPos)
            else:
                self.fuzzy=False
                self.startPos=int(pos)
                self.endPos=self.startPos
            self.softClip,self.hardClip,mateEvidence=eviPart.split(',')
            self.softClip=int(self.softClip)
            self.hardClip=int(self.hardClip)
            self.mateSupport,self.expectedMateSupport=mateEvidence.split('/')
            self.mateSupport=int(self.mateSupport)
            self.expectedMateSupport=int(self.expectedMateSupport)
        else:
            self.softClip = 0
            self.hardClip = 0
            self.mateSupport = 0
            self.expectedMateSupport = 0
    def absolutelySuperiorTo(self,sa2):
        return (not self.invalid and
                not sa2.invalid and
                self.softClip > sa2.softClip and
                self.hardClip > sa2.hardClip and
                self.mateSupport > sa2.mateSupport)
    def isLowQualFuzzy(self):
        res=(not self.invalid and
             self.fuzzy and
             self.softClip <2 and
             self.hardClip <2 and
             not(self.softClip>0 and self.hardClip>0)
             )
        return res
    def __eq__(self,sa2):
        equality=(not self.invalid and
                  not sa2.invalid and
                  self.fuzzy==sa2.fuzzy and
                  self.leftSplit==sa2.leftSplit and
                  self.rightSplit==sa2.rightSplit and
                  self.startPos==sa2.startPos and
                  self.endPos==sa2.endPos and
                  self.chr == sa2.chr and
                  self.softClip == sa2.softClip and
                  self.hardClip == sa2.hardClip and
                  self.mateSupport == sa2.mateSupport and
                  self.expectedMateSupport == sa2.expectedMateSupport and
                  self.inverted == sa2.inverted)
        return equality
    def fuzzySaOverlap(self,nonFuzzySa,offset):
        if nonFuzzySa.invalid:
            return False
        if self.chr!=nonFuzzySa.chr:
            return False
        if self.startPos<=nonFuzzySa.startPos<=self.endPos:
            return True
        if self.startPos-offset<=nonFuzzySa.startPos<=self.startPos:
            return True
        if self.endPos<=nonFuzzySa.startPos<=self.endPos+offset:
            return True
        return False

class GeneNameToEnsemblConverter:
    def __init__(self,ensemblIdToGeneSymbolFile,refseqToEnsemblFile,ncbiSynonymsFile,refGenes):
        self.geneNameToEnsembl = dict()
        with open(ensemblIdToGeneSymbolFile) as f:
            next(f)
            for line in f:
                lineChunks = line.rstrip().split('\t')
                ensemblGeneID = lineChunks[0]
                geneName = lineChunks[1]
                if geneName not in self.geneNameToEnsembl:
                    self.geneNameToEnsembl[geneName] = set()
                self.geneNameToEnsembl[geneName].add(ensemblGeneID)
        with open(refseqToEnsemblFile) as f:
            next(f)
            for line in f:
                lineChunks = line.rstrip().split('\t')
                ensemblGeneID = lineChunks[1]
                geneName = lineChunks[0]
                if geneName not in self.geneNameToEnsembl:
                    self.geneNameToEnsembl[geneName] = set()
                self.geneNameToEnsembl[geneName].add(ensemblGeneID)
        with open(ncbiSynonymsFile) as g:
            next(g)
            for line in g:
                if line[-2] == '-':
                    continue
                lineChunks = line.rstrip().split('\t')
                aliases = lineChunks[1].split('|')
                official = lineChunks[0]
                merged = [official] + aliases
                pcase = None
                for x in merged:
                    if x not in self.geneNameToEnsembl:
                        pcase = x
                        break
                if pcase is None:
                    continue
                corr = None
                for x in merged:
                    if x in self.geneNameToEnsembl:
                        corr = x
                        break
                if corr is None:
                    continue
                self.geneNameToEnsembl[pcase] = set(self.geneNameToEnsembl[corr])
        with open(refGenes) as f:
            next(f)
            for line in f:
                lineChunks = line.rstrip().split('\t')
                geneName=lineChunks[7]
                geneIdPre=lineChunks[0]
                geneId="ENSG"+''.join(["0" for _ in range(0,11 - len(geneIdPre))])+geneIdPre
                # if "locus" in geneName:
                #     print(line.rstrip(),file=stderr)
                #     print(geneId,file=stderr)
                if geneName not in self.geneNameToEnsembl:
                    self.geneNameToEnsembl[geneName] = set()
                self.geneNameToEnsembl[geneName].add(geneId)
                if geneName.endswith(".locus"):
                    geneName=geneName.replace(".locus","")
                    if geneName not in self.geneNameToEnsembl:
                        self.geneNameToEnsembl[geneName] = set()
                    self.geneNameToEnsembl[geneName].add(geneId)
                elif geneName.startswith("hsa-mir"):
                    for i in range(1,4):
                        geneNameCurrent = geneName+"."+str(i)
                        if geneNameCurrent not in self.geneNameToEnsembl:
                            self.geneNameToEnsembl[geneNameCurrent] = set()
                        self.geneNameToEnsembl[geneNameCurrent].add(geneId)
        for gene in self.geneNameToEnsembl:
            self.geneNameToEnsembl[gene]=','.join(self.geneNameToEnsembl[gene])
class TadHit:
    def __init__(self, tadIndex, offset, genes):
        self.tadIndex = tadIndex
        self.offset = abs(offset)
        self.genes = set(genes)
    def addGenes(self,otherGenes):
        for gene in otherGenes:
            self.genes.add(gene)
    def setAsMidSizedIntergenicCandidate(self):
        self.genes = set("!")
    def printTadHit(self,geneNameToEnsemblConverter):
        if self.genes != set("!"):
            if len(self.genes) > 0:
                finalGenes = []
                for gene in self.genes:
                    gene=gene.split(';')[0]
                    if gene in geneNameToEnsemblConverter.geneNameToEnsembl:
                        geneAlternatives = geneNameToEnsemblConverter.geneNameToEnsembl[gene].split(',')
                        for geneAlternative in geneAlternatives:
                            finalGenes.append(geneAlternative)
                    else:
                        print(gene,file=stderr)
                        finalGenes.append(gene.split(';')[0].split('|')[0])
                geneStr = '|'.join(finalGenes)
            else:
                geneStr = "."
        else:
            geneStr = "!"
        return ",".join([str(x) for x in [self.tadIndex, self.offset, geneStr]])

class BpDigitizer:
    def __init__(self,roadmapEnhancers,consensusTadFile,refChromosomes):
        self.windowStarts = dict()
        self.windowEnds = dict()
        self.lineIndices = dict()
        self.validChromosomes=set()
        self.chrMidlines=dict()
        with open(refChromosomes) as f:
            next(f)
            for line in f:
                lineChunks=line.rstrip().split('\t')
                self.chrMidlines[lineChunks[0]]=int(lineChunks[2])
                self.validChromosomes.add(lineChunks[0])
        self.enhancers = dict()
        for chromosome in self.validChromosomes:
            self.enhancers[chromosome] = []
        with gzopen(roadmapEnhancers, 'rt') as f:
            for line in f:
                lineChunks = line.rstrip().split('\t')
                chromosome = lineChunks[0]
                if chromosome not in self.validChromosomes:
                    continue
                startPos = int(lineChunks[1])
                endPos = int(lineChunks[2])
                self.enhancers[chromosome].append([startPos, endPos])
        with open(consensusTadFile) as f:
            for line in f:
                lineChunks = line.rstrip().split('\t')
                chromosome = lineChunks[0]
                if chromosome not in self.windowStarts:
                    self.windowStarts[chromosome] = list()
                    self.windowEnds[chromosome] = list()
                    self.lineIndices[chromosome] = list()
                startPos = int(lineChunks[1])
                endPos = int(lineChunks[2])
                self.windowStarts[chromosome].append(startPos)
                self.windowEnds[chromosome].append(endPos)
                self.lineIndices[chromosome].append(lineChunks[3])
        for chromosome in self.windowStarts:
            self.windowStarts[chromosome] = np.array(self.windowStarts[chromosome])
            self.windowEnds[chromosome] = np.array(self.windowEnds[chromosome])

    def checkEnhancerHit(self, chrIn, startIn, endIn):
        if chrIn not in self.enhancers:
            return False
        for enhancer in self.enhancers[chrIn]:
            if enhancer[1] < startIn:
                continue
            if enhancer[0] < endIn:
                continue
            return True
        return False

    def processIntrachromosomalBps(self, bpChr, bpPos1, bpPos2, genes1, genes2, exonic, crossGene, small, largeSizeThreshold=50000, veryLargeSizeThreshold=10e6):
        eventSize = bpPos2 - bpPos1
        windowOccupancy1 = ((bpPos1 >= self.windowStarts[bpChr]) & (bpPos1 <= self.windowEnds[bpChr]))
        windowOccupancy2 = ((bpPos2 >= self.windowStarts[bpChr]) & (bpPos2 <= self.windowEnds[bpChr]))
        windowOccupancy = (windowOccupancy1 | windowOccupancy2)
        iFirst = -1
        borderHit = False
        if np.sum(windowOccupancy) == 2:
            for i, x in enumerate(windowOccupancy):
                if x:
                    if iFirst == -1:
                        iFirst = i
                    else:
                        if i == iFirst + 1:
                            borderHit = True
                        break
        initialHits = list()
        initialHits1 = list()
        initialHits2 = list()
        newIndexDb = dict()
        for x in range(len(windowOccupancy1)):
            if windowOccupancy1[x]:
                initialHits.append(x)
                initialHits1.append(x)
                newIndexDb[x] = TadHit(x, 0, genes1)
        # if len(initialHits)==0:
        #     print(self.windowStarts[bpChr],self.windowEnds[bpChr],file=stderr)
        #     return False
        firstHit = initialHits1[0]
        for x in range(len(windowOccupancy2)):
            if windowOccupancy2[x]:
                initialHits.append(x)
                initialHits2.append(x)
                if x not in newIndexDb:
                    newIndexDb[x] = TadHit(x, 0, genes2)
                else:
                    newIndexDb[x].addGenes(genes2)
        lastHit = initialHits2[-1]
        if bpChr not in {"hs37d5", "MT", "Y"} and not (bpChr.startswith("GL") or bpChr.startswith("NC")):
            if eventSize < veryLargeSizeThreshold or ((lastHit - firstHit) <= 3 and not (bpPos1 <= self.chrMidlines[bpChr] <= bpPos2)):
                for x in range(firstHit, lastHit + 1):
                    windowOccupancy[x] = True
                    initialHits.append(x)
        for initialIndex in initialHits:
            if initialIndex not in newIndexDb:
                newIndexDb[initialIndex] = TadHit(initialIndex, 0,set())
        initialHits=set(initialHits)
        initialHits1=set(initialHits1)
        initialHits2=set(initialHits2)
        if bpChr not in {"hs37d5", "MT", "Y"} and not (bpChr.startswith("GL") or bpChr.startswith("NC")):
            for offset in range(1, 4):
                for initialIndex in initialHits1:
                    if initialIndex - offset not in initialHits:
                        leftCheck1 = self.checkExtensionValidity(bpChr, bpPos1, initialIndex, -offset, 5e6)
                        if leftCheck1:
                            if initialIndex - offset not in newIndexDb:
                                newIndexDb[initialIndex - offset] = TadHit(initialIndex-offset, offset,set())
                            else:
                                if offset < newIndexDb[initialIndex - offset].offset:
                                    newIndexDb[initialIndex - offset] = TadHit(initialIndex-offset, offset,set())
                    if initialIndex + offset not in initialHits:
                        rightCheck1 = self.checkExtensionValidity(bpChr, bpPos1, initialIndex, offset, 5e6)
                        if rightCheck1:
                            if initialIndex + offset not in newIndexDb:
                                newIndexDb[initialIndex + offset] = TadHit(initialIndex+offset, offset,set())
                            else:
                                if offset < newIndexDb[initialIndex + offset].offset:
                                    newIndexDb[initialIndex + offset] = TadHit(initialIndex+offset, offset,set())
                for initialIndex in initialHits2:
                    if initialIndex - offset not in initialHits:
                        leftCheck2 = self.checkExtensionValidity(bpChr, bpPos2, initialIndex, -offset, 5e6)
                        if leftCheck2:
                            if initialIndex - offset not in newIndexDb:
                                newIndexDb[initialIndex - offset] = TadHit(initialIndex-offset, offset,set())
                            else:
                                if offset < newIndexDb[initialIndex - offset].offset:
                                    newIndexDb[initialIndex - offset] = TadHit(initialIndex-offset, offset,set())
                    if initialIndex + offset not in initialHits:
                        rightCheck2 = self.checkExtensionValidity(bpChr, bpPos2, initialIndex, offset, 5e6)
                        if rightCheck2:
                            if initialIndex + offset not in newIndexDb:
                                newIndexDb[initialIndex + offset] = TadHit(initialIndex+offset, offset,set())
                            else:
                                if offset < newIndexDb[initialIndex + offset].offset:
                                    newIndexDb[initialIndex + offset] = TadHit(initialIndex+offset, offset,set())
        if not borderHit:
            if small:
                for hit in newIndexDb:
                    if len(newIndexDb[hit].genes) == 0:
                        newIndexDb[hit].setAsMidSizedIntergenicCandidate()
        newIndexDbCorrected=dict()
        for indexOnChr,tadHit in newIndexDb.items():
            trueTadIndex=self.lineIndices[bpChr][indexOnChr]
            tadHit.tadIndex=trueTadIndex
            newIndexDbCorrected[trueTadIndex]=tadHit
        return newIndexDbCorrected

    def processSingleBp(self, bpChr, bpPos, genes):
        windowOccupancy = ((bpPos >= self.windowStarts[bpChr]) & (bpPos <= self.windowEnds[bpChr]))
        initialHits = set()
        newIndexDb = dict()
        for i in range(len(windowOccupancy)):
            if windowOccupancy[i]:
                initialHits.add(i)
                newIndexDb[i] = TadHit(i, 0, genes)
        if bpChr not in {"hs37d5", "MT", "Y"} and not (bpChr.startswith("GL") or bpChr.startswith("NC")):
            for initialIndex in initialHits:
                for offset in range(1, 4):
                    if initialIndex - offset not in initialHits:
                        leftCheck = self.checkExtensionValidity(bpChr, bpPos, initialIndex, -offset, 5e6)
                        if leftCheck:
                            if initialIndex - offset not in newIndexDb:
                                newIndexDb[initialIndex - offset] = TadHit(initialIndex, offset,set())
                            else:
                                if offset < newIndexDb[initialIndex - offset].offset:
                                    newIndexDb[initialIndex - offset] = TadHit(initialIndex, offset,set())
                    if initialIndex + offset not in initialHits:
                        rightCheck = self.checkExtensionValidity(bpChr, bpPos, initialIndex, offset, 5e6)
                        if rightCheck:
                            if initialIndex + offset not in newIndexDb:
                                newIndexDb[initialIndex + offset] = TadHit(initialIndex, offset,set())
                            else:
                                if offset < newIndexDb[initialIndex + offset].offset:
                                    newIndexDb[initialIndex + offset] = TadHit(initialIndex, offset,set())
        newIndexDbCorrected = dict()
        for indexOnChr, tadHit in newIndexDb.items():
            trueTadIndex = self.lineIndices[bpChr][indexOnChr]
            tadHit.tadIndex = trueTadIndex
            newIndexDbCorrected[trueTadIndex] = tadHit
        return newIndexDbCorrected

    def checkExtensionValidity(self, bpChr, bpPos, initialIndex, extensionOffset, maxDist=2e6):
        if bpChr =="Y" or bpChr not in self.validChromosomes:
            return False
        if extensionOffset < 0:
            if initialIndex + extensionOffset < 0:
                return False
            if self.windowEnds[bpChr][initialIndex + extensionOffset] <= self.chrMidlines[bpChr] <= self.windowStarts[bpChr][initialIndex]:
                return False
            if abs(bpPos - self.windowEnds[bpChr][initialIndex + extensionOffset]) <= maxDist:
                return True
        elif extensionOffset > 0:
            if initialIndex + extensionOffset >= len(self.windowEnds[bpChr]):
                return False
            if self.windowEnds[bpChr][initialIndex] <= self.chrMidlines[bpChr] <= self.windowStarts[bpChr][initialIndex + extensionOffset]:
                return False
            if abs(self.windowStarts[bpChr][initialIndex + extensionOffset] - bpPos) <= maxDist:
                return True
        return False

class TAD:
    def __init__(self, chromosome, start, end, index, *_):
        self.index = index
        self.donors = dict()
        self.validChromosomes = {str(x) for x in range(1, 23)}
        self.validChromosomes.add("X")
        self.validChromosomes.add("Y")

    def addDonorContribution(self,donor,offset):
        if donor not in self.donors:
            self.donors[donor] = offset
        elif offset<self.donors[donor]:
            self.donors[donor] = offset
    @staticmethod
    def natural_sort(l):
        convert = lambda text: int(text) if text.isdigit() else text.lower()
        alphanum_key = lambda key: [convert(c) for c in re.split('([0-9]+)', key)]
        return sorted(l, key=alphanum_key)

    def printTad(self):
        donorsOffset0=[]
        donorsOffset1=[]
        donorsOffset2=[]
        donorsOffset3=[]
        for donor,offset in self.donors.items():
            if offset==0:
                donorsOffset0.append(donor)
            elif offset==1:
                donorsOffset1.append(donor)
            elif offset==2:
                donorsOffset2.append(donor)
            elif offset==3:
                donorsOffset3.append(donor)
        print(self.index,
              ','.join(donorsOffset0),
              ','.join(donorsOffset1),
              ','.join(donorsOffset2),
              ','.join(donorsOffset3),
              sep='\t')


def absoluteSuperiority(chr_1,chr_2,pos_1,pos_2,sa_1,sa_2,defaultReadLength):
    if chr_1 != chr_2:
        return 0
    if pos_1 == pos_2:
        return 0
    if sa_1.invalid or sa_2.invalid:
        return 0
    if abs(pos_1 - pos_2) > defaultReadLength:
        return 0
    if sa_1.fuzzy or sa_2.fuzzy:
        return 0
    if sa_1.startPos != sa_2.startPos:
        return 0
    if sa_1.leftSplit:
        if not sa_2.leftSplit:
            return 0
        if pos_2 > pos_1:
            if sa_1.absolutelySuperiorTo(sa_2):
                return 1
            else:
                return 0
        elif pos_1 > pos_2:
            if sa_2.absolutelySuperiorTo(sa_1):
                return 2
            else:
                return 0
    elif sa_1.rightSplit:
        if not sa_2.rightSplit:
            return 0
        if pos_2 > pos_1:
            if sa_2.absolutelySuperiorTo(sa_1):
                return 2
            else:
                return 0
        elif pos_1 > pos_2:
            if sa_1.absolutelySuperiorTo(sa_2):
                return 1
            else:
                return 0
def dedupFuzzySvs(resultsWithDups,defaultReadLength):
    dedupOffset=2*defaultReadLength
    markedForRemoval=[False for _ in range(len(resultsWithDups))]
    fullLen=len(resultsWithDups)
    for i in range(len(resultsWithDups)):
        lineChunksI = resultsWithDups[i]
        sa1i = SuppAlignment(lineChunksI[16])
        sa2i = SuppAlignment(lineChunksI[17])
        # print("dedupFuzzySvs", i, "/", fullLen, file=stderr)
        for j in range(len(resultsWithDups)):
            if i==j:
                continue
            lineChunksJ = resultsWithDups[j]
            sa1j = SuppAlignment(lineChunksJ[16])
            sa2j = SuppAlignment(lineChunksJ[17])
            if sa1i == sa1j:
                if sa2i.isLowQualFuzzy() and not sa2j.isLowQualFuzzy():
                    if markedForRemoval[i]:
                        continue
                    if sa2i.fuzzySaOverlap(sa2j,dedupOffset):
                        markedForRemoval[i]=True
                elif sa2j.isLowQualFuzzy() and not sa2i.isLowQualFuzzy():
                    if markedForRemoval[j]:
                        continue
                    if sa2j.fuzzySaOverlap(sa2i,dedupOffset):
                        markedForRemoval[j]=True
            elif sa2i == sa2j:
                if sa1i.isLowQualFuzzy() and not sa1j.isLowQualFuzzy():
                    if markedForRemoval[i]:
                        continue
                    if sa1i.fuzzySaOverlap(sa1j,dedupOffset):
                        markedForRemoval[i]=True
                elif sa1j.isLowQualFuzzy() and not sa1i.isLowQualFuzzy():
                    if markedForRemoval[j]:
                        continue
                    if sa1j.fuzzySaOverlap(sa1i,dedupOffset):
                        markedForRemoval[j]=True
            elif sa1i == sa2j:
                if sa2i.isLowQualFuzzy() and not sa1j.isLowQualFuzzy():
                    if markedForRemoval[i]:
                        continue
                    if sa2i.fuzzySaOverlap(sa1j,dedupOffset):
                        markedForRemoval[i]=True
                elif sa1j.isLowQualFuzzy() and not sa2i.isLowQualFuzzy():
                    if markedForRemoval[j]:
                        continue
                    if sa1j.fuzzySaOverlap(sa2i,dedupOffset):
                        markedForRemoval[j]=True
            elif sa2i == sa1j:
                if sa1i.isLowQualFuzzy() and not sa2j.isLowQualFuzzy():
                    if markedForRemoval[i]:
                        continue
                    if sa1i.fuzzySaOverlap(sa2j,dedupOffset):
                        markedForRemoval[i]=True
                elif sa2j.isLowQualFuzzy() and not sa1i.isLowQualFuzzy():
                    if markedForRemoval[j]:
                        continue
                    if sa2j.fuzzySaOverlap(sa1i,dedupOffset):
                        markedForRemoval[j]=True
    return [resultsWithDups[i] for i in range(len(resultsWithDups)) if not markedForRemoval[i]]

def dedupWeakSvs(resultsWithDups,defaultReadLength):
    markedForRemoval = [False for _ in range(len(resultsWithDups))]
    fullLen=len(resultsWithDups)
    for i in range(len(resultsWithDups)):
        lineChunksI = resultsWithDups[i]
        chr1i = lineChunksI[0]
        chr2i = lineChunksI[3]
        pos1i = int(lineChunksI[1])
        pos2i = int(lineChunksI[4])
        sa1i = SuppAlignment(lineChunksI[16])
        sa2i = SuppAlignment(lineChunksI[17])
        # print("dedupWeakSvs",i,"/",fullLen, file=stderr)
        for j in range(len(resultsWithDups)):
            if i == j:
                continue

            lineChunksJ = resultsWithDups[j]
            chr1j = lineChunksJ[0]
            chr2j = lineChunksJ[3]
            pos1j = int(lineChunksJ[1])
            pos2j = int(lineChunksJ[4])
            sa1j = SuppAlignment(lineChunksJ[16])
            sa2j = SuppAlignment(lineChunksJ[17])
            if chr2i == chr2j and abs(pos2i - pos2j) < 2 * defaultReadLength:
                absoluteSuperiorityScore1 = absoluteSuperiority(chr1i,
                                                                chr1j,
                                                                pos1i,
                                                                pos1j,
                                                                sa1i,
                                                                sa1j,
                                                                defaultReadLength)
                if absoluteSuperiorityScore1 == 1:
                    markedForRemoval[j] = True
                elif absoluteSuperiorityScore1 == 2:
                    markedForRemoval[i] = True
            if chr1i == chr1j and abs(pos1i - pos1j) < 2 * defaultReadLength:
                absoluteSuperiorityScore2 = absoluteSuperiority(chr2i,
                                                                chr2j,
                                                                pos2i,
                                                                pos2j,
                                                                sa2i,
                                                                sa2j,
                                                                defaultReadLength)
                if absoluteSuperiorityScore2 == 1:
                    markedForRemoval[j] = True
                elif absoluteSuperiorityScore2 == 2:
                    markedForRemoval[i] = True
            if chr2i == chr1j and abs(pos2i - pos1j) < 2 * defaultReadLength:
                absoluteSuperiorityScoreCross1 = absoluteSuperiority(chr1i,
                                                                     chr2j,
                                                                     pos1i,
                                                                     pos2j,
                                                                     sa1i,
                                                                     sa2j,
                                                                     defaultReadLength)
                if absoluteSuperiorityScoreCross1 == 1:
                    markedForRemoval[j] = True
                elif absoluteSuperiorityScoreCross1 == 2:
                    markedForRemoval[i] = True
            if chr1i == chr2j and abs(pos1i - pos2j) < 2 * defaultReadLength:
                absoluteSuperiorityScoreCross2 = absoluteSuperiority(chr2i,
                                                                     chr1j,
                                                                     pos2i,
                                                                     pos1j,
                                                                     sa2i,
                                                                     sa1j,
                                                                     defaultReadLength)
                if absoluteSuperiorityScoreCross2 == 1:
                    markedForRemoval[j] = True
                elif absoluteSuperiorityScoreCross2 == 2:
                    markedForRemoval[i] = True
    return [resultsWithDups[i] for i in range(len(resultsWithDups)) if not markedForRemoval[i]]

def cleanupLowSupportMidSized(preResultsAfterAllOtherFilters):
    score3Count=0
    score4Count=0
    for svChunks in preResultsAfterAllOtherFilters:
        if svChunks[0]==svChunks[3]:
            eventSize=int(svChunks[10])
            eventScore=int(svChunks[9])
            if eventSize<700:
                if eventScore==3:
                    score3Count += 1
                if eventScore == 4:
                    score4Count += 1
    if score3Count + score4Count > 300:
        filteredSvChunks=[]
        for svChunks in preResultsAfterAllOtherFilters:
            blacklistSv=False
            if svChunks[0] == svChunks[3]:
                eventSize = int(svChunks[10])
                eventScore = int(svChunks[9])
                if eventSize < 700:
                    if eventScore == 3:
                        blacklistSv = True
            if not blacklistSv:
                filteredSvChunks.append(svChunks)
        if score4Count > 50:
            strongerFilteredSvChunks=[]
            for svChunks in filteredSvChunks:
                blacklistSv = False
                if svChunks[0] == svChunks[3]:
                    eventSize = int(svChunks[10])
                    eventScore = int(svChunks[9])
                    if eventSize < 700:
                        if eventScore == 4:
                            blacklistSv=True
                if not blacklistSv:
                    strongerFilteredSvChunks.append(svChunks)
            return strongerFilteredSvChunks
        return filteredSvChunks
    return preResultsAfterAllOtherFilters