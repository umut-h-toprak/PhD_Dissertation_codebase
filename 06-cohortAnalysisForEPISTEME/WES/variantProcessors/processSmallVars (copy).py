from gzip import open as gzopen
from sys import argv
from common import tools
from outputHeaders import getSnvHeader


somaticSmallVariants= argv[1]
vocabChromosomes=argv[2]
consensusTadFile = argv[3]
roadmapEnhancersFile = argv[4]
ensemblIdToGeneSymbolFile = argv[5]
refseqToEnsemblFile = argv[6]
ncbiSynonymsFile = argv[7]
ensemblTranscriptToGeneFile=argv[8]
cohortAllSnvsFile = argv[9]
cohortAllIndelsFile = argv[10]
refGenes=argv[11]


variantTypeConverter={
"3'UTR":"UTR3",
"3'Flank":"downstream",
"5'Flank":"upstream",
"5'UTR":"UTR5",
"De_novo_Start_InFrame":"nonframeshift"
"De_novo_Start_OutOfFrame":"stopgain",
"Frame_Shift_Del":"frameshift",
"Frame_Shift_Ins":"frameshift",
"IGR":"",
"In_Frame_Del":"nonframeshift",
"In_Frame_Ins":"nonframeshift",
"Intron":"",
"lincRNA":"ncRNA_exonic",
"Missense_Mutation":"nonsynonymous",
"Nonsense_Mutation":"stopgain",
"Nonstop_Mutation":"stoploss",
"RNA":"ncRNA_exonic",
"Silent":"synonymous",
"Splice_Site":"splicing",
"Start_Codon_Del":"stopgain",
"Start_Codon_Ins":"stopgain",
"Start_Codon_SNP":"stopgain",
"Stop_Codon_Del":"stoploss",
"Stop_Codon_Ins":"stoploss",
"Stop_Codon_SNP":"stoploss"
}


geneNameToEnsembl=tools.GeneNameToEnsemblConverter(ensemblIdToGeneSymbolFile,refseqToEnsemblFile,ncbiSynonymsFile,refGenes)
cohortAllSnvsHandle = open(cohortAllSnvsFile , 'w')
cohortAllIndelsHandle = open(cohortAllIndelsFile , 'w')

ensemblTranscriptToGene=dict()
with open(ensemblTranscriptToGeneFile) as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        ensemblTranscriptToGeneFile[lineChunks[0]]=lineChunks[1]

print(*getSnvHeader(), sep='\t', file=cohortAllSnvsHandle)
print(*getSnvHeader(), sep='\t', file=cohortAllIndelsHandle)

class SmallVarProcessor:
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
        self.chrToIndex = dict()
        with open(vocabChromosomes) as f:
            next(f)
            for line in f:
                lineChunks = line.rstrip().split('\t')
                self.chrToIndex[lineChunks[0]] = int(lineChunks[1])
    def processLine(self, lineIn):
        smallVarLineChunks = lineIn.rstrip().split('\t')
        chromosome = smallVarLineChunks[3]
        if chromosome not in self.chrToIndex:
            return
        pos = int(smallVarLineChunks[5])
        ref = smallVarLineChunks[10]
        alt = smallVarLineChunks[11]
        donor='-'.join(smallVarLineChunks[14].split('-')[:4])
        variantSuffix=""
        snvMode=False
        if len(ref) == len(alt):
            variantSuffix=" SNV"
            snvMode=True
        elif len(ref)>len(alt):
            variantSuffix=" deletion"
        else:
            variantSuffix=" insertion"
        variantType = variantTypeConverter[smallVarLineChunks[7]
        
        if variantType=="":
            return
        variantType+=variantSuffix
        transcript=smallVarLineChunks[35].split('.')[0]
        if transcript not in ensemblTranscriptToGene:
            return
        gene=ensemblTranscriptToGene[transcript]
        outputChunks = [self.chrToIndex[chromosome],
                        pos,
                        ref,
                        alt,
                        ','.join(genesFiltered),
                        variantType,
                        donor]
        if snvMode:
            print(*outputChunks, sep='\t', file=cohortAllSnvsHandle)
        else:
            print(*outputChunks, sep='\t', file=cohortAllIndelsHandle)

smallVarProcessor = SmallVarProcessor()

with gzopen(somaticSmallVariants,'rt') as f:
    for line in f:
        smallVarProcessor.processLine(line)

cohortAllSnvsHandle.close()
cohortAllIndelsHandle.close()
