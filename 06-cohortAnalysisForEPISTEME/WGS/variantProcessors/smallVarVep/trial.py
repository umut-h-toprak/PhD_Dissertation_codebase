from gzip import open as gzopen
from sys import argv

print(
"#id",
"Allele",
"Consequence",
"IMPACT",
"SYMBOL",
"Gene",
"Feature_type",
"Feature",
"BIOTYPE",
"EXON",
"INTRON",
"HGVSc",
"HGVSp",
"cDNA_position",
"CDS_position",
"Protein_position",
"Amino_acids",
"Codons",
"Existing_variation",
"DISTANCE",
"STRAND",
"FLAGS",
"SYMBOL_SOURCE",
"HGNC_ID",
"ENSP",
"REFSEQ_MATCH",
"SOURCE",
"SIFT",
"PolyPhen",
"HGVS_OFFSET",
"CLIN_SIG",
"SOMATIC",
"PHENO",
"MOTIF_NAME",
"MOTIF_POS",
"HIGH_INF_POS",
"MOTIF_SCORE_CHANGE",
sep='\t')

class VepAnnotationItem():
    def __init__(self,annotationLine,chromosome,position):
        lineChunks=annotationLine.rstrip().split('|')
        self.Allele=lineChunks[0]
        self.Consequence=lineChunks[1]
        self.IMPACT=lineChunks[2]
        self.SYMBOL=lineChunks[3]
        self.Gene=lineChunks[4]
        self.Feature_type=lineChunks[5]
        self.Feature=lineChunks[6]
        self.BIOTYPE=lineChunks[7]
        self.EXON=lineChunks[8]
        self.INTRON=lineChunks[9]
        self.HGVSc=lineChunks[10]
        self.HGVSp=lineChunks[11]
        self.cDNA_position=lineChunks[12]
        self.CDS_position=lineChunks[13]
        self.Protein_position=lineChunks[14]
        self.Amino_acids=lineChunks[15]
        self.Codons=lineChunks[16]
        self.Existing_variation=lineChunks[17]
        self.DISTANCE=lineChunks[18]
        self.STRAND=lineChunks[19]
        self.FLAGS=lineChunks[20]
        self.SYMBOL_SOURCE=lineChunks[21]
        self.HGNC_ID=lineChunks[22]
        self.ENSP=lineChunks[23]
        self.REFSEQ_MATCH=lineChunks[24]
        self.SOURCE=lineChunks[25]
        self.SIFT=lineChunks[26]
        self.PolyPhen=lineChunks[27]
        self.HGVS_OFFSET=lineChunks[28]
        self.CLIN_SIG=lineChunks[29]
        self.SOMATIC=lineChunks[30]
        self.PHENO=lineChunks[31]
        self.MOTIF_NAME=lineChunks[32]
        self.MOTIF_POS=lineChunks[33]
        self.HIGH_INF_POS=lineChunks[34]
        self.MOTIF_SCORE_CHANGE=lineChunks[35]
        self.id=chromosome+"_"+position+"_"+self.Allele
        self.valid=self.SOURCE != "RefSeq"
    def printAnnotation(self):
        if self.valid:
            print(self.id,
            self.Allele,
            self.Consequence,
            self.IMPACT,
            self.SYMBOL,
            self.Gene,
            self.Feature_type,
            self.Feature,
            self.BIOTYPE,
            self.EXON,
            self.INTRON,
            self.HGVSc,
            self.HGVSp,
            self.cDNA_position,
            self.CDS_position,
            self.Protein_position,
            self.Amino_acids,
            self.Codons,
            self.Existing_variation,
            self.DISTANCE,
            self.STRAND,
            self.FLAGS,
            self.SYMBOL_SOURCE,
            self.HGNC_ID,
            self.ENSP,
            self.REFSEQ_MATCH,
            self.SOURCE,
            self.SIFT,
            self.PolyPhen,
            self.HGVS_OFFSET,
            self.CLIN_SIG,
            self.SOMATIC,
            self.PHENO,
            self.MOTIF_NAME,
            self.MOTIF_POS,
            self.HIGH_INF_POS,
            self.MOTIF_SCORE_CHANGE,
            sep='\t')

with gzopen(argv[1],'rt') as f:
    infoColIndex=0
    headerAssigned=False
    for line in f:
        if not headerAssigned:
            if line[:2]=='##':
                continue            
            if line[:6]=="#CHROM":
                headerChunks=line.rstrip().split('\t')
                for i in range(len(headerChunks)):
                    if headerChunks[i]=="INFO":
                        infoColIndex=i
                        headerAssigned=True
                        break
        else:
            currentVariantChunks=line.rstrip().split('\t')
            chrom=currentVariantChunks[0]
            pos=currentVariantChunks[1]
            infoDataChunks=currentVariantChunks[infoColIndex].split(';')
            for chunk in infoDataChunks:
                if chunk[:3]=="CSQ":
                    vepAnno=chunk.split('=')[1]
                    annoItem=VepAnnotationItem(vepAnno,chrom,pos)
                    annoItem.printAnnotation()
