from sys import argv, stderr
from common.tools import dedupFuzzySvs,dedupWeakSvs,GeneNameToEnsemblConverter,BpDigitizer,TAD, SuppAlignment, cleanupLowSupportMidSized
from vdjChecker import VdjChecker
from numpy import array, percentile
from outputHeaders import getSvHeader
from gzip import open as gzopen
from itertools import product
from os.path import dirname, exists

sophiaResultFiles = argv[1]
refChromosomes = argv[2]
refCytobands = argv[3]
consensusTadFile = argv[4]
bcellMode = argv[5] == "1"
roadmapEnhancersFile = argv[6]
ensemblIdToGeneSymbolFile = argv[7]
refseqToEnsemblFile = argv[8]
ncbiSynonymsFile = argv[9]
cohortAllSvsFile = argv[10]
cohortMidSizeSvsFile = argv[11]
refFragileSites=argv[12]
cohortGeneFusionsFile = argv[13]
refGenes = argv[14]
projectName = argv[15]

cohortAllSvsHandle = open(cohortAllSvsFile , 'w')
print(*getSvHeader(), sep='\t', file=cohortAllSvsHandle)
cohortMidSizeSvsHandle = open(cohortMidSizeSvsFile, 'w')
print(*getSvHeader(), sep='\t', file=cohortMidSizeSvsHandle)
cohortGeneFusionsHandle = open(cohortGeneFusionsFile, 'w')
print("gene1","gene2","matchedOrientation","donor", sep='\t', file=cohortGeneFusionsHandle)

geneNameToEnsembl=GeneNameToEnsemblConverter(ensemblIdToGeneSymbolFile,refseqToEnsemblFile,ncbiSynonymsFile,refGenes)
bpDigitizer=BpDigitizer(roadmapEnhancersFile, consensusTadFile, refChromosomes)
vdjChecker=VdjChecker()

pseudoGenes=set()
pseudoGeneClasses={0,1,2,4,7,8,13,15,19,21,23,26,28}
geneOrientations=dict()

with open(refGenes) as f:
    next(f)
    for line in f:
        lineChunksGene=line.rstrip().split('\t')
        geneId=int(lineChunksGene[0])
        geneType=int(lineChunksGene[4])
        if geneType in pseudoGeneClasses:
            geneName=lineChunksGene[7]
            pseudoGenes.add(geneName)
        geneOrientation=int(lineChunksGene[-1])
        geneOrientations[geneId]=geneOrientation

cytobands=dict()
with open(refCytobands) as f:
    next(f)
    next(f)
    for line in f:
        lineChunksCyt=line.rstrip().split('\t')
        chrIndex=int(lineChunksCyt[1])
        if chrIndex not in cytobands:
            cytobands[chrIndex]=[]
        cytobands[chrIndex].append([int(lineChunksCyt[2]),int(lineChunksCyt[3]),int(lineChunksCyt[0])])

fragileSites = dict()
with open(refFragileSites) as f:
    next(f)
    for line in f:
        lineChunksChr = line.rstrip().split('\t')
        chrIndex = int(lineChunksChr[1])
        if chrIndex not in fragileSites:
            fragileSites[chrIndex]=[]
        fragileSites[chrIndex].append([int(lineChunksChr[2]), int(lineChunksChr[3]), int(lineChunksChr[0])])


def findCytobandIndex(bpChrIndex,bpPos):
    for cytoband in cytobands[bpChrIndex]:
        if cytoband[0]<=bpPos<=cytoband[1]:
            return cytoband[2]
def findFragileSiteIndex(bpChrIndex,bpPos):
    if bpChrIndex not in fragileSites:
        return -1
    for fragileSite in fragileSites[bpChrIndex]:
        if fragileSite[0]<=bpPos<=fragileSite[1]:
            return fragileSite[2]
    return -1
