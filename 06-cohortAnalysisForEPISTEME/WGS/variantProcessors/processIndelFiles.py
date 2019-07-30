from gzip import open as gzopen
from sys import argv
from common import tools
from outputHeaders import getIndelHeader


somaticIndelResultFiles = argv[1]
refChromosomes=argv[2]
consensusTadFile = argv[3]
roadmapEnhancersFile = argv[4]
ensemblIdToGeneSymbolFile = argv[5]
refseqToEnsemblFile = argv[6]
ncbiSynonymsFile = argv[7]
cohortAllIndelsFile = argv[8]
refGenes = argv[9]


bpDigitizer=tools.BpDigitizer(roadmapEnhancersFile, consensusTadFile, refChromosomes)
geneNameToEnsembl=tools.GeneNameToEnsemblConverter(ensemblIdToGeneSymbolFile,refseqToEnsemblFile,ncbiSynonymsFile,refGenes)
cohortAllIndelsHandle = open(cohortAllIndelsFile , 'w')
print(*getIndelHeader(), sep='\t', file=cohortAllIndelsHandle)

class IndelProcessor:
    def __init__(self):
        self.tads = []
        with open(consensusTadFile) as f:
            for line in f:
                lineChunks = line.rstrip().split('\t')
                self.tads.append(tools.TAD(*lineChunks))
        self.donorIndices = dict()
        self.maxPidIndex = 0
        self.chrToIndex = dict()
        with open(refChromosomes) as f:
            next(f)
            for line in f:
                lineChunks = line.rstrip().split('\t')
                self.chrToIndex[lineChunks[0]] = int(lineChunks[1])
        self.annovarFunctionCol=0
        self.geneCol=0
        self.exonicClassificationCol=0
        self.dbsnpCol=0
        self.confidenceCol=0
        self.regionConfidenceCol=0
    def processDonor(self, indelResults, whitelistPath, donor):
        whitelistedPositions = dict()
        with gzopen(whitelistPath, 'rt') as f:
            for line in f:
                lineChunks = line.rstrip().split('\t')
                chromosome = lineChunks[0]
                if chromosome not in whitelistedPositions:
                    whitelistedPositions[chromosome] = set()
                pos = int(lineChunks[1])
                whitelistedPositions[chromosome].add(pos)
        if donor not in self.donorIndices:
            self.maxPidIndex += 1
            self.donorIndices[donor] = self.maxPidIndex
        with gzopen(indelResults, 'rt') as f:
            header = next(f)
            headerChunks = header.rstrip().split('\t')
            for i,col in enumerate(headerChunks):
                if col=="ANNOVAR_FUNCTION":
                    self.annovarFunctionCol=i
                elif col=="GENE":
                    self.geneCol=i
                elif col=="EXONIC_CLASSIFICATION":
                    self.exonicClassificationCol=i
                elif col == "DBSNP":
                    self.dbsnpCol = i
                elif col == "CONFIDENCE":
                    self.confidenceCol = i
                elif col == "REGION_CONFIDENCE":
                    self.regionConfidenceCol = i
            for indelLine in f:
                indelLineChunks = indelLine.rstrip().split('\t')
                chromosome = indelLineChunks[0]
                pos = int(indelLineChunks[1])
                if chromosome in whitelistedPositions:
                    if pos in whitelistedPositions[chromosome]:
                        self.processLine(indelLineChunks, donor)

    @staticmethod
    def remove_text_inside_brackets(text, brackets="()"):
        count = [0] * (len(brackets) // 2)
        saved_chars = []
        for character in text:
            for i, b in enumerate(brackets):
                if character == b:
                    kind, is_close = divmod(i, 2)
                    count[kind] += (-1) ** is_close
                    if count[kind] < 0:
                        count[kind] = 0
                    else:
                        break
            else:
                if not any(count):
                    saved_chars.append(character)
        return ''.join(saved_chars)
    def processLine(self, indelLineChunks, donorIn):
        chromosome = indelLineChunks[0]
        if chromosome not in self.chrToIndex:
            return
        dbsnpHit=indelLineChunks[self.dbsnpCol]!="."
        confidence=int(indelLineChunks[self.confidenceCol])
        regionConfidence=int(indelLineChunks[self.regionConfidenceCol])

        artifactEvidenceLevel=0
        if dbsnpHit:
            artifactEvidenceLevel+=1
        if confidence<10:
            artifactEvidenceLevel+=1
        if regionConfidence<9:
            artifactEvidenceLevel+=1
        if artifactEvidenceLevel>1:
            return
        pos = int(indelLineChunks[1])
        ref = indelLineChunks[3]
        alt = indelLineChunks[4]
        annovarFunction = indelLineChunks[self.annovarFunctionCol]
        exonicClassification = annovarFunction
        toSkip = "."
        if annovarFunction in {"intergenic", "intronic", "ncRNA_intronic"} and abs(len(ref) - len(alt)) < 5:
            toSkip="SKIP"
        if annovarFunction !="intergenic" and indelLineChunks[self.exonicClassificationCol]!=".":
            exonicClassification = indelLineChunks[self.exonicClassificationCol]
        genesFiltered="."
        genes=set()
        if annovarFunction != "intergenic":
            genesFiltered = []
            genes={x.split('(')[0] for x in self.remove_text_inside_brackets(indelLineChunks[self.geneCol]).split(',')}
            for i,gene in enumerate(genes):
                if gene in geneNameToEnsembl.geneNameToEnsembl:
                    genesFiltered.append(geneNameToEnsembl.geneNameToEnsembl[gene])
        tadIndicesOffset0 = "."
        tadIndicesOffset1 = "."
        tadIndicesOffset2 = "."
        tadIndicesOffset3 = "."

        if abs(len(ref) - len(alt)) > 4:
            tadIndices = bpDigitizer.processSingleBp(chromosome, pos, genes)
            tadIndicesOffset0 = [str(x) for x in sorted(list({x.tadIndex for x in tadIndices.values() if x.offset == 0}))]
            if len(tadIndicesOffset0) == 0:
                tadIndicesOffset0 = "."
            else:
                tadIndicesOffset0 = ';'.join(tadIndicesOffset0)
            tadIndicesOffset1 = [str(x) for x in sorted(list({x.tadIndex for x in tadIndices.values() if x.offset == 1}))]
            if len(tadIndicesOffset1) == 0:
                tadIndicesOffset1 = "."
            else:
                tadIndicesOffset1 = ';'.join(tadIndicesOffset1)
            tadIndicesOffset2 = [str(x) for x in sorted(list({x.tadIndex for x in tadIndices.values() if x.offset == 2}))]
            if len(tadIndicesOffset2) == 0:
                tadIndicesOffset2 = "."
            else:
                tadIndicesOffset2 = ';'.join(tadIndicesOffset2)
            tadIndicesOffset3 = [str(x) for x in sorted(list({x.tadIndex for x in tadIndices.values() if x.offset == 3}))]
            if len(tadIndicesOffset3) == 0:
                tadIndicesOffset3 = "."
            else:
                tadIndicesOffset3 = ';'.join(tadIndicesOffset3)
        exonicClassificationSubs=exonicClassification.split(';')
        for exonicClassificationSub in exonicClassificationSubs:
            if len(alt)>len(ref):
                if "insertion" not in exonicClassificationSub:
                    exonicClassificationSub+=" insertion"
            if len(alt)<len(ref):
                if "deletion" not in exonicClassificationSub:
                    exonicClassificationSub+=" deletion"
            outputChunks = [self.chrToIndex[chromosome],
                            pos,
                            ref,
                            alt,
                            ','.join(genesFiltered) if len(genesFiltered)>0 else ".",
                            exonicClassificationSub,
                            tadIndicesOffset0,
                            tadIndicesOffset1,
                            tadIndicesOffset2,
                            tadIndicesOffset3,
                            toSkip,
                            donorIn]
            print(*outputChunks, sep='\t', file=cohortAllIndelsHandle)

indelProcessor = IndelProcessor()


with open(somaticIndelResultFiles) as somaticIndelFileListHandle:
    cohortWideIndels = dict()
    for somaticIndelFileLine in somaticIndelFileListHandle:
        indelResultsIn, whitelistPath, whitelistPathStrict, donor = somaticIndelFileLine.rstrip().split('\t')
        indelProcessor.processDonor(indelResultsIn, whitelistPathStrict, donor)
cohortAllIndelsHandle.close()