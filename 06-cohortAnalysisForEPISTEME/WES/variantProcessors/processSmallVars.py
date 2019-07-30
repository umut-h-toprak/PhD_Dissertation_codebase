from gzip import open as gzopen
from sys import argv,stderr
from common import tools
from outputHeaders import getSnvHeader,getIndelHeader


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


mesoMode="mutect2" in somaticSmallVariants


variantTypeConverter={
"3'UTR":"UTR3",
"3'Flank":"downstream",
"5'Flank":"upstream",
"5'UTR":"UTR5",
"De_novo_Start_InFrame":"nonframeshift",
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
variantTypeConverterMeso={
"3_prime_UTR_variant":"UTR3",
"3_prime_UTR_variant;NMD_transcript_variant":"UTR3",
"5_prime_UTR_variant":"UTR5",
"coding_sequence_variant;3_prime_UTR_variant":"UTR3",
"downstream_gene_variant":"downstream",
"frameshift_variant":"frameshift",
"frameshift_variant;splice_region_variant":"frameshift",
"frameshift_variant;start_lost":"frameshift",
"frameshift_variant;stop_lost":"frameshift",
"inframe_deletion":"nonframeshift",
"inframe_insertion":"nonframeshift",
"intron_variant":"",
"intron_variant;NMD_transcript_variant":"",
"intron_variant;non_coding_transcript_variant":"",
"mature_miRNA_variant":"ncRNA_exonic",
"missense_variant":"nonsynonymous",
"missense_variant;NMD_transcript_variant":"nonsynonymous",
"missense_variant;splice_region_variant":"nonsynonymous",
"non_coding_transcript_exon_variant;non_coding_transcript_variant":"ncRNA_exonic",
"protein_altering_variant":"nonsynonymous",
"splice_acceptor_variant":"splicing",
"splice_acceptor_variant;coding_sequence_variant":"splicing",
"splice_acceptor_variant;coding_sequence_variant;intron_variant":"splicing",
"splice_acceptor_variant;intron_variant":"splicing",
"splice_donor_variant":"splicing",
"splice_donor_variant;coding_sequence_variant":"splicing",
"splice_donor_variant;coding_sequence_variant;intron_variant":"splicing",
"splice_donor_variant;splice_acceptor_variant;coding_sequence_variant;intron_variant":"splicing",
"splice_region_variant;3_prime_UTR_variant":"UTR3",
"splice_region_variant;5_prime_UTR_variant":"UTR5",
"splice_region_variant;intron_variant":"splicing",
"splice_region_variant;intron_variant;non_coding_transcript_variant":"splicing",
"splice_region_variant;synonymous_variant":"splicing",
"start_lost":"stopgain",
"stop_gained":"stopgain",
"stop_gained;frameshift_variant":"stopgain",
"stop_gained;protein_altering_variant":"stopgain",
"stop_gained;splice_region_variant":"stopgain",
"stop_lost":"stoploss",
"synonymous_variant":"synonymous",
"synonymous_variant;NMD_transcript_variant":"synonymous",
"upstream_gene_variant":"upstream"
}

cohortAllSnvsHandle = open(cohortAllSnvsFile , 'w')
cohortAllIndelsHandle = open(cohortAllIndelsFile , 'w')


print(*getSnvHeader(), sep='\t', file=cohortAllSnvsHandle)
print(*getIndelHeader(), sep='\t', file=cohortAllIndelsHandle)

class SmallVarProcessor:
    def __init__(self):
        self.codingGeneDb=set()
        self.tads = []
        self.snvIndex=0
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
        chromosome = smallVarLineChunks[4]
        if chromosome not in self.chrToIndex:
            return
        pos = int(smallVarLineChunks[5])
        ref = smallVarLineChunks[11].replace("_","")
        alt = smallVarLineChunks[12].replace("_","")
        donor='-'.join(smallVarLineChunks[15].split('-')[:4])
        if not donor[-1].isdigit():
                donor=donor[:-1]
        variantSuffix=""
        snvMode=False
        if len(ref) == len(alt):
            variantSuffix=" SNV"
            snvMode=True
        elif len(ref)>len(alt):
            variantSuffix=" deletion"
        else:
            variantSuffix=" insertion"
        variantType = variantTypeConverter[smallVarLineChunks[8]]
        if variantType=="":
            return
        variantType+=variantSuffix
        if variantType == "frameshift SNV":
            variantType="stopgain SNV"
        elif variantType == "nonframeshift SNV":
            variantType="nonsynonymous SNV"
        transcript=smallVarLineChunks[35].split('.')[0]
        if transcript not in ensemblTranscriptToGene:
            return
        gene=ensemblTranscriptToGene[transcript]
        if snvMode:
            outputChunks = [self.chrToIndex[chromosome],
                        pos,
                        ref,
                        alt,
                        gene,
                        variantType,
                        self.snvIndex,
                        donor]
            self.snvIndex+=1
            print(*outputChunks, sep='\t', file=cohortAllSnvsHandle)
        else:
            outputChunks = [self.chrToIndex[chromosome],
                        pos,
                        ref,
                        alt,
                        gene,
                        variantType,
                        donor]
            self.snvIndex+=1
            print(*outputChunks, sep='\t', file=cohortAllIndelsHandle)
    def processLineMeso(self, lineIn):
        smallVarLineChunks = lineIn.rstrip().split('\t')
        chromosome = smallVarLineChunks[2].lstrip("chr")
        if smallVarLineChunks[9]!="PASS":
            return
        if chromosome not in self.chrToIndex:
            return
        pos = int(smallVarLineChunks[3])
        ref = smallVarLineChunks[5].replace("-","")
        alt = smallVarLineChunks[6].replace("-","")
        donor=smallVarLineChunks[0]
        if not donor[-1].isdigit():
                donor=donor[:-1]
        variantSuffix=""
        snvMode=False
        if len(ref) == len(alt):
            variantSuffix=" SNV"
            snvMode=True
        elif len(ref)>len(alt):
            variantSuffix=" deletion"
        else:
            variantSuffix=" insertion"
        variantType = variantTypeConverterMeso[smallVarLineChunks[8]]
        if variantType=="":
            return
        variantType+=variantSuffix
        if variantType == "nonsynonymous insertion":
            variantType="nonframeshift insertion"
        elif variantType == "nonsynonymous deletion":
            variantType="nonframeshift deletion"
        genePre=smallVarLineChunks[1]
        if genePre not in geneNameToEnsembl.geneNameToEnsembl:
            return
        genes=geneNameToEnsembl.geneNameToEnsembl[genePre]
        if snvMode:
            outputChunks = [self.chrToIndex[chromosome],
                        pos,
                        ref,
                        alt,
                        genes,
                        variantType,
                        self.snvIndex,
                        donor]
            self.snvIndex+=1
            print(*outputChunks, sep='\t', file=cohortAllSnvsHandle)
        else:
            outputChunks = [self.chrToIndex[chromosome],
                        pos,
                        ref,
                        alt,
                        genes,
                        variantType,
                        donor]
            print(*outputChunks, sep='\t', file=cohortAllIndelsHandle)

smallVarProcessor = SmallVarProcessor()

if mesoMode:
    geneNameToEnsembl=tools.GeneNameToEnsemblConverter(ensemblIdToGeneSymbolFile,refseqToEnsemblFile,ncbiSynonymsFile,refGenes)
    with gzopen(somaticSmallVariants,'rt') as f:
        for line in f:
            smallVarProcessor.processLineMeso(line)
else:
    ensemblTranscriptToGene=dict()
    with open(ensemblTranscriptToGeneFile) as f:
        for line in f:
            lineChunks=line.rstrip().split('\t')
            ensemblTranscriptToGene[lineChunks[0]]=lineChunks[1]
    with gzopen(somaticSmallVariants,'rt') as f:
        for line in f:
            smallVarProcessor.processLine(line)

cohortAllSnvsHandle.close()
cohortAllIndelsHandle.close()
