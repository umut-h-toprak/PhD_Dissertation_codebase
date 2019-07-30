#~ from gzip import open as gzopen
from sys import argv
sophiaOutput=argv[1]
projectName=argv[2]
donorId=argv[3]
defaultReadLength=int(argv[4])
refGenes = argv[5]

class VdjChecker:
    def __init__(self):
        pass
    @staticmethod
    def igBlacklist(chromosome, pos):
        if chromosome == "2" and 87513633 < pos < 87616158:
            return -1
        if chromosome == "2" and 114113972 < pos < 114214486:
            return -1
        if chromosome == "15" and pos < 22529804:
            return -1
        if chromosome == "16" and 32027384 < pos < 33680129:
            return -1
        if chromosome == "21" and 10812620 < pos < 10913068:
            return -1
        return 0

    def igProximityIGK(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "2" and  89106672 < pos < 90324235:
            return 1
        return 0

    def igProximityIGH(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "14" and pos > 106003223:
            return 1
        return 0

    def igProximityIGL(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "22" and 22380473 < pos < 23365203:
            return 1
        if chromosome == "22" and 23751591 < pos < 23946845:
            return 1
        return 0

    def trgProximity(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "7" and 38179180 < pos < 38507770:
            return 1
        return 0

    def trvProximity(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "7" and 141900746 < pos < 142611084:
            return 1
        return 0

    def trbvProximity(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "9" and 33517759 < pos < 33738492:
            return 1
        return 0

    def traProximity(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "14" and 21989990 < pos < 23121097:
            return 1
        return 0

    def checkSvVdjStatus(self, lineChunks):
        chromosome1 = lineChunks[0]
        pos1 = int(lineChunks[1])
        chromosome2 = lineChunks[3]
        pos2 = int(lineChunks[4])
        igkProximity1 = self.igProximityIGK(chromosome1, pos1)
        ighProximity1 = self.igProximityIGH(chromosome1, pos1)
        iglProximity1 = self.igProximityIGL(chromosome1, pos1)
        igkProximity2 = self.igProximityIGK(chromosome2, pos2)
        ighProximity2 = self.igProximityIGH(chromosome2, pos2)
        iglProximity2 = self.igProximityIGL(chromosome2, pos2)
        igBlacklisted1 = self.igBlacklist(chromosome1, pos1)
        igBlacklisted2 = self.igBlacklist(chromosome2, pos2)
        trgProximity1 = self.trgProximity(chromosome1, pos1)
        trgProximity2 = self.trgProximity(chromosome2, pos2)
        trvProximity1 = self.trvProximity(chromosome1, pos1)
        trvProximity2 = self.trvProximity(chromosome2, pos2)
        trbvProximity1 = self.trbvProximity(chromosome1, pos1)
        trbvProximity2 = self.trbvProximity(chromosome2, pos2)
        traProximity1 = self.traProximity(chromosome1, pos1)
        traProximity2 = self.traProximity(chromosome2, pos2)
        if (0 not in {igkProximity1, igkProximity2}) or (0 not in {ighProximity1, ighProximity2}) or (
                0 not in {iglProximity1, iglProximity2}):
            return -1
        if (0 not in {trgProximity1, trgProximity2}) or (0 not in {trvProximity1, trvProximity2}) or (
                0 not in {trbvProximity1, trbvProximity2}) or (0 not in {traProximity1, traProximity2}):
            return -1
        vdjEvent = False
        if -1 not in {igBlacklisted1, igBlacklisted2}:
            vdjEvent = (1 in {igkProximity1, igkProximity2} and 0 in {igkProximity1, igkProximity2}) or (
                        1 in {ighProximity1, ighProximity2} and 0 in {iglProximity1, ighProximity2}) or (
                                   1 in {iglProximity1, iglProximity2} and 0 in {iglProximity1, iglProximity2})
        if not vdjEvent:
            vdjEvent = (1 in {trgProximity1, trgProximity2} and 0 in {trgProximity1, trgProximity2}) or (
                        1 in {trvProximity1, trvProximity2} and 0 in {trvProximity1, trvProximity2}) or (
                                   1 in {trbvProximity1, trbvProximity2} and 0 in {trbvProximity1,
                                                                                   trbvProximity2}) or (
                                   1 in {traProximity1, traProximity2} and 0 in {traProximity1, traProximity2})
        if vdjEvent:
            if 1 in {igkProximity1, iglProximity1, ighProximity1, trgProximity1, trvProximity1, traProximity1, trbvProximity1}:
                return 2
            else:
                return 1
        return 0
vdjChecker=VdjChecker()

pseudoGenes=set()
pseudoGeneClasses={0,1,2,4,7,8,13,15,19,21,23,26,28}
geneOrientations=dict()

with open(refGenes) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        geneId=int(lineChunks[0])
        geneType=int(lineChunks[4])
        if geneType in pseudoGeneClasses:
            geneName=lineChunks[7]
            pseudoGenes.add(geneName)
        geneOrientation=int(lineChunks[-1])
        geneOrientations[geneId]=geneOrientation

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
            posPartChunks=posPart.split(':')
            self.chromosome=posPartChunks[0]
            pos=posPartChunks[1]
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
                  self.chromosome == sa2.chromosome and
                  self.softClip == sa2.softClip and
                  self.hardClip == sa2.hardClip and
                  self.mateSupport == sa2.mateSupport and
                  self.expectedMateSupport == sa2.expectedMateSupport and
                  self.inverted == sa2.inverted)
        return equality
    def fuzzySaOverlap(self,nonFuzzySa,offset):
        if nonFuzzySa.invalid:
            return False
        if self.chromosome!=nonFuzzySa.chromosome:
            return False
        if self.startPos<=nonFuzzySa.startPos<=self.endPos:
            return True
        if self.startPos-offset<=nonFuzzySa.startPos<=self.startPos:
            return True
        if self.endPos<=nonFuzzySa.startPos<=self.endPos+offset:
            return True
        return False

def absoluteSuperiority(chr_1,chr_2,pos_1,pos_2,sa_1,sa_2,defaultReadLengthIn):
    if chr_1!=chr_2:
        return 0
    if pos_1==pos_2:
        return 0
    if sa_1.invalid or sa_2.invalid:
        return 0
    if abs(pos_1-pos_2) > defaultReadLengthIn:
        return 0
    if sa_1.fuzzy or sa_2.fuzzy:
        return 0
    if sa_1.startPos!=sa_2.startPos:
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
    

def fuzzySaOverlap(fuzzySa,nonFuzzySa,offset):
    if nonFuzzySa=="_":
        return False
    fuzzySaChr=fuzzySa.split(':')[0].lstrip('|')
    nonFuzzySaChr=nonFuzzySa.split(':')[0].lstrip('|')
    if nonFuzzySaChr!=fuzzySaChr:
        return False
    nonFuzzyPos = int(nonFuzzySa.split(':')[1].split('(')[0].split('_')[0].rstrip('|'))
    fuzzySaChunks = fuzzySa.split(':')[1].split('-')
    fuzzyStartPos=int(fuzzySaChunks[0])
    fuzzyEndPos=int(fuzzySaChunks[1].split('(')[0].split('_')[0].rstrip('|'))
    if fuzzyStartPos<=nonFuzzyPos<=fuzzyEndPos:
        return True
    if fuzzyStartPos-offset<=nonFuzzyPos<=fuzzyStartPos:
        return True
    if fuzzyEndPos<=nonFuzzyPos<=fuzzyEndPos+offset:
        return True
    return False

def prefilter(unfilteredResults):
    donorSvChunksRawFiltered = []
    mmFilter=donorId.startswith("G170_PD")
    liriFilter=projectName == "LIRI-JP"
    for lineChunksUnfiltered in unfilteredResults:
        if (lineChunksUnfiltered[0] == "X" and lineChunksUnfiltered[3] == "Y") or (lineChunksUnfiltered[0] == "Y" and lineChunksUnfiltered[3] == "X"):
            continue
        source1 = lineChunksUnfiltered[16]
        source2 = lineChunksUnfiltered[17]
        eventScore = float(lineChunksUnfiltered[9])
        if eventScore < 2:
            continue
        supp1 = SuppAlignment(source1)
        source2Exists = source2 != "_"
        supp2 = SuppAlignment(source2)
        if supp1.softClip < 2 and supp2.softClip < 2 and supp1.mateSupport == 0 and supp2.mateSupport == 0:
            continue
        if eventScore == 2:
            if lineChunksUnfiltered[8] == "CONTAMINATION":
                continue
            mrefHits1 = int(lineChunksUnfiltered[6].split('(')[1].split('/')[0])
            mrefHits2 = int(lineChunksUnfiltered[7].split('(')[1].split('/')[0])
            if mrefHits1 > 4 and mrefHits2 > 4:
                continue
            if mrefHits1 > 9 or mrefHits2 > 9:
                continue
            if supp1.chromosome[0] == 'h' or supp1.chromosome[0] == 'G' or supp1.chromosome[0] == 'Y':
                continue
            if supp1.softClip == 0 or supp1.hardClip == 0 or supp1.mateSupport == 0:
                continue
            if supp2.invalid:
                continue
            if supp2.chromosome[0] == 'h' or supp2.chromosome[0] == 'G' or supp2.chromosome[0] == 'Y':
                continue
            if supp2.softClip == 0 or supp2.hardClip == 0 or supp2.mateSupport == 0:
                continue
            if supp1.softClip == 1 and supp1.hardClip == 1 and supp2.softClip == 1 and supp2.hardClip == 1:
                continue
            if supp1.mateSupport < 3 and supp2.mateSupport < 3:
                continue
        if liriFilter:
            if source2Exists:
                if supp1.mateSupport < 5 or supp2.mateSupport < 5:
                    if (supp1.softClip < 2 and supp1.hardClip < 2) or (supp2.softClip < 2 and supp2.hardClip < 2):
                        continue
            else:
                if (supp1.softClip < 2 and supp1.hardClip < 2) or (
                        supp1.mateSupport < 5 or supp1.mateSupport / supp1.expectedMateSupport < 0.5):
                    continue
        if mmFilter:
            if supp1.expectedMateSupport == 0 and supp2.expectedMateSupport == 0:
                continue
        chromosome1 = lineChunksUnfiltered[0]
        chromosome2 = lineChunksUnfiltered[3]

        decoyCandidate = False
        if "hs37d5" in source1:
            if source2 == "_" or "hs37d5" in source2 or chromosome2.startswith("G"):
                decoyCandidate = True
        if "hs37d5" in source2:
            if source1 == "_" or "hs37d5" in source1 or chromosome1.startswith("G"):
                decoyCandidate = True
        if decoyCandidate and ("-" in source1 or "-" in source2):
            continue

        genes1 = lineChunksUnfiltered[20].split(',')
        genes1Raw = [x for x in [gene.split('|')[0] for gene in genes1] if x != '.']
        genes2 = lineChunksUnfiltered[30].split(',')
        genes2Raw = [x for x in [gene.split('|')[0] for gene in genes2] if x != '.']

        genes1RawSet = set(genes1Raw)
        genes2RawSet = set(genes2Raw)
        if "NOTCH2" in genes1RawSet and "NOTCH2NL" in genes2RawSet:
            continue
        if "NOTCH2" in genes1RawSet and "NOTCH2NL" in genes2RawSet:
            continue
        if pseudoArtifactDetection(genes1Raw, genes2Raw):
            continue
        if homologyArtifactDetection("NOTCH2", "NOTCH2NL", genes1RawSet, genes2RawSet):
            continue
        if homologyArtifactDetection("ANKRD36", "ANKRD36B", genes1RawSet, genes2RawSet):
            continue
        if homologyArtifactDetection("ANKRD36C", "ANKRD36B", genes1RawSet, genes2RawSet):
            continue
        if homologyArtifactDetection("ANKRD36C", "ANKRD36", genes1RawSet, genes2RawSet):
            continue
        # if ("TTC28|-201_intron1;" in lineChunksUnfiltered[20]) or ("TTC28|-201_intron1;" in lineChunksUnfiltered[30]):
        #     continue
        if (lineChunksUnfiltered[0] == "MT") and ("MTND" in lineChunksUnfiltered[30] or "MTCY" in lineChunksUnfiltered[30]):
            continue
        if (lineChunksUnfiltered[3] == "MT") and ("MTND" in lineChunksUnfiltered[20] or "MTCY" in lineChunksUnfiltered[20]):
            continue
        vdjStatus = vdjChecker.checkSvVdjStatus(lineChunksUnfiltered)
        if vdjStatus == -1:
            continue
        elif vdjStatus == 1:
            lineChunksUnfiltered[8] = "VDJTRA1"
        elif vdjStatus == 2:
            lineChunksUnfiltered[8] = "VDJTRA2"
        if lineChunksUnfiltered[0] == lineChunksUnfiltered[3]:
            coord1 = int(lineChunksUnfiltered[1])
            coord2 = int(lineChunksUnfiltered[4])
            if abs(coord2 - coord1) < 1500:
                if eventScore == 3:
                    clonalityRatio1 = float(lineChunksUnfiltered[13])
                    clonalityRatio2 = float(lineChunksUnfiltered[15]) if lineChunksUnfiltered[15] != "UNKNOWN" else 0
                    if clonalityRatio1 < 0.1 or clonalityRatio2 < 0.1:
                        continue
                    if clonalityRatio1 < 0.15 and clonalityRatio2 < 0.15:
                        continue
        donorSvChunksRawFiltered.append(lineChunksUnfiltered)
    return donorSvChunksRawFiltered
def homologyArtifactDetection(artifactGene1,artifactGene2,genes1Set,genes2Set):
    if artifactGene1 in genes1Set and artifactGene2 in genes2Set:
        return True
    if artifactGene2 in genes1Set and artifactGene1 in genes2Set:
        return True
    return False

def pseudoArtifactDetection(genes1,genes2):
    for gene1 in genes1:
        if gene1.endswith("P"):
            if gene1 in pseudoGenes:
                for gene2 in genes2:
                    if gene1 == gene2 + "P":
                        return True
    for gene2 in genes2:
        if gene2.endswith("P"):
            if gene2 in pseudoGenes:
                for gene1 in genes1:
                    if gene2 == gene1 + "P":
                        return True
    return False

def dedupFuzzy(resultsWithDups,dedupOffset):
    markedForRemoval=[False for _ in range(len(resultsWithDups))]
    for i in range(len(resultsWithDups)):
        lineChunksI = resultsWithDups[i]
        sa1i = SuppAlignment(lineChunksI[16])
        sa2i = SuppAlignment(lineChunksI[17])
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

def dedup(resultsWithDups,defaultReadLengthIn):
    markedForRemoval=[False for _ in range(len(resultsWithDups))]
    for i in range(len(resultsWithDups)):
        lineChunksI = resultsWithDups[i]
        chr1i=lineChunksI[0]
        chr2i=lineChunksI[3]
        pos1i=int(lineChunksI[1])
        pos2i=int(lineChunksI[4])
        sa1i = SuppAlignment(lineChunksI[16])
        sa2i = SuppAlignment(lineChunksI[17])
        for j in range(len(resultsWithDups)):
            if i==j:
                continue
            lineChunksJ = resultsWithDups[j]
            chr1j=lineChunksJ[0]
            chr2j=lineChunksJ[3]
            pos1j=int(lineChunksJ[1])
            pos2j=int(lineChunksJ[4])
            sa1j = SuppAlignment(lineChunksJ[16])
            sa2j = SuppAlignment(lineChunksJ[17])
            if chr2i==chr2j and abs(pos2i-pos2j)<2*defaultReadLengthIn:
                absoluteSuperiorityScore1=absoluteSuperiority(chr1i,chr1j,pos1i,pos1j,sa1i,sa1j,defaultReadLengthIn)
                if absoluteSuperiorityScore1 == 1:
                    markedForRemoval[j]=True
                elif absoluteSuperiorityScore1 == 2:
                    markedForRemoval[i]=True
            if chr1i==chr1j and abs(pos1i-pos1j)<2*defaultReadLengthIn:
                absoluteSuperiorityScore2=absoluteSuperiority(chr2i,chr2j,pos2i,pos2j,sa2i,sa2j,defaultReadLengthIn)
                if absoluteSuperiorityScore2 == 1:
                    markedForRemoval[j]=True
                elif absoluteSuperiorityScore2 == 2:
                    markedForRemoval[i]=True
            if chr2i==chr1j and abs(pos2i-pos1j)<2*defaultReadLengthIn:
                absoluteSuperiorityScoreCross1=absoluteSuperiority(chr1i,chr2j,pos1i,pos2j,sa1i,sa2j,defaultReadLengthIn)
                if absoluteSuperiorityScoreCross1 == 1:
                    markedForRemoval[j]=True
                elif absoluteSuperiorityScoreCross1 == 2:
                    markedForRemoval[i]=True
            if chr1i==chr2j and abs(pos1i-pos2j)<2*defaultReadLengthIn:
                absoluteSuperiorityScoreCross2=absoluteSuperiority(chr2i,chr1j,pos2i,pos1j,sa2i,sa1j,defaultReadLengthIn)
                if absoluteSuperiorityScoreCross2 == 1:
                    markedForRemoval[j]=True
                elif absoluteSuperiorityScoreCross2 == 2:
                    markedForRemoval[i]=True
    return [resultsWithDups[i] for i in range(len(resultsWithDups)) if not markedForRemoval[i]]

def cleanupLowSupportMidSized(preResultsAfterAllOtherFilters):
    score3Count=0
    score4Count=0
    for svChunks in preResultsAfterAllOtherFilters:
        if svChunks[0]==svChunks[3]:
            eventSize=int(svChunks[10])
            eventScore=float(svChunks[9])
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
                eventScore = float(svChunks[9])
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
                    eventScore = float(svChunks[9])
                    if eventSize < 700:
                        if eventScore == 4:
                            blacklistSv=True
                if not blacklistSv:
                    strongerFilteredSvChunks.append(svChunks)
            return strongerFilteredSvChunks
        return filteredSvChunks
    return preResultsAfterAllOtherFilters


initialResults=[]
with open(sophiaOutput) as f:
    print(next(f).rstrip())
    for line in f:
        lineChunks=line.rstrip().split('\t')
        if float(lineChunks[9])<2:
            continue
        initialResults.append(lineChunks)

prefilteredResults=prefilter(initialResults)
del initialResults
dedupFuzzyResults=dedupFuzzy(prefilteredResults,defaultReadLength*2)
del prefilteredResults
dedupResults=dedup(dedupFuzzyResults,defaultReadLength)
del dedupFuzzyResults
finalResults=cleanupLowSupportMidSized(dedupResults)

for chunks in finalResults:
    print(*chunks,sep='\t')
