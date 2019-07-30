from gzip import open as gzopen
from sys import argv
from common import tools
from outputHeaders import getSnvHeader

somaticSnvResultFiles = argv[1]
vocabChromosomes=argv[2]
consensusTadFile = argv[3]
roadmapEnhancersFile = argv[4]
ensemblIdToGeneSymbolFile = argv[5]
refseqToEnsemblFile = argv[6]
ncbiSynonymsFile = argv[7]
cohortAllSnvsFile = argv[8]
refGenes=argv[9]


geneNameToEnsembl=tools.GeneNameToEnsemblConverter(ensemblIdToGeneSymbolFile,refseqToEnsemblFile,ncbiSynonymsFile,refGenes)
cohortAllSnvsHandle = open(cohortAllSnvsFile , 'w')
print(*getSnvHeader(), sep='\t', file=cohortAllSnvsHandle)

class SnvProcessor:
    def __init__(self):
        self.codingGeneDb=set()
        self.tads = []
        with open(consensusTadFile) as f:
            for line in f:
                lineChunks = line.rstrip().split('\t')
                allGenes=lineChunks[5]
                if allGenes!=".":
                    for gene in allGenes.split(','):
                        geneChunks=gene.split(';')
                        if geneChunks[1]=="protein_coding":
                            self.codingGeneDb.add(geneChunks[0])
                cancerGenes = lineChunks[6]
                if cancerGenes!=".":
                    for gene in cancerGenes.split(','):
                        geneChunks=gene.split(';')
                        self.codingGeneDb.add(geneChunks[0])
                self.tads.append(tools.TAD(*lineChunks))
        self.donorIndices = dict()
        self.maxDonorIndex = 0
        self.chrToIndex = dict()
        with open(vocabChromosomes) as f:
            next(f)
            for line in f:
                lineChunks = line.rstrip().split('\t')
                self.chrToIndex[lineChunks[0]] = int(lineChunks[1])
        self.annovarFunctionCol=0
        self.geneCol=0
        self.exonicClassificationCol=0
        self.lineCount=0
    def processDonor(self, snvResults, whitelistPath, donor):
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
            self.maxDonorIndex += 1
            self.donorIndices[donor] = self.maxDonorIndex
        with gzopen(snvResults, 'rt') as f:
            header = next(f)
            while header[0]=='#' and header[1]=='#':
                header = next(f)
            headerChunks = header.rstrip().split('\t')
            for i,col in enumerate(headerChunks):
                if col=="ANNOVAR_FUNCTION":
                    self.annovarFunctionCol=i
                elif col=="GENE":
                    self.geneCol=i
                elif col=="EXONIC_CLASSIFICATION":
                    self.exonicClassificationCol=i
            for snvLine in f:
                snvLineChunks = snvLine.rstrip().split('\t')
                chromosome = snvLineChunks[0]
                pos = int(snvLineChunks[1])
                if chromosome in whitelistedPositions:
                    if pos in whitelistedPositions[chromosome]:
                        self.processLine(snvLineChunks, donor)

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
    def processLine(self, snvLineChunks, donorIn):
        chromosome = snvLineChunks[0]
        if chromosome not in self.chrToIndex:
            return
        pos = int(snvLineChunks[1])
        ref = snvLineChunks[3]
        altPre = snvLineChunks[4]
        annovarFunction = snvLineChunks[self.annovarFunctionCol]
        exonicClassification = annovarFunction
        toSkip="."
        if annovarFunction in {"intergenic", "intronic", "ncRNA_intronic"}:
            toSkip="SKIP"
        if snvLineChunks[self.exonicClassificationCol]!=".":
            exonicClassification = snvLineChunks[self.exonicClassificationCol]
        genesFiltered = []
        genes=[x.split('(')[0] for x in self.remove_text_inside_brackets(snvLineChunks[self.geneCol]).split(',')]
        for i,gene in enumerate(genes):
            if gene in geneNameToEnsembl.geneNameToEnsembl:
                ensemblId=geneNameToEnsembl.geneNameToEnsembl[gene]
                if ensemblId in self.codingGeneDb:
                    genesFiltered.append(ensemblId)
        if len(genesFiltered)==0:
            toSkip="SKIP"
        exonicClassificationSubs=exonicClassification.split(';')
        alts=altPre.split(',')
        for alt in alts:
            for exonicClassificationSub in exonicClassificationSubs:
                if "SNV" not in exonicClassificationSub:
                    exonicClassificationSub+=" SNV"
                outputChunks = [self.chrToIndex[chromosome],
                                pos,
                                ref,
                                alt,
                                ','.join(genesFiltered),
                                exonicClassificationSub,
                                toSkip,
                                self.lineCount,
                                donorIn]
                self.lineCount+=1
                print(*outputChunks, sep='\t', file=cohortAllSnvsHandle)

snvProcessor = SnvProcessor()

with open(somaticSnvResultFiles) as somaticSnvFileListHandle:
    cohortWideIndels = dict()
    for somaticSnvFileLine in somaticSnvFileListHandle:
        snvResults, whitelistPath, whitelistPathStrict, donor = somaticSnvFileLine.rstrip().split('\t')
        snvProcessor.processDonor(snvResults, whitelistPathStrict, donor)
cohortAllSnvsHandle.close()