class SvProcessor:
    def __init__(self):
        self.tads = []
        with open(consensusTadFile) as f:
            for lineTad in f:
                lineChunksTad = lineTad.rstrip().split('\t')
                self.tads.append(TAD(*lineChunksTad))
        self.donorIndices = dict()
        self.maxDonorIndex = 0
        self.eventIDs = {"INV": 0,
                         "TRA": 1,
                         "DEL": 2,
                         "DUP": 3,
                         "TELO": 4,
                         "VDJTRA1": 6,
                         "VDJTRA2": 7}
        self.chrToIndex=dict()
        self.previousFusions=set()
        with open(refChromosomes) as f:
            next(f)
            for lineChr in f:
                lineChunks=lineChr.rstrip().split('\t')
                self.chrToIndex[lineChunks[0]]=int(lineChunks[1])
    @staticmethod
    def phiXtmpFix(lineChunksIn):
        if ("UCK2|-201_intron1;" in lineChunksIn[20]) or ("UCK2|-201_intron1;" in lineChunksIn[30]):
            return False
        if ("RORA|-203_intron1;" in lineChunksIn[20]) or ("RORA|-203_intron1;" in lineChunksIn[30]):
            return False
        if ("MGAT4C|-211_intron1;" in lineChunksIn[20]) or ("MGAT4C|-211_intron1;" in lineChunksIn[30]):
            return False
        return True
    def processDonor(self, svResults,tinCaseIn, donor):
        if donor not in self.donorIndices:
            self.maxDonorIndex += 1
            self.donorIndices[donor] = self.maxDonorIndex
        donorSvChunks = []
        with gzopen(svResults,'rt') as f:
            nocontrolMode="-only" in svResults
            donorSvChunksFilteredMidsizeCleanedup=[]
            next(f)
            for svLine in f:
                lineChunks = svLine.rstrip().split('\t')
                if lineChunks[9] == "2.5":
                    if not SvProcessor.phiXtmpFix(lineChunks):
                        continue
                    lineChunks[9] = "3"
                elif lineChunks[9] == "3":
                    lineChunks[9] = "4"
                elif lineChunks[9] == "4":
                    lineChunks[9] = "5"
                elif lineChunks[9] == "5":
                    lineChunks[9] = "6"
                # testMode = False
                # if lineChunks[0]=="7" and \
                #     lineChunks[1]=="156796698" and \
                #     lineChunks[3]=="7" and \
                #     lineChunks[4]=="142475439":
                #     testMode=True
                if not tinCaseIn:
                    if not nocontrolMode:
                        if lineChunks[6].startswith("GERMLINE") or lineChunks[7].startswith("GERMLINE"):
                            # if testMode:
                            #     print("1",file=stderr)
                            continue
                    # else:
                    #     if lineChunks[9] == "3":
                    #         if testMode:
                    #             print("2",file=stderr)
                    #         continue
                else:
                    if lineChunks[9] == "3":
                        # if testMode:
                        #     print("3", file=stderr)
                        continue
                if not bcellMode:
                    if lineChunks[8].startswith("VDJ"):
                        lineChunks[8]="TRA"
                donorSvChunksFilteredMidsizeCleanedup.append(lineChunks)
            for svChunks in donorSvChunksFilteredMidsizeCleanedup:
                tadHits = self.processSvChunks(svChunks)
                svChunks.append(donor)
                svChunks[43] = ';'.join([x.printTadHit(geneNameToEnsembl) for key, x in tadHits.items()])
                donorSvChunks.append(svChunks)
        self.finalizeDonor(donorSvChunks)
    @staticmethod
    def homologyArtifactDetection(artifactGene1,artifactGene2,genes1Set,genes2Set):
        if artifactGene1 in genes1Set and artifactGene2 in genes2Set:
            return True
        if artifactGene2 in genes1Set and artifactGene1 in genes2Set:
            return True
        return False
    @staticmethod
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
    @staticmethod
    def prefilterDonorSvs(donorSvChunksRaw,donorId):
        donorSvChunksRawFiltered=[]
        for lineChunks in donorSvChunksRaw:
            if (lineChunks[0] == "X" and lineChunks[3] == "Y") or (lineChunks[0] == "Y" and lineChunks[3] == "X"):
                continue
            source1 = lineChunks[16]
            source2 = lineChunks[17]
            eventScore = int(lineChunks[9])
            if eventScore < 2:
                continue
            supp1 = SuppAlignment(source1)
            source2Exists=source2!="_"
            supp2 = SuppAlignment(source2)
            if supp1.softClip < 2 and supp2.softClip < 2 and supp1.mateSupport==0 and supp2.mateSupport==0:
                print("excluded",source1, source2, donorId, sep="\t", file=stderr)
                continue
            if eventScore==2:
                if lineChunks[8] == "CONTAMINATION":
                    continue
                mrefHits1=int(lineChunks[6].split('(')[1].split('/')[0])
                mrefHits2=int(lineChunks[7].split('(')[1].split('/')[0])
                if mrefHits1>4 and mrefHits2>4:
                    continue
                if mrefHits1>9 or mrefHits2>9:
                    continue
                if supp1.chr[0]=='h' or supp1.chr[0]=='G' or supp1.chr[0]=='Y':
                    continue
                if supp1.softClip == 0 or supp1.hardClip==0 or supp1.mateSupport==0:
                    continue
                if supp2.chr[0]=='h' or supp2.chr[0]=='G' or supp2.chr[0]=='Y':
                    continue
                if supp2.softClip == 0 or supp2.hardClip==0 or supp2.mateSupport==0:
                    continue
                if supp1.softClip == 1 and supp1.hardClip == 1 and supp2.softClip == 1 and supp2.hardClip==1:
                    continue
                if supp1.mateSupport<3 and supp2.mateSupport<3:
                    continue
                print("recovered",source1,source2, donorId,sep="\t",file=stderr)
            if projectName=="LIRI-JP":
                if source2Exists:
                    if supp1.mateSupport < 5 or supp2.mateSupport < 5:
                        if (supp1.softClip < 2 and supp1.hardClip < 2) or (supp2.softClip < 2 and supp2.hardClip < 2):
                            print("excluded", source1, source2, donorId, sep="\t", file=stderr)
                            continue
                else:
                    if (supp1.softClip < 2 and supp1.hardClip < 2) or (supp1.mateSupport<5 or supp1.mateSupport/supp1.expectedMateSupport<0.5):
                        print("excluded", source1, source2, donorId, sep="\t", file=stderr)
                        continue

            if projectName=="MM-US" or projectName=="MM_early-US" or projectName=="MM-COLLAB":
                if donorId.startswith("G170_PD"):
                    if supp1.expectedMateSupport==0  and supp2.expectedMateSupport==0:
                        print("excluded", source1, source2, donorId, sep="\t", file=stderr)
                        continue
            chromosome1 = lineChunks[0]
            chromosome2 = lineChunks[3]
            if chromosome1 not in bpDigitizer.validChromosomes and chromosome2 not in bpDigitizer.validChromosomes:
                continue

            decoyCandidate = False
            if "hs37d5" in source1:
                if source2 == "_" or "hs37d5" in source2 or chromosome2.startswith("G"):
                    decoyCandidate = True
            if "hs37d5" in source2:
                if source1 == "_" or "hs37d5" in source1 or chromosome1.startswith("G"):
                    decoyCandidate = True
            if decoyCandidate and ("-" in source1 or "-" in source2):
                continue

            genes1 = lineChunks[20].split(',')
            genes1Raw = [x for x in [gene.split('|')[0] for gene in genes1] if x != '.']
            genes2 = lineChunks[30].split(',')
            genes2Raw = [x for x in [gene.split('|')[0] for gene in genes2] if x != '.']

            genes1RawSet = set(genes1Raw)
            genes2RawSet = set(genes2Raw)
            if "NOTCH2" in genes1RawSet and "NOTCH2NL" in genes2RawSet:
                continue
            if "NOTCH2" in genes1RawSet and "NOTCH2NL" in genes2RawSet:
                continue
            if SvProcessor.pseudoArtifactDetection(genes1Raw,genes2Raw):
                continue
            if SvProcessor.homologyArtifactDetection("NOTCH2", "NOTCH2NL", genes1RawSet,genes2RawSet):
                continue
            if SvProcessor.homologyArtifactDetection("ANKRD36", "ANKRD36B", genes1RawSet,genes2RawSet):
                continue
            if SvProcessor.homologyArtifactDetection("ANKRD36C", "ANKRD36B", genes1RawSet,genes2RawSet):
                continue
            if SvProcessor.homologyArtifactDetection("ANKRD36C", "ANKRD36", genes1RawSet,genes2RawSet):
                continue
            if ("TTC28|-201_intron1;" in lineChunks[20]) or ("TTC28|-201_intron1;" in lineChunks[30]):
                continue
            if (lineChunks[0]=="MT") and ("MTND" in lineChunks[30] or "MTCY" in lineChunks[30]):
                continue
            if (lineChunks[3]=="MT") and ("MTND" in lineChunks[20] or "MTCY" in lineChunks[20]):
                continue
            vdjStatus = vdjChecker.checkSvIgBlacklisting(lineChunks, bcellMode)
            if vdjStatus == -1:
                continue
            elif vdjStatus == 1:
                lineChunks[8] = "VDJTRA1"
            elif vdjStatus == 2:
                lineChunks[8] = "VDJTRA2"
            if lineChunks[0]==lineChunks[3]:
                coord1 = int(lineChunks[1])
                coord2 = int(lineChunks[4])
                if abs(coord2-coord1)<1500:
                    if eventScore==3:
                        clonalityRatio1 = float(lineChunks[13])
                        clonalityRatio2 = float(lineChunks[15]) if lineChunks[15] != "UNKNOWN" else 0
                        if clonalityRatio1<0.1 or clonalityRatio2<0.1:
                            continue
                        if clonalityRatio1<0.15 and clonalityRatio2<0.15:
                            continue
            donorSvChunksRawFiltered.append(lineChunks)
        return donorSvChunksRawFiltered
    @staticmethod
    def processSvChunks(lineChunks):
        chr1 = lineChunks[0]
        chr2 = lineChunks[3]
        coord1 = int(lineChunks[1])
        coord2 = int(lineChunks[4])
        telo1 = chr1 == "5" and coord1 < 11890
        telo2 = chr2 == "5" and coord2 < 11890

        genes1 = lineChunks[20].split(',')
        genes1Raw = [x for x in [gene.split('|')[0] for gene in genes1] if x != '.']
        genes2 = lineChunks[30].split(',')
        genes2Raw = [x for x in [gene.split('|')[0] for gene in genes2] if x != '.']

        tadIndices1 = dict()
        tadIndices2 = dict()
        if chr1 == chr2:
            if chr1 not in bpDigitizer.canonicalChromosomes:
                return dict()
            exonic = ("protein_coding" in lineChunks[20] and not (all(["intron" in x or "Promoter" in x for x in genes1]))) or ("protein_coding" in lineChunks[30] and not (all(["intron" in x or "Promoter" in x for x in genes2])))
            crossGene = (sorted(genes1) != sorted(genes2))
            small = (abs(coord1 - coord2) < 1500)
            if coord2 > coord1:
                tadIndices1 = bpDigitizer.processIntrachromosomalBps(chr1, coord1, coord2, genes1Raw, genes2Raw, exonic, crossGene, small)
            else:
                tadIndices1 = bpDigitizer.processIntrachromosomalBps(chr1, coord2, coord1, genes2Raw, genes1Raw, exonic, crossGene, small)
            if small and (not exonic) and (not crossGene):
                tadIndices=dict()
                for tadKey, tadHit in tadIndices1.items():
                    if tadHit.genes!=set("!"):
                        tadHit.genes=set()
                    tadIndices[tadKey]=tadHit
            else:
                tadIndices = tadIndices1
        else:
            if chr1 in bpDigitizer.validChromosomes:
                if not telo1:
                    if not telo2:
                        tadIndices1 = bpDigitizer.processSingleBp(chr1, coord1, genes1Raw)
                    else:
                        tadIndices1 = {key: item for key, item in bpDigitizer.processSingleBp(chr1, coord1, genes1Raw).items() if item.offset == 0}
            tadIndices = tadIndices1
            if chr2 in bpDigitizer.validChromosomes:
                if not telo2:
                    if not telo1:
                        tadIndices2 = bpDigitizer.processSingleBp(chr2, coord2, genes2Raw)
                    else:
                        tadIndices2 = {key: item for key, item in bpDigitizer.processSingleBp(chr2, coord2, genes2Raw).items() if item.offset == 0}
            for key, item in tadIndices2.items():
                tadIndices[key] = item
        return tadIndices

    @staticmethod
    def estimateSamplePurity(donorSVChunks):
        estimatedPurity = 1.0
        eventClonalities = []
        for lineChunks in donorSVChunks:
            eventScore = float(lineChunks[9])
            if eventScore < 5:
                continue
            source1 = lineChunks[16]
            source2 = lineChunks[17]
            if "_" in {source1, source2}:
                continue
            else:
                supps1 = source1.split('(')[1].split(',')
                supps2 = source2.split('(')[1].split(',')
                if supps1[0] == "0" or supps1[1]=="0":
                    continue
                if supps2[0] == "0" or supps2[1]=="0":
                    continue
            clonalityRatio1 = float(lineChunks[13])
            clonalityRatio2 = float(lineChunks[15]) if lineChunks[15] != "UNKNOWN" else clonalityRatio1
            clonalityEstimate = max(clonalityRatio1, clonalityRatio2) if abs(
                clonalityRatio1 - clonalityRatio2) > 0.3 else 0.5 * (clonalityRatio1 + clonalityRatio2)
            clonalityEstimate = max(0.1, clonalityEstimate)
            eventClonalities.append(clonalityEstimate)
        if len(eventClonalities) > 0:
            estimatedPurity = percentile(array(eventClonalities), 75)
        return estimatedPurity

    @staticmethod
    def tadSvEffectsCounter(donorSvChunks):
        tadHitCounts = dict()
        affectedTads = []
        for lineChunks in donorSvChunks:
            if lineChunks[43] == "":
                lineChunks[43] = "."
            if lineChunks[43] != ".":
                affectedTads = [int(x.split(',')[0]) for x in lineChunks[43].split(';') if int(x.split(',')[1]) == 0]
            for i in affectedTads:
                if i not in tadHitCounts:
                    tadHitCounts[i] = 0
                tadHitCounts[i] += 1
        return tadHitCounts
    @staticmethod
    def geneConverter(geneEntry):
        preChunks = [x.split(';')[0] for x in geneEntry.split(',')]
        finalChunks = []
        for gene in preChunks:
            if '|' in gene:
                geneRawName,geneIntronExonStatusPre = gene.split('|')
            else:
                geneRawName = gene
                geneIntronExonStatusPre=""
            geneIds = geneNameToEnsembl.geneNameToEnsembl[geneRawName].split(',') if geneRawName in geneNameToEnsembl.geneNameToEnsembl else [geneRawName]
            for geneIdCurrent in geneIds:
                if '_' in geneIntronExonStatusPre:
                    finalChunks.append(geneIdCurrent+"_"+ geneIntronExonStatusPre.split('_')[-1])
                else:
                    finalChunks.append(geneIdCurrent)
        return finalChunks
    def finalizeDonorPrintOnly(self, donorSvChunks):
        for lineChunks in donorSvChunks:
            print(*lineChunks,sep='\t')
    def finalizeDonor(self, donorSvChunks):
        samplePurity = self.estimateSamplePurity(donorSvChunks)
        tadHitCounts = self.tadSvEffectsCounter(donorSvChunks)
        for lineChunks in donorSvChunks:
            affectedTads = [int(x.split(',')[0]) for x in lineChunks[43].split(';')] if lineChunks[43]!="." else []
            maxIntraSampleRecurrence = max([tadHitCounts[tad] for tad in affectedTads if tad in tadHitCounts]) if len(affectedTads)>0 else 0
            clonalityRatio1 = float(lineChunks[13])
            clonalityRatio2 = float(lineChunks[15]) if lineChunks[15] != "UNKNOWN" else clonalityRatio1
            clonalityPre = max(clonalityRatio1, clonalityRatio2) if abs(
                clonalityRatio1 - clonalityRatio2) > 0.3 else 0.5 * (clonalityRatio1 + clonalityRatio2)
            clonalityPre = max(0.1, clonalityPre)
            clonality = max(0.1, min(1.0, clonalityPre / samplePurity))
            eventScore = lineChunks[9]
            chr1 = lineChunks[0]
            pos1 = int(lineChunks[1])
            chr2 = lineChunks[3]
            pos2 = int(lineChunks[4])
            telo1 = chr1 == "5" and pos1 < 11890
            telo2 = chr2 == "5" and pos2 < 11890
            if telo1 or telo2:
                lineChunks[8] = "TELO"
            if lineChunks[8] != "VDJTRA1" and lineChunks[8] != "VDJTRA2" and lineChunks[8] != "TELO":
                if chr1 != chr2:
                    lineChunks[8] = "TRA"
            eventID = self.eventIDs[lineChunks[8]]
            smallEvent = False if chr1 != chr2 else abs(pos1 - pos2) < 9e6
            if smallEvent:
                clonality *= 0.5
            if chr1 not in self.chrToIndex:
                if chr2 not in self.chrToIndex:
                    continue
                eventID = 5
                chr1 = chr2
                pos1 = pos2 - 1
            if chr2 not in self.chrToIndex:
                eventID = 5
                chr2 = chr1
                pos2 = pos1 + 1
            preRemapChr2 = lineChunks[49]
            preRemapStart2 = int(lineChunks[50])
            #preRemapEnd2 = lineChunks[51]
            source1 = lineChunks[16]
            overhang1 = "."
            if len(lineChunks[18]) > 1:
                overhang1Candidates = [x.split(':')[1].split('(')[0] for x in lineChunks[18].split(';')]
                overhang1Candidates.sort(key=lambda x: -len(x))
                overhang1 = overhang1Candidates[0]

            gene1 = ','.join(SvProcessor.geneConverter(lineChunks[20]))
            cancerGene1 = ','.join(SvProcessor.geneConverter(lineChunks[21]))
            nearestGeneUpstream1 = lineChunks[22].split(';')[0]
            nearestGeneUpstreamDistance1 = lineChunks[23]
            nearestCancerGeneUpstream1 = lineChunks[24].split(';')[0]
            nearestCancerGeneUpstreamDistance1 = lineChunks[25]
            nearestGeneDownstream1 = lineChunks[26].split(';')[0].split(';')[0]
            nearestGeneDownstreamDistance1 = lineChunks[27]
            nearestCancerGeneDownstream1 = lineChunks[28].split(';')[0]
            nearestCancerGeneDownstreamDistance1 = lineChunks[29]
            dbSuperEntries1 = lineChunks[40]
            preRemapChr1 = lineChunks[46]
            preRemapStart1 = int(lineChunks[47])
            #preRemapEnd1 = lineChunks[48]

            overhang2 = "."
            if len(lineChunks[19]) > 1:
                overhang2Candidates = [x.split(':')[1].split('(')[0] for x in lineChunks[19].split(';')]
                overhang2Candidates.sort(key=lambda x: -len(x))
                overhang2 = overhang2Candidates[0]
            source2 = lineChunks[17]
            gene2 = ','.join(SvProcessor.geneConverter(lineChunks[30]))
            cancerGene2 = ','.join(SvProcessor.geneConverter(lineChunks[31]))
            nearestGeneUpstream2 = lineChunks[32].split(';')[0]
            nearestGeneUpstreamDistance2 = lineChunks[33]
            nearestCancerGeneUpstream2 = lineChunks[34].split(';')[0]
            nearestCancerGeneUpstreamDistance2 = lineChunks[35]
            nearestGeneDownstream2 = lineChunks[36].split(';')[0]
            nearestGeneDownstreamDistance2 = lineChunks[37]
            nearestCancerGeneDownstream2 = lineChunks[38].split(';')[0]
            nearestCancerGeneDownstreamDistance2 = lineChunks[39]
            dbSuperEntries2 = lineChunks[41]
            if self.chrToIndex[chr1] > self.chrToIndex[chr2] or (
                    self.chrToIndex[chr1] == self.chrToIndex[chr2] and pos2 < pos1):
                chr1, chr2 = chr2, chr1
                pos1, pos2 = pos2, pos1
                source1, source2 = source2, source1
                overhang1, overhang2 = overhang2, overhang1
                gene1, gene2 = gene2, gene1
                cancerGene1, cancerGene2 = cancerGene2, cancerGene1
                nearestGeneUpstream1, nearestGeneUpstream2 = nearestGeneUpstream2, nearestGeneUpstream1
                nearestCancerGeneUpstream1, nearestCancerGeneUpstream2 = nearestCancerGeneUpstream2, nearestCancerGeneUpstream1
                nearestGeneUpstreamDistance1, nearestGeneUpstreamDistance2 = nearestGeneUpstreamDistance2, nearestGeneUpstreamDistance1
                nearestCancerGeneUpstreamDistance1, nearestCancerGeneUpstreamDistance2 = nearestCancerGeneUpstreamDistance2, nearestCancerGeneUpstreamDistance1
                nearestGeneDownstream1, nearestGeneDownstream2 = nearestGeneDownstream2, nearestGeneDownstream1
                nearestGeneDownstreamDistance1, nearestGeneDownstreamDistance2 = nearestGeneDownstreamDistance2, nearestGeneDownstreamDistance1
                nearestCancerGeneDownstream1, nearestCancerGeneDownstream2 = nearestCancerGeneDownstream2, nearestCancerGeneDownstream1
                nearestCancerGeneDownstreamDistance1, nearestCancerGeneDownstreamDistance2 = nearestCancerGeneDownstreamDistance2, nearestCancerGeneDownstreamDistance1
                dbSuperEntries1, dbSuperEntries2 = dbSuperEntries2, dbSuperEntries1
                preRemapChr1, preRemapChr2 = preRemapChr2, preRemapChr1
                preRemapStart1, preRemapStart2 = preRemapStart2, preRemapStart1
                #preRemapEnd1, preRemapEnd2 = preRemapEnd2, preRemapEnd1
                if eventID == 6:
                    eventID =7
                elif eventID == 7:
                    eventID =6
            donor = lineChunks[-1]
            tadIndices = lineChunks[43]
            preRemapChr1Out = "."
            preRemapPos1Out = "."
            preRemapChr2Out = "."
            preRemapPos2Out = "."
            if not(preRemapChr1 == chr1 and preRemapStart1 == pos1):
                preRemapChr1Out=preRemapChr1
                preRemapPos1Out=preRemapStart1
            if not(preRemapChr2 == chr2 and preRemapStart2 == pos2):
                preRemapChr2Out=preRemapChr2
                preRemapPos2Out=preRemapStart2
            tadIndicesTmp=[x.split(',') for x in tadIndices.split(';')] if tadIndices!="." else []
            directHits=set()
            for x in tadIndicesTmp:
                if x[-1] not in {"!", "."}:
                    for y in x[-1].split('|'):
                        if int(y.lstrip("ENSG0")) in geneOrientations:
                            directHits.add(y)
            if len(directHits)==0:
                directHits="."
            else:
                directHits = ','.join(directHits)
            tadIndicesOffset0=[str(x) for x in sorted(list({int(x[0]) for x in tadIndicesTmp if int(x[1])==0}))] if len(tadIndicesTmp)>0 else []
            if len(tadIndicesOffset0)==0:
                tadIndicesOffset0="."
            else:
                tadIndicesOffset0=';'.join(tadIndicesOffset0)
            tadIndicesOffset1=[str(x) for x in sorted(list({int(x[0]) for x in tadIndicesTmp if int(x[1])==1}))] if len(tadIndicesTmp)>0 else []
            if len(tadIndicesOffset1)==0:
                tadIndicesOffset1="."
            else:
                tadIndicesOffset1=';'.join(tadIndicesOffset1)
            tadIndicesOffset2=[str(x) for x in sorted(list({int(x[0]) for x in tadIndicesTmp if int(x[1])==2}))] if len(tadIndicesTmp)>0 else []
            if len(tadIndicesOffset2)==0:
                tadIndicesOffset2="."
            else:
                tadIndicesOffset2=';'.join(tadIndicesOffset2)
            tadIndicesOffset3=[str(x) for x in sorted(list({int(x[0]) for x in tadIndicesTmp if int(x[1])==3}))] if len(tadIndicesTmp)>0 else []
            if len(tadIndicesOffset3)==0:
                tadIndicesOffset3="."
            else:
                tadIndicesOffset3=';'.join(tadIndicesOffset3)

            gene1CandidatesPrePre=[x.split('|')[0] for x in lineChunks[20].split(',')]
            gene2CandidatesPrePre=[x.split('|')[0] for x in lineChunks[30].split(',')]
            gene1CandidatesPre = set()
            gene2CandidatesPre = set()
            for x in gene1CandidatesPrePre:
                if x in geneNameToEnsembl.geneNameToEnsembl:
                    for y in geneNameToEnsembl.geneNameToEnsembl[x].split(','):
                        if int(y.lstrip("ENSG0")) in geneOrientations:
                            gene1CandidatesPre.add(y)
            for x in gene2CandidatesPrePre:
                if x in geneNameToEnsembl.geneNameToEnsembl:
                    for y in geneNameToEnsembl.geneNameToEnsembl[x].split(','):
                        if int(y.lstrip("ENSG0")) in geneOrientations:
                            gene2CandidatesPre.add(y)

            gene1Candidates = [x for x in gene1CandidatesPre if x not in gene2CandidatesPre]
            gene2Candidates = [x for x in gene2CandidatesPre if x not in gene1CandidatesPre]
            if len(gene1Candidates)>0 and len(gene2Candidates)>0:
                inverted = int(lineChunks[11] == "INV")
                for gene1Candidate,gene2Candidate in product(gene1Candidates,gene2Candidates):
                    minGene=min(gene1Candidate,gene2Candidate)
                    maxGene=max(gene1Candidate,gene2Candidate)
                    minGeneId=int(minGene.lstrip("ENSG0"))
                    maxGeneId=int(maxGene.lstrip("ENSG0"))
                    matchedOrientation=int((inverted and (geneOrientations[minGeneId]!=geneOrientations[maxGeneId]))
                                           or (not inverted and (geneOrientations[minGeneId]==geneOrientations[maxGeneId]))
                                           or geneOrientations[minGeneId]==0
                                           or geneOrientations[maxGeneId]==0)
                    pairKey=(minGeneId,maxGeneId,matchedOrientation,donor)
                    if pairKey not in self.previousFusions:
                        print(minGene,maxGene,matchedOrientation,donor,sep='\t', file=cohortGeneFusionsHandle)
                        self.previousFusions.add(pairKey)
            outputChunks = [self.chrToIndex[chr1],
                            self.chrToIndex[chr2],
                            pos1,
                            pos2,
                            eventScore,
                            eventID,
                            "{0:.2f}".format(round(clonality,2)),
                            source1,
                            source2,
                            overhang1,
                            overhang2,
                            findCytobandIndex(self.chrToIndex[chr1],pos1),
                            findCytobandIndex(self.chrToIndex[chr2],pos2),
                            gene1,
                            cancerGene1,
                            geneNameToEnsembl.geneNameToEnsembl[nearestGeneUpstream1] if nearestGeneUpstream1 in geneNameToEnsembl.geneNameToEnsembl else nearestGeneUpstream1,
                            nearestGeneUpstreamDistance1,
                            geneNameToEnsembl.geneNameToEnsembl[nearestCancerGeneUpstream1] if nearestCancerGeneUpstream1 in geneNameToEnsembl.geneNameToEnsembl else nearestCancerGeneUpstream1,
                            nearestCancerGeneUpstreamDistance1,
                            geneNameToEnsembl.geneNameToEnsembl[nearestGeneDownstream1] if nearestGeneDownstream1 in geneNameToEnsembl.geneNameToEnsembl else nearestGeneDownstream1,
                            nearestGeneDownstreamDistance1,
                            geneNameToEnsembl.geneNameToEnsembl[nearestCancerGeneDownstream1] if nearestCancerGeneDownstream1 in geneNameToEnsembl.geneNameToEnsembl else nearestCancerGeneDownstream1,
                            nearestCancerGeneDownstreamDistance1,
                            gene2,
                            cancerGene2,
                            geneNameToEnsembl.geneNameToEnsembl[nearestGeneUpstream2] if nearestGeneUpstream2 in geneNameToEnsembl.geneNameToEnsembl else nearestGeneUpstream2,
                            nearestGeneUpstreamDistance2,
                            geneNameToEnsembl.geneNameToEnsembl[nearestCancerGeneUpstream2] if nearestCancerGeneUpstream2 in geneNameToEnsembl.geneNameToEnsembl else nearestCancerGeneUpstream2,
                            nearestCancerGeneUpstreamDistance2,
                            geneNameToEnsembl.geneNameToEnsembl[nearestGeneDownstream2] if nearestGeneDownstream2 in geneNameToEnsembl.geneNameToEnsembl else nearestGeneDownstream2,
                            nearestGeneDownstreamDistance2,
                            geneNameToEnsembl.geneNameToEnsembl[nearestCancerGeneDownstream2] if nearestCancerGeneDownstream2 in geneNameToEnsembl.geneNameToEnsembl else nearestCancerGeneDownstream2,
                            nearestCancerGeneDownstreamDistance2,
                            dbSuperEntries1,
                            dbSuperEntries2,
                            findFragileSiteIndex(self.chrToIndex[chr1], pos1),
                            findFragileSiteIndex(self.chrToIndex[chr2], pos2),
                            0,
                            maxIntraSampleRecurrence,
                            self.chrToIndex[preRemapChr1Out] if preRemapChr1Out!="." else ".",
                            self.chrToIndex[preRemapChr2Out] if preRemapChr2Out!="." else ".",
                            preRemapPos1Out,
                            preRemapPos2Out,
                            directHits,
                            tadIndicesOffset0,
                            tadIndicesOffset1,
                            tadIndicesOffset2,
                            tadIndicesOffset3,
                            donor]
            if "!" in tadIndices:
                print(*outputChunks, sep='\t', file=cohortMidSizeSvsHandle)
            else:
                print(*outputChunks, sep='\t', file=cohortAllSvsHandle)


svProcessor = SvProcessor()
with open(sophiaResultFiles) as sophiaFileListHandle:
    for svFileLine in sophiaFileListHandle:
        inputPath, donorId = svFileLine.rstrip().split('\t')
        tinCase=exists(dirname(inputPath)+"/warningTIN")
        print(inputPath,inputPath,dirname(inputPath)+"/warningTIN",tinCase,file=stderr)
        svProcessor.processDonor(inputPath,tinCase, donorId)
cohortAllSvsHandle.close()
cohortMidSizeSvsHandle.close()